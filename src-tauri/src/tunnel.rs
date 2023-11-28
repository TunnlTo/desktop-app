use serde::{Deserialize, Serialize};

#[allow(non_snake_case)]
#[derive(Debug, Deserialize, Serialize)]
pub struct Interface {
    pub ipv4Address: String,
    pub ipv6Address: String,
    pub port: String,
    pub privateKey: String,
    pub dns: String,
    pub mtu: String,
}

#[allow(non_snake_case)]
#[derive(Debug, Deserialize, Serialize)]
pub struct Peer {
    pub endpoint: String,
    pub port: String,
    pub publicKey: String,
    pub persistentKeepalive: String,
    pub presharedKey: String,
}

#[allow(non_snake_case)]
#[derive(Debug, Deserialize, Serialize)]
pub struct Rules {
    pub allowed: Allowed,
    pub disallowed: Disallowed,
}

#[allow(non_snake_case)]
#[derive(Debug, Deserialize, Serialize)]
pub struct Allowed {
    pub apps: String,
    pub folders: String,
    pub ipAddresses: String,
}

#[allow(non_snake_case)]
#[derive(Debug, Deserialize, Serialize)]
pub struct Disallowed {
    pub apps: String,
    pub folders: String,
    pub ipAddresses: String,
}

#[allow(non_snake_case)]
#[derive(Debug, Deserialize, Serialize)]
pub struct Tunnel {
    pub id: String,
    pub name: String,
    pub interface: Interface,
    pub peer: Peer,
    pub rules: Rules,
}