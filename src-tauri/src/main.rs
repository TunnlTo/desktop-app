#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use std::process::Command;

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
    let mut pathx = PathBuf::new();
    match home::home_dir() {
        Some(path) => pathx.push(path),
        None => println!("Could not find the home dir"), // TODO: Do something better here
    }

    // Create the path to the wiresock config file
    pathx.push("AppData");
    pathx.push("Local");
    pathx.push("Tunnl.to");
    pathx.push("tunnel.conf");

    // Write the config file to disk
    let mut w = File::create(&pathx).unwrap();
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

    // Enable Wiresock
    // TODO: Get the proper path to where Wiresock was installed
    let my_str = &pathx.into_os_string().into_string().unwrap();
    let child = Command::new("C:/Program Files/Wiresock VPN Client/bin/wiresock-client.exe")
        .arg("run")
        .arg("-config")
        .arg(my_str)
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
    return true
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![enable_wiresock, disable_wiresock])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
