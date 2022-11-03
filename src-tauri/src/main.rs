#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::io::Write;
use std::{path::PathBuf};
use std::fs::File;

#[tauri::command]
#[allow(non_snake_case)]
fn create_wiresock_conf(
    tunnelName: &str,
    privateKey: &str,
    interfaceAddress: &str,
    dns: &str,
    publicKey: &str,
    endpoint: &str,
    allowedApps: &str,
    allowedIPs: &str,
) -> bool {
    // format!("Hello, {}{}!", tunnelName, privateKey);
    // write the conf file with the parameters
    //let path: PathBuf = [home::home_dir(), "Tunnl.to", "tunnel.conf"].iter().collect();
    let mut pathx = PathBuf::new();

    match home::home_dir() {
        Some(path) => pathx.push(path),
        None => println!("Impossible to get your home dir!"),
    }

    pathx.push("AppData");
    pathx.push("Local");
    pathx.push("Tunnl.to");
    pathx.push("tunnel.conf");

    // let config_data: &str = ("[Interface]\nPrivateKey = {}\nAddress = {}", privateKey, interfaceAddress);

    // fs::write(pathx, config_data).expect("Unable to write file");

    let mut w = File::create(pathx).unwrap();
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


    return true
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![create_wiresock_conf])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
