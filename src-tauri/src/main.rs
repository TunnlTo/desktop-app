// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::ffi::c_void;
use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::mem::size_of;
use std::os::windows::prelude::{AsRawHandle, RawHandle};
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::{Command, Stdio};
extern crate winreg;
use lazy_static::lazy_static;
use once_cell::sync::OnceCell;
use serde::Serialize;
use std::sync::Mutex;
use sysinfo::{System, SystemExt};
use tauri::Manager;
use tauri::{CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_window_state::{AppHandleExt, StateFlags};
use windows::{
    core::PCSTR,
    Win32::Foundation::{CloseHandle, GetLastError, HANDLE, INVALID_HANDLE_VALUE, WIN32_ERROR},
    Win32::System::JobObjects::{
        AssignProcessToJobObject, CreateJobObjectA, JobObjectExtendedLimitInformation,
        SetInformationJobObject, JOBOBJECT_BASIC_LIMIT_INFORMATION,
        JOBOBJECT_EXTENDED_LIMIT_INFORMATION, JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
    },
    Win32::System::Threading::GetCurrentProcessId,
};
use winreg::enums::*;
use winreg::RegKey;

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

#[derive(Debug)]
struct ChildProcessTracker {
    job_handle: HANDLE,
}

impl ChildProcessTracker {
    fn new() -> Result<Self, WIN32_ERROR> {
        let job_name = format!("ChildProcessTracker{}\0", unsafe { GetCurrentProcessId() });
        let job_handle = match unsafe {
            CreateJobObjectA(None, PCSTR::from_raw(job_name.as_bytes().as_ptr()))
        } {
            Ok(handle) => handle,
            Err(_) => return Err(unsafe { GetLastError() }),
        };

        let job_object_info = JOBOBJECT_BASIC_LIMIT_INFORMATION {
            LimitFlags: JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
            ..Default::default()
        };

        let job_object_ext_info = JOBOBJECT_EXTENDED_LIMIT_INFORMATION {
            BasicLimitInformation: job_object_info,
            ..Default::default()
        };

        let result = unsafe {
            SetInformationJobObject(
                job_handle,
                JobObjectExtendedLimitInformation,
                &job_object_ext_info as *const JOBOBJECT_EXTENDED_LIMIT_INFORMATION
                    as *const c_void,
                size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
            )
        };

        if result.as_bool() {
            Ok(Self { job_handle })
        } else {
            unsafe { CloseHandle(job_handle) };
            Err(unsafe { GetLastError() })
        }
    }

    pub fn add_process(&self, process_handle: RawHandle) -> Result<(), WIN32_ERROR> {
        if process_handle.is_null() {
            return Err(unsafe { GetLastError() });
        }

        let result = unsafe {
            AssignProcessToJobObject(
                self.job_handle,
                HANDLE(process_handle as *const c_void as isize),
            )
        };

        if result.as_bool() {
            Ok(())
        } else {
            Err(unsafe { GetLastError() })
        }
    }

    pub fn global() -> Option<&'static ChildProcessTracker> {
        CHILD_PROCESS_TRACKER.get()
    }
}

impl Drop for ChildProcessTracker {
    fn drop(&mut self) {
        if self.job_handle != INVALID_HANDLE_VALUE {
            unsafe { CloseHandle(self.job_handle) };
        }
    }
}

static CHILD_PROCESS_TRACKER: OnceCell<ChildProcessTracker> = OnceCell::new();

struct WiresockEnablingGuard;

impl Drop for WiresockEnablingGuard {
    fn drop(&mut self) {
        let mut state = WIRESOCK_STATE.lock().unwrap();
        state.wiresock_status = "STOPPED".to_string();
        state.tunnel_status = "DISCONNECTED".to_string();
    }
}

#[derive(Clone, Serialize, Debug)]
struct WiresockState {
    tunnel_id: String,
    wiresock_status: String,
    tunnel_status: String,
    logs: Vec<String>,
}

impl WiresockState {
    fn new() -> Self {
        WiresockState {
            tunnel_id: String::new(),
            wiresock_status: "STOPPED".to_string(),
            tunnel_status: "DISCONNECTED".to_string(),
            logs: Vec::new(),
        }
    }
}

lazy_static! {
    static ref WIRESOCK_STATE: Mutex<WiresockState> = Mutex::new(WiresockState::new());
}

mod tunnel;
use tunnel::Tunnel;
#[tauri::command]
async fn enable_wiresock(tunnel: Tunnel, app_handle: tauri::AppHandle) -> Result<(), String> {
    // Check if enable_wiresock is already running
    {
        let state = WIRESOCK_STATE.lock().unwrap();
        if state.wiresock_status != "STOPPED" {
            println!("wiresock_state at start of enable_wiresock is {:?}", &*state);
            return Err("enable_wiresock is already running".into());
        }
    }

    // Update the WIRESOCK_STATE and emit the change
    update_state(&app_handle, |state| {
        state.tunnel_id = tunnel.id.clone();
        state.wiresock_status = "STARTING".to_string();
        state.tunnel_status = "DISCONNECTED".to_string();
        state.logs = Vec::new();
    });

    // Create a guard that will reset the wiresock_status when dropped
    let _guard = WiresockEnablingGuard;

    // Get the users home directory
    let mut tunnel_config_path = PathBuf::new();
    match home::home_dir() {
        Some(path) => tunnel_config_path.push(path),
        None => return Err("Unable to retrieve the user home directory.".into()),
    }

    // Create a path to the wiresock config directory
    tunnel_config_path.push("AppData");
    tunnel_config_path.push("Local");
    tunnel_config_path.push("TunnlTo");

    // Create a TunnlTo directory in appdata/local if it doesn't exist already
    fs::create_dir_all(&tunnel_config_path).unwrap_or_else(|e| panic!("Error creating dir: {}", e));

    // Create a path to the wiresock config file
    tunnel_config_path.push("tunnel.conf");

    // Write the config file to disk
    let mut w = fs::File::create(&tunnel_config_path).unwrap();

    // Interface section
    writeln!(&mut w, "[Interface]").unwrap();
    writeln!(&mut w, "PrivateKey = {}", tunnel.interface.privateKey).unwrap();
    writeln!(&mut w, "Address = {}", tunnel.interface.ipAddress).unwrap();
    if !tunnel.interface.port.is_empty() {
        writeln!(&mut w, "ListenPort = {}", tunnel.interface.port).unwrap();
    }
    if !tunnel.interface.dns.is_empty() {
        writeln!(&mut w, "DNS = {}", tunnel.interface.dns).unwrap();
    }
    if !tunnel.interface.mtu.is_empty() {
        writeln!(&mut w, "MTU = {}", tunnel.interface.mtu).unwrap();
    }

    // Put a space between the sections for readability
    writeln!(&mut w, "").unwrap();

    // Peer section
    writeln!(&mut w, "[Peer]").unwrap();
    writeln!(&mut w, "PublicKey = {}", tunnel.peer.publicKey).unwrap();
    if !tunnel.peer.presharedKey.is_empty() {
        writeln!(&mut w, "PresharedKey = {}", tunnel.peer.presharedKey).unwrap();
    }
    writeln!(
        &mut w,
        "Endpoint = {}:{}",
        tunnel.peer.endpoint, tunnel.peer.port
    )
    .unwrap();
    if !tunnel.peer.persistentKeepalive.is_empty() {
        writeln!(
            &mut w,
            "PersistentKeepalive = {}",
            tunnel.peer.persistentKeepalive
        )
        .unwrap();
    }
    if !tunnel.rules.allowed.apps.is_empty() {
        writeln!(
            &mut w,
            "AllowedApps = {} {}",
            tunnel.rules.allowed.apps, tunnel.rules.allowed.folders
        )
        .unwrap();
    }
    if !tunnel.rules.disallowed.apps.is_empty() {
        writeln!(
            &mut w,
            "DisallowedApps = {} {}",
            tunnel.rules.disallowed.apps, tunnel.rules.disallowed.folders
        )
        .unwrap();
    }
    if !tunnel.rules.allowed.ipAddresses.is_empty() {
        writeln!(&mut w, "AllowedIPs = {}", tunnel.rules.allowed.ipAddresses).unwrap();
    }
    if !tunnel.rules.disallowed.ipAddresses.is_empty() {
        writeln!(
            &mut w,
            "DisallowedIPs = {}",
            tunnel.rules.disallowed.ipAddresses
        )
        .unwrap();
    }

    // Build the full path to the wiresock executable
    let mut wiresock_location: String = get_wiresock_install_path().unwrap(); // unwrapping as we expect Wiresock is installed at this point
    let exe: &str = "/bin/wiresock-client.exe";
    wiresock_location.push_str(exe);

    // Create a string of the WireSock config file path
    let wiresock_config_path = &tunnel_config_path.into_os_string().into_string().unwrap();

    // Enable Wiresock and output the stdout
    let mut child = Command::new(wiresock_location)
        .arg("run")
        .arg("-config")
        .arg(wiresock_config_path)
        .arg("-log-level")
        .arg("debug")
        .creation_flags(0x08000000) // CREATE_NO_WINDOW - stop a command window showing
        .stdout(Stdio::piped())
        .spawn()
        .expect("Unable to start WireSock process");

    // Update the WIRESOCK_STATE and emit the change
    update_state(&app_handle, |state| {
        state.wiresock_status = "RUNNING".to_string();
    });

    // Add process to global Job object
    // This ensures if TunnlTo process finishes, wiresock will also exit
    if let Some(tracker) = ChildProcessTracker::global() {
        tracker.add_process(child.as_raw_handle()).ok();
    }

    // Process the stdout data
    if let Some(stdout) = &mut child.stdout.take() {
        let reader = BufReader::new(stdout);

        for line in reader.lines() {
            let line_string = line.unwrap();

            if line_string.is_empty() {
                continue;
            }

            if cfg!(debug_assertions) {
                println!("wiresock_log: {}", line_string);
            }

            // Update the WIRESOCK_STATE and emit the change
            update_state(&app_handle, |state| {
                if line_string.contains("Tunnel has started") {
                    state.tunnel_status = "CONNECTED".to_string();
                }

                // Append the log data to the state
                state.logs.push(line_string.clone());
            });
        }
    }

    // Handle the wiresock process stopping
    match child.wait() {
        Ok(status) => {
            println!("wiresock process exited with: {}", status);

            // Update the WIRESOCK_STATE and emit the change
            update_state(&app_handle, |state| {
                state.wiresock_status = "STOPPED".to_string();
                state.tunnel_status = "DISCONNECTED".to_string();
                state.logs.push("Tunnel Disabled. Wiresock process stopped".into())
            });
        }
        Err(e) => println!("error attempting to wait: {}", e),
    }

    println!("End of enable_wiresock function");
    Ok(())
}

fn update_state<F>(app_handle: &tauri::AppHandle, update: F)
where
    F: FnOnce(&mut WiresockState),
{
    let mut state = WIRESOCK_STATE.lock().unwrap();
    update(&mut state);
    app_handle.emit_all("wiresock_state", &*state).unwrap();
}

#[tauri::command]
fn get_wiresock_state(app_handle: tauri::AppHandle) -> Result<(), String> {
    let state = WIRESOCK_STATE.lock().unwrap();
    app_handle.emit_all("wiresock_state", &*state).unwrap();
    Ok(())
}

fn get_wiresock_install_path() -> Result<String, String> {
    // Get the Wiresock install location from the Windows registry
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);

    let subkey = match hklm.open_subkey_with_flags(
        r#"SOFTWARE\NTKernelResources\WinpkFilterForVPNClient"#,
        KEY_READ,
    ) {
        Ok(regkey) => regkey,
        Err(_err) => return Err("WIRESOCK_NOT_INSTALLED".to_string()),
    };

    let wiresock_location: String = subkey
        .get_value("InstallLocation")
        .expect("Failed to read registry key");

    Ok(wiresock_location)
}

#[tauri::command]
fn disable_wiresock() -> Result<(), String> {
    println!("Attempting to stop WireSock");
    Command::new("taskkill")
        .arg("/F")
        .arg("/IM")
        .arg("wiresock-client.exe")
        .arg("/T")
        .creation_flags(0x08000000) // CREATE_NO_WINDOW - stop a command window showing
        .spawn()
        .expect("command failed to start");

    // If killing the process was succesful, it will be emitted from the child.wait in enable_wiresock function
    Ok(())
}

#[tauri::command]
async fn install_wiresock() -> Result<String, String> {
    // Get the current directory
    let current_dir = env::current_dir().unwrap();

    // Build the path to the WireSock installer
    let wiresock_installer_path = &mut current_dir.into_os_string().into_string().unwrap();
    wiresock_installer_path.push_str(r#"\wiresock\wiresock-vpn-client-x64-1.2.32.1.msi"#);

    // Use powershell to launch msiexec so we can get the exit code to see if WireSock was installed succesfully
    let arg = format!("(Start-Process -FilePath \"msiexec.exe\" -ArgumentList \"/i\", '\"{}\"', \"/qr\" -Wait -Passthru).ExitCode", wiresock_installer_path);

    // Start the WireSock installer in quiet mode (no user prompts).
    let mut child = Command::new("powershell")
        .arg("-command")
        .arg(arg)
        .creation_flags(0x08000000) // CREATE_NO_WINDOW - stop a command window showing
        .stdout(Stdio::piped())
        .spawn()
        .expect("msiexec failed to start");

    // Check the stdout data
    if let Some(stdout) = &mut child.stdout {
        let lines = BufReader::new(stdout).lines().enumerate().take(20);
        for (counter, line) in lines {
            println!("install_wiresock: {}, {:?}", counter, line);
            match line.unwrap().as_str() {
                "0" => return Ok("WIRESOCK_INSTALLED".into()),
                "1602" => return Err("User cancelled the installation".into()),
                _ => return Err("Unknown exit code while installing WireSock".into()),
            }
        }
    }

    Err("Unknown error installing WireSock".into())
}

#[tauri::command]
fn check_wiresock_service() -> Result<String, String> {
    // Check if the wiresock service is installed
    let status = Command::new("powershell")
        .arg("-command")
        .arg("get-service")
        .arg("-name")
        .arg("wiresock-client-service")
        .creation_flags(0x08000000) // CREATE_NO_WINDOW - stop a command window showing
        .status()
        .expect("powershell failed to start");

    println!("process finished with: {status}");

    // Check the exit code
    match status.code() {
        Some(0) => return Ok("WIRESOCK_SERVICE_INSTALLED".into()),
        Some(1) => return Ok("WIRESOCK_SERVICE_NOT_INSTALLED".into()),
        _ => return Ok(status.to_string().into()),
    }
}

#[tauri::command]
fn check_wiresock_process() -> Result<String, String> {
    let s = System::new_all();

    for _process in s.processes_by_exact_name("wiresock-client.exe") {
        println!("WireSock client is running");
        return Ok("WIRESOCK_IS_RUNNING".into());
    }

    Ok("WIRESOCK_NOT_RUNNING".into())
}

#[tauri::command]
fn check_wiresock_installed() -> Result<String, String> {
    match get_wiresock_install_path() {
        Ok(_result) => return Ok("WIRESOCK_INSTALLED".into()),
        Err(_e) => return Ok("WIRESOCK_NOT_INSTALLED".into()),
    }
}

fn main() {
    // Initialize global job object
    if let Ok(child_process_tracker) = ChildProcessTracker::new() {
        CHILD_PROCESS_TRACKER.set(child_process_tracker).ok();
    }
    // here `"quit".to_string()` defines the menu item id, and the second parameter is the menu item label.
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let minimize = CustomMenuItem::new("minimize".to_string(), "Minimize to Tray");
    let tray_menu = SystemTrayMenu::new()
        .add_item(quit)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(minimize);

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            enable_wiresock,
            disable_wiresock,
            check_wiresock_process,
            install_wiresock,
            check_wiresock_installed,
            check_wiresock_service,
            get_wiresock_state
        ])
        .system_tray(SystemTray::new().with_menu(tray_menu))
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::DoubleClick {
                position: _,
                size: _,
                ..
            } => {
                if let Some(window) = app.get_window("main") {
                    window.show().unwrap();
                };
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "minimize" => {
                    if let Some(window) = app.get_window("main") {
                        window.hide().unwrap();
                    };
                }
                "quit" => {
                    disable_wiresock().expect("Failed to disable WireSock");
                    let _ = app.save_window_state(StateFlags::all()); // will save the state of all open windows to disk
                    std::process::exit(0);
                }
                _ => {}
            },
            _ => {}
        })
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!("{}, {argv:?}, {cwd}", app.package_info().name);

            app.emit_all("single-instance", Payload { args: argv, cwd })
                .unwrap();
        }))
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]), /* arbitrary number of args to pass to your app */
        ))
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app, event| match event {
            tauri::RunEvent::WindowEvent {
                label,
                event: win_event,
                ..
            } => match win_event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    let window = app.get_window(label.as_str()).unwrap();
                    window.hide().unwrap();
                    api.prevent_close();
                }
                _ => {}
            },
            _ => {}
        })
}
