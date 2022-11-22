#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::env;
use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::{Command, Stdio};
extern crate winreg;
use sysinfo::{System, SystemExt};

#[tauri::command]
#[allow(non_snake_case)]
async fn enable_wiresock(
    privateKey: &str,
    interfaceAddress: &str,
    dns: &str,
    publicKey: &str,
    endpoint: &str,
    allowedApps: &str,
    allowedIPs: &str,
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

    writeln!(&mut w, "").unwrap();
    writeln!(&mut w, "[Peer]").unwrap();
    writeln!(&mut w, "PublicKey = {}", publicKey).unwrap();
    writeln!(&mut w, "AllowedIPs = {}", allowedIPs).unwrap();
    writeln!(&mut w, "Endpoint = {}", endpoint).unwrap();
    writeln!(&mut w, "PersistentKeepalive = 25").unwrap();
    writeln!(&mut w, "AllowedApps = {}", allowedApps).unwrap();

    // Get the Wiresock install location from the Windows registry
    use winreg::enums::{HKEY_LOCAL_MACHINE, KEY_READ};
    let hklm = winreg::RegKey::predef(HKEY_LOCAL_MACHINE);
    let subkey = hklm
        .open_subkey_with_flags(
            r#"SOFTWARE\NTKernelResources\WinpkFilterForVPNClient"#,
            KEY_READ,
        )
        .expect("Failed to open subkey");
    let mut wiresock_location: String = subkey
        .get_value("InstallLocation")
        .expect("Failed to read registry key");
    // Build the full path to the wiresock executable
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

    // Look at all the stdout data that comes in
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

#[tauri::command]
fn disable_wiresock() -> Result<String, String> {
    // TODO: Add error catching
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
    wiresock_installer_path.push_str(r#"\wiresock\wiresock-vpn-client-x64-1.2.15.1.msi"#);

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
fn check_wiresock_process() -> Result<String, String> {
    let s = System::new_all();

    for _process in s.processes_by_exact_name("wiresock-client.exe") {
        println!("WireSock client is running");
        return Ok("WIRESOCK_IS_RUNNING".into())
    }

    Ok("WIRESOCK_NOT_RUNNING".into())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            enable_wiresock,
            disable_wiresock,
            check_wiresock_process,
            install_wiresock
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
