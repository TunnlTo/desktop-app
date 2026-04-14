# rust-html-server

A standalone Rust binary that serves a Hello World HTML page over HTTPS with automatic Let's Encrypt certificate management.

## Features

- HTTPS with automatic TLS certificate provisioning via Let's Encrypt (TLS-ALPN-01 challenge — port 443 only, no port 80 required)
- Certificates cached to disk and renewed automatically
- Hello World HTML page embedded directly in the binary (no external files needed at runtime)
- Binds on both IPv4 (`0.0.0.0`) and IPv6 (`[::]`) simultaneously
- Staging mode by default (safe for testing), production via `--production` flag
- Structured logging via `tracing`

## Requirements

- Rust 1.85+
- Port 443 must be reachable from the internet (Let's Encrypt validates via TLS-ALPN-01)
- DNS A/AAAA record for your domain must point to the server before running
- Permission to bind port 443 (run as root, or grant `CAP_NET_BIND_SERVICE` on Linux)

## Build

```bash
cargo build --release
```

The binary is at `target/release/rust-html-server`.

## Usage

```
rust-html-server --domain <DOMAIN> --email <EMAIL> [OPTIONS]
```

### Options

| Flag | Default | Description |
|---|---|---|
| `-d, --domain <DOMAIN>` | *(required)* | Domain(s) for the TLS certificate. Repeat for multiple. Not required with `--no-tls`. |
| `-e, --email <EMAIL>` | *(required)* | ACME contact email. Not required with `--no-tls`. |
| `-p, --port <PORT>` | `443` | Listen port. |
| `--acme-cache-dir <PATH>` | `./acme_cache` | Directory for cached certificates. Must be writable. |
| `--production` | off | Use Let's Encrypt **production** (issues trusted certs). Default is staging. |
| `--no-tls` | off | Serve plain HTTP with no TLS or ACME. For local development only. |

### Examples

**Local development (no TLS, no ACME, no root required):**
```bash
cargo run -- --no-tls --port 8080
```
Then open `http://localhost:8080` in your browser.

**Development / staging (untrusted cert, no rate limits):**
```bash
cargo run -- --domain example.com --email you@example.com
```

**Production (trusted cert):**
```bash
cargo run -- --domain example.com --email you@example.com --production
```

**Custom port (useful for local testing without root):**
```bash
cargo run -- --domain example.com --email you@example.com --port 8443
```

**Multiple domains on one cert:**
```bash
cargo run -- --domain example.com --domain www.example.com --email you@example.com --production
```

## How It Works

1. On startup the ACME state machine contacts Let's Encrypt and orders a TLS certificate.
2. Let's Encrypt validates domain ownership by connecting to **port 443** and completing a TLS-ALPN-01 handshake.
3. Once validated, the certificate is issued, stored in `acme_cache/`, and loaded into the server.
4. The background task drives renewal before expiry (Let's Encrypt certs last 90 days; renewal happens at ~2/3 of lifetime).
5. All incoming HTTPS requests are served by Axum and respond with the embedded Hello World page.

## Known Issues

- **ACME `missing field 'token'` errors** — A known upstream bug in `rustls-acme` 0.15.1 caused by Let's Encrypt rolling out the `dns-persist-01` challenge type, which has no `token` field. This breaks deserialization of the entire challenge list, preventing any cert from being issued. A one-line patch is applied locally via `[patch.crates-io]` in `Cargo.toml` (see `patches/rustls-acme/`). Track the upstream fix at: https://github.com/FlorianUekermann/rustls-acme/issues/92

  When the upstream fix is released: remove the `[patch.crates-io]` section from `Cargo.toml`, delete `patches/rustls-acme/`, bump the version in `[dependencies]`, and run `cargo update`.

## Project Structure

```
src/
  main.rs          # Server, ACME setup, CLI
static/
  index.html       # Embedded Hello World page (included at compile time)
acme_cache/        # Certificate cache (created at runtime, gitignored)
```
