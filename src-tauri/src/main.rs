#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

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
use once_cell::sync::OnceCell;
use sysinfo::{System, SystemExt};
use tauri::Manager;
use tauri::{CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};
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
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

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

#[tauri::command]
#[allow(non_snake_case)]
async fn enable_wiresock(
    privateKey: &str,
    interfaceAddress: &str,
    dns: &str,
    publicKey: &str,
    endpoint: &str,
    presharedKey: Option<&str>,
    allowedApps: Option<&str>,
    disallowedApps: Option<&str>,
    allowedIPs: Option<&str>,
    disallowedIPs: Option<&str>,
    mtu: Option<&str>,
) -> Result<String, String> {
    // Write a wiresock config file to disk and then start the WireSock client

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
    writeln!(&mut w, "[Interface]").unwrap();
    writeln!(&mut w, "PrivateKey = {}", privateKey).unwrap();
    writeln!(&mut w, "Address = {}", interfaceAddress).unwrap();
    writeln!(&mut w, "DNS = {}", dns).unwrap();
    if mtu.is_some() {
        writeln!(&mut w, "MTU = {}", mtu.unwrap()).unwrap()
    };

    writeln!(&mut w, "").unwrap();
    writeln!(&mut w, "[Peer]").unwrap();
    writeln!(&mut w, "PublicKey = {}", publicKey).unwrap();
    if presharedKey.is_some() {
        writeln!(&mut w, "PresharedKey = {}", presharedKey.unwrap()).unwrap();
    }
    writeln!(&mut w, "Endpoint = {}", endpoint).unwrap();
    writeln!(&mut w, "PersistentKeepalive = 25").unwrap();
    if allowedApps.is_some() {
        writeln!(&mut w, "AllowedApps = {}", allowedApps.unwrap()).unwrap();
    }
    if disallowedApps.is_some() {
        writeln!(&mut w, "DisallowedApps = {}", disallowedApps.unwrap()).unwrap();
    }
    if allowedIPs.is_some() {
        writeln!(&mut w, "AllowedIPs = {}", allowedIPs.unwrap()).unwrap();
    }
    if disallowedIPs.is_some() {
        writeln!(&mut w, "DisallowedIPs = {}", disallowedIPs.unwrap()).unwrap();
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

    // Add process to global Job object
    if let Some(tracker) = ChildProcessTracker::global() {
        tracker.add_process(child.as_raw_handle()).ok();
    }

    // Check the stdout data
    if let Some(stdout) = &mut child.stdout {
        let lines = BufReader::new(stdout).lines().enumerate().take(20);
        for (counter, line) in lines {
            let line_string = &line.unwrap();
            if line_string.contains("Handshake response received from") {
                return Ok("WireSock started successfully".into());
            } else if line_string.contains("WireSock WireGuard VPN Client is running already") {
                return Err("WireSock WireGuard VPN Client is running already".into());
            } else if line_string.contains("Endpoint is either invalid of failed to resolve") {
                return Err("Endpoint is either invalid of failed to resolve".into());
            }
            println!("enable_wiresock: {}, {:?}", counter, line_string);
        }
    }

    Err("Unknown error starting WireSock process".into())
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
fn disable_wiresock() -> Result<String, String> {
    println!("Attempting to stop WireSock");
    Command::new("taskkill")
        .arg("/F")
        .arg("/IM")
        .arg("wiresock-client.exe")
        .arg("/T")
        .creation_flags(0x08000000) // CREATE_NO_WINDOW - stop a command window showing
        .spawn()
        .expect("command failed to start");
    Ok("WireSock stopped".into())
}

#[tauri::command]
fn install_wiresock() -> Result<String, String> {
    // Get the current directory
    let current_dir = env::current_dir().unwrap();

    // Build the path to the WireSock installer
    let wiresock_installer_path = &mut current_dir.into_os_string().into_string().unwrap();
    wiresock_installer_path.push_str(r#"\wiresock\wiresock-vpn-client-x64-1.2.17.1.msi"#);

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
            check_wiresock_service
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

            app.emit_all("single-instance", Payload { args: argv, cwd }).unwrap();
        }))
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
