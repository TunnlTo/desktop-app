<br />
<div align="center">
  <a href="https://github.com/othneildrew/Best-README-Template">
    <img src="readme-images/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h2 align="center">TunnlTo</h2>

  <p align="center">
    <b>TunnlTo is a lightweight, fast, Windows WireGuard VPN client built for split tunneling.</b>
    <br />
  </p>
  <img src="./readme-images/screenshot-home-page-with-border.png">
  <br />
  <br />
  <img src="./readme-images/screenshot-edit-page-with-border.png">
  <br />
  <br />
  <img src="./readme-images/TunnlTo.webp">
  <font size="1">The gif demonstrates TunnlTo routing Edge Browser through a WireGuard VPN tunnel without affecting Chrome Browser. Edge's IP changes, Chrome's does not.
  </font>
  <br />

</div>

# What does this application do?
TunnlTo is a tool for controlling which Windows applications, processes, and IP addresses can use a WireGuard VPN tunnel.

# Download
Download directly be clicking [here](https://github.com/TunnlTo/desktop-app/releases/download/v0.1.7/TunnlTo_0.1.7_x64_en-US.msi) or visit the [releases page](https://github.com/TunnlTo/desktop-app/releases).

## Example use cases
* Route only FireFox through a privacy VPN
* Route Slack and Microsoft Office through a work VPN
* Route a game through a gaming VPN
* Stop a game from routing through a privacy VPN
* Stop a browser from routing through a work VPN
* Route a specific IP address range through a privacy VPN
* Route all traffic through a privacy VPN except a specific IP address range
* Route all applications within a folder through a VPN
* Route all traffic through a VPN except applications within a folder

# How does it work?
TunnlTo is built in collaboration with the creator of [WireSock](https://www.wiresock.net/). TunnlTo 'wraps' the WireSock CLI application to provide a simple user interface for enhanced accessibility. WireSock is currently closed source and an open source version is being considered.

> WireSock VPN Client is a lightweight command line WireGuard VPN client for Windows that has advanced features not available in the official WireGuard for Windows such as selective application tunneling and disallowed IP addresses.
>
>WireSock VPN Client combines the power of Windows Packet Filter and BoringTun (user space WireGuard implementation in Rust) to provide exceptional performance, security and scalability.

# Performance
|| Download | Upload |
| :---         |     ---:      |          ---: |
| **WireGuard Official** | 719 Mbps | **892** Mbps |
| **TunnlTo** | **892** Mbps | 879 Mbps |
| **TunSafe** | 284 Mbps | 435 Mbps |

# Prerequisites
* A basic understanding of WireGuard
* Access to a WireGuard server
* Windows 10/11

# Follow For Updates
Please follow the project on Twitter to be notified of new releases and updates.
* [Twitter](https://twitter.com/TunnlTo)

# Get started
Visit the [releases](https://github.com/TunnlTo/desktop-app/releases) page to download the installer for the latest version.

# Feature Requests
These are requests made by the community. Please review them before making a new issue or discussion.
- Dark Mode
- Kill Switch
- Auto Startup
- Nested Tunnels (or Multi-Hop)
- Simultaneous Tunnels
- UWP App Support
- Trigger System - WiFi on/off, location, 4g/5g status, Bluetooth status, endpoint status
- System tray controls. Icon colour to reflect status. Tooltip for status/IP. Right click for menu.
- Statistics / Status data in UI
- Persistent KeepAlive parameter in config
- Bulk VPN config import

# Issues and Suggestions
Please use [issues](https://github.com/TunnlTo/desktop-app/issues) for any problems you may encounter and [discussions](https://github.com/TunnlTo/desktop-app/discussions) for any suggestions, ideas or feature requests you may have.

---

# Documentation
Both IPv4 and IPv6 are supported.

## Configuration Parameters

### Tunnel Name
#### Summary
The description of your WireGuard tunnel.

#### Example
- `Work VPN`

### Endpoint
#### Summary
The endpoint for the WireGuard server including the port number.

#### Example
- `100.100.100.100:54236`

### Private Key
#### Summary
The private key for the WireGuard tunnel.

### Public Key
#### Summary
The Public Key for the WireGuard tunnel.

### Interface Address
#### Summary
The interface address for the WireGuard tunnel.

#### Example 
- `10.0.64.1/32`

### Preshared Key (Optional)
#### Summary
The Preshared Key for the WireGuard tunnel.

### DNS (Optional)
#### Summary
The DNS server to use for the WireGuard tunnel.

#### Rules
- If left blank, the computers default DNS server will be used.
- Use a comma to separate multiple DNS servers.

#### Example
- `1.1.1.1, 8.8.8.8`

### Allowed Apps (Optional)
#### Summary
The list of applications that can use the WireGuard tunnel.

#### Rules
- If left blank, all applications will be allowed.
- Use a comma to separate multiple applications.
- If this parameter is used, the Allowed IP's parameter must also be set.

#### Options
  - Use the full path to the executable
  - List the process name without the .exe extension
  - List the process name with the .exe extension
  - List a folder path (which should include at least one slash or backslash), and all executables within that folder and its subfolders will be included.

#### Examples
  - `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe` 
  - `chrome, msoffice, firefox`
  - `C:\Program Files (x86)\`

### Disallowed Apps (Optional)
#### Summary
The list of applications that cannot use the WireGuard tunnel.

#### Rules
- AllowedApps takes precedence, and if both are specified, then AllowedApps is matched first.
- Use a comma to separate multiple applications.

#### Options
  - Use the full path to the executable
  - List the process name without the .exe extension
  - List the process name with the .exe extension
  - List a folder path (which should include at least one slash or backslash), and all executables within that folder and its subfolders will be excluded.

#### Examples
  - `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe` 
  - `chrome, msoffice, firefox`
  - `C:\Program Files (x86)\`

### Allowed IP's (Optional)
#### Summary
The list of IP addresses and IP ranges that can use the WireGuard tunnel.

#### Rules
- Use a comma to separate multiple IP addresses and IP ranges.
- If the Allowed Apps parameter is set, this will forward all the listed IP addresses and IP ranges used by the Allowed Apps through the tunnel.

#### Default
- `0.0.0.0/0`

#### Example
- `1.1.1.1, 192.168.1.0/24`

### Disallowed IP's (Optional)
#### Summary
The list of IP addresses and IP ranges that cannot use the WireGuard tunnel.

#### Rules
- Use a comma to separate multiple IP addresses and IP ranges.
- If the Allowed Apps parameter is set, this will block all the listed IP addresses and IP ranges used by the Allowed Apps from using the tunnel.

#### Example
- `1.1.1.1, 192.168.1.0/24`

### MTU (Optional)
#### Summary
The MTU for the WireGuard tunnel.

#### Default 
- `1420`

---

# Example Configurations
These examples show the use of optional parameters. The required parameters such as private key, public key etc. are not shown. If you would like an example added, please open a [discussion](https://github.com/TunnlTo/desktop-app/discussions).

## Route a specific app through a tunnel
### Scenario
You utilise a privacy VPN to protect your privacy when browsing the internet. You want to use the privacy VPN when browsing the internet with FireFox and when torrenting, but you do not want to use the privacy VPN for any other applications.

### Expected Outcome
In this example, FireFox and qBittorrent are routed through the WireGuard tunnel while all other applications are routed through the default network adapter. DNS requests from FireFox and qBittorrent will route through the tunnel and use the DNS servers specified.

### Configuration
- DNS: `1.1.1.1, 8.8.8.8`
- Allowed Apps: `firefox, qBittorrent`
- Allowed IP's: `0.0.0.0/0`

## Route all traffic through a tunnel except specific apps
### Scenario
You utilise a company VPN to access your employers servers. You want the Chrome browser traffic to route through your default network adapter so it will:
- Not be tracked by your employer
- Not overload the company VPN bandwidth when watching videos, downloading files etc.

### Expected Outcome
In this example, all traffic is routed through the WireGuard tunnel except Chrome.

### Configuration
- DNS: `1.1.1.1, 8.8.8.8`
- Disallowed Apps: `chrome`
- Allowed IP's: `0.0.0.0/0`

## Route all apps in a specific folder through a a tunnel
### Scenario
You utilise a company VPN to access your employers servers. You want all of your work applications that are installed in a specific folder to route through your company VPN so that they:
- Work correctly with your companies servers
- Follows your company policies

### Expected Outcome
In this example, all apps in the `C:\Work Apps\` folder are routed through the WireGuard tunnel. The company DNS server is used for DNS requests.

### Configuration
- DNS: `10.64.0.1`
- Allowed Apps: `C:\Work Apps\`
- Allowed IP's: `0.0.0.0/0`

## Route a specific IP address range when used by a specific app through a tunnel
### Scenario
You want to access a company intranet when using the Edge browser, otherwise it should use your normal network adapter.

### Expected Outcome
In this example, an IP address range is routed through the WireGuard tunnel when the the IP range is accessed by the Edge browser. Otherwise, all Edge browser traffic is routed through the default network adapter. Note that in this example the DNS parameter is not set, so the default DNS server will be used by Edge. If the DNS parameter was set to the company DNS server, all Edge DNS requests would route through the tunnel to the company DNS server.

### Configuration
- Allowed Apps: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
- Allowed IP's: `10.0.0.0/64`

## Route a specific IP address and/or IP address range through a tunnel
### Scenario
You want to access company servers through a company VPN server, however all other traffic should use your default network adapter.

### Expected Outcome
In this example, an IP address and IP range are routed through the WireGuard tunnel for all applications. All other traffic is routed through the default network adapter.

### Configuration
- Allowed IP's: `200.200.200.200, 10.10.10.0/24`

## Disallow a specific IP address and IP address range from using a tunnel
### Scenario
You want to use a privacy VPN service for all network traffic except some specific IP addresses and IP address ranges.

### Expected Outcome
In this example, an IP address and IP range are routed through the default network adapter and NOT the tunnel. All other traffic is routed through the WireGuard tunnel.

### Configuration
- Allowed IP's: `0.0.0.0/0`
- Disallowed IP's: `200.200.200.200, 10.10.10.0/24`

## Route a specific app through a tunnel except for a specific IP address range
### Scenario
You utilise an overseas VPN server for faster ping times to an overseas region in Counter Strike. You also still play on local servers and do not want to have to enable/disable the VPN depending on what servers you're playing on.

### Expected Outcome
Counter Strike traffic is routed through the WireGuard tunnel except for when a specific IP address range is accessed by the game. In this case the IP range would be the local servers.

### Configuration
- Allowed Apps: `csgo`
- Allowed IP's: `0.0.0.0/0`
- Disallowed IP's: `12.34.45.0/24`

---

# Built With
* WireSock
* WireGuard
* Tauri
* Rust, TypeScript, React, TailwindCSS

# License
Copyright (c) 2023 TunnlTo. TunnlTo is not currently licensed.

# Acknowledgments

* [WireSock](https://www.wiresock.net/) and its creator [Vadim Smirnov](https://www.ntkernel.com/)
* [WireGuard](https://www.wireguard.com/)
* [Tauri](https://tauri.app/)