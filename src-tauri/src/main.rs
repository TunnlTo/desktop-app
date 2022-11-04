#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use std::process::Command;
extern crate winreg;

#[tauri::command]
#[allow(non_snake_case)]
fn enable_wiresock(
    privateKey: &str,
    interfaceAddress: &str,
    dns: &str,
    publicKey: &str,
    endpoint: &str,
    allowedApps: &str,
    allowedIPs: &str,
) -> bool {
    // Write a wiresock config file to disk

    // Get the users home directory
    let mut tunnel_config_path = PathBuf::new();
    match home::home_dir() {
        Some(path) => tunnel_config_path.push(path),
        None => println!("Could not find the home dir"), // TODO: Do something better here
    }

    // Create the path to the wiresock config file
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

    // Get the Wiresock install location
    use winreg::enums::{HKEY_LOCAL_MACHINE, KEY_READ};
    let hklm = winreg::RegKey::predef(HKEY_LOCAL_MACHINE);
    let subkey = hklm
        .open_subkey_with_flags(r#"SOFTWARE\NTKernelResources\WinpkFilterForVPNClient"#, KEY_READ)
        .expect("Failed to open subkey");
    let mut wiresock_location: String = subkey
        .get_value("InstallLocation")
        .expect("Failed to read product name");
    // Complete the path to the wiresock executable
    let exe: &str = "/bin/wiresock-client.exe";
    wiresock_location.push_str(exe);

    // Command::new args require strings so prepare path to Wiresock config file
    let wiresock_config_path = &tunnel_config_path.into_os_string().into_string().unwrap();

    // Enable Wiresock
    let child = Command::new(wiresock_location)
        .arg("run")
        .arg("-config")
        .arg(wiresock_config_path)
        .arg("-log-level")
        .arg("debug")
        .spawn()
        .expect("command failed to start");
    let child_id = child.id();
    println!("Child ID: {}", child_id);

    return true;
}

#[tauri::command]
fn disable_wiresock() -> bool {
    Command::new("taskkill")
        .arg("/F")
        .arg("/IM")
        .arg("wiresock-client.exe")
        .arg("/T")
        .spawn()
        .expect("command failed to start");
    return true;
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![enable_wiresock, disable_wiresock])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
