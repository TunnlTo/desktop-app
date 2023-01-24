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

## What does this application do?
TunnlTo is a tool for controlling which Windows applications, processes, and IP addresses can use a WireGuard VPN tunnel.

### Example use cases
* Route only FireFox through a privacy VPN
* Route Slack and Microsoft Office through a work VPN
* Route a game through a gaming VPN
* Stop a game from routing through a privacy VPN
* Stop a browser from routing through a work VPN
* Route a specific IP address range through a privacy VPN
* Route all traffic through a privacy VPN except a specific IP address range

## How does it work?
TunnlTo is built in collaboration with the creator of [WireSock](https://www.wiresock.net/). WireSock is currently closed source but work is being done to make it open.

> WireSock VPN Client is a lightweight command line WireGuard VPN client for Windows that has advanced features not available in the official WireGuard for Windows such as selective application tunneling and disallowed IP addresses.
>
>WireSock VPN Client combines the power of Windows Packet Filter and BoringTun (user space WireGuard implementation in Rust) to provide exceptional performance, security and scalability. 

## Prerequisites
* A basic understanding of WireGuard
* Access to a WireGuard server
* Windows 10/11

## Get started
Visit the [releases](https://github.com/TunnlTo/desktop-app/releases) page to download the installer for the latest version.

## Issues and Suggestions
Please use [issues](https://github.com/TunnlTo/desktop-app/issues) for any problems you may encounter and [discussions](https://github.com/TunnlTo/desktop-app/discussions) for any suggestions, ideas or feature requests you may have.

## Built With
* WireSock
* WireGuard
* Tauri
* HTML, CSS (Bootstrap), JavaScript

## License
Copyright (c) 2022 TunnlTo. TunnlTo is not currently licensed.

## Acknowledgments

* [WireSock](https://www.wiresock.net/) and its creator [Vadim Smirnov](https://www.ntkernel.com/)
* [WireGuard](https://www.wireguard.com/)
* [Tauri](https://tauri.app/)