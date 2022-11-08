#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs::File;
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process::{Command, Stdio};
extern crate winreg;

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
    // Write a wiresock config file to disk and then start the Wiresock client

    // Get the users home directory
    let mut tunnel_config_path = PathBuf::new();
    match home::home_dir() {
        Some(path) => tunnel_config_path.push(path),
        None => return Err("Unable to retrieve the user home directory.".into()),
    }

    // Create a path to the wiresock config file
    tunnel_config_path.push("AppData");
    tunnel_config_path.push("Local");
    tunnel_config_path.push("Tunnl.to");
    tunnel_config_path.push("tunnel.conf");

    // Write the config file to disk
    let mut w = File::create(&tunnel_config_path).unwrap();
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
            }
            println!("{}, {:?}", counter, line_string);
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
        .spawn()
        .expect("command failed to start");
    Ok("WireSock stopped".into())
}

#[tauri::command]
fn check_wiresock_process() -> Result<String, String> {
    // Check to see if the wiresock process is running
    let mut child = Command::new("tasklist")
        .arg("/FI")
        .arg(r#"IMAGENAME eq wiresock-client.exe"#)
        .stdout(Stdio::piped())
        .spawn()
        .expect("Unable to start tasklist process");

    // Check the stdout data
    if let Some(stdout) = &mut child.stdout {
        let lines = BufReader::new(stdout).lines().enumerate().take(20);
        for (counter, line) in lines {
            let line_string = &line.unwrap();
            if line_string.contains("wiresock-client.exe") {
                println!("WireSock process is running");
                return Ok("WIRESOCK_IS_RUNNING".into());
            }
            println!("{}, {:?}", counter, line_string);
        }
    }

    Ok("WIRESOCK_NOT_RUNNING".into())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            enable_wiresock,
            disable_wiresock,
            check_wiresock_process
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
