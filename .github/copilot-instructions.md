---
applyTo: "**"
---

# rust-html-server — AI Coding Instructions

## Project Overview

This is a standalone Rust binary that serves a Hello World HTML page over HTTPS with automatic Let's Encrypt certificate provisioning. It uses Axum for HTTP serving and `rustls-acme` for certificate management.

## Technology Stack

- **Language:** Rust (edition 2024)
- **Web framework:** `axum` 0.8
- **TLS server:** `axum-server` 0.8 with `AxumAcceptor`
- **ACME / Let's Encrypt:** `rustls-acme` 0.15 (feature: `axum`)
- **Async runtime:** `tokio` (full features)
- **CLI:** `clap` 4 (derive)
- **Logging:** `tracing` + `tracing-subscriber`

## Project Structure

```
src/main.rs        — All server logic, CLI, ACME setup
static/index.html  — Embedded at compile time via include_str!
acme_cache/        — Runtime cert cache (not in source control)
```

## Key Architectural Decisions

- **TLS-ALPN-01 challenge only** — No HTTP listener on port 80. Certificates are validated entirely over port 443. Do not add HTTP-01 without explicit request.
- **Staging by default** — `AcmeConfig::directory_lets_encrypt(production_flag)` is `false` by default. The `--production` flag enables real certs. Never flip this default.
- **Dual-stack binding** — Server binds both `0.0.0.0` (IPv4) and `[::]` (IPv6) on the same port using `tokio::join!`. Both share the same `AxumAcceptor` (it is `Clone`).
- **Single embedded HTML file** — `include_str!("../static/index.html")` is used rather than `rust-embed`. Do not add `rust-embed` unless multiple assets are needed.
- **Explicit Content-Type via `Response::builder()`** — Handlers must use `Response::builder()` and set `Content-Type: text/html; charset=utf-8` explicitly. Do NOT return `axum::response::Html` or a `&str` body wrapped in a header tuple — Axum appends headers when using tuples rather than replacing, resulting in two `Content-Type` headers where the browser uses the first (`text/plain`).
- **No-TLS dev mode** — The `--no-tls` flag skips ACME entirely and binds a plain HTTP server via `axum::serve()`. Use `--no-tls --port 8080` for local development. `--domain` and `--email` are not required when `--no-tls` is set.
- **ACME background task** — `state.next().await` is driven in a `tokio::spawn` loop. Events are logged, never panicked on.
- **Certificate caching** — `DirCache` is always used. Never run without a cache; it avoids Let's Encrypt rate limit exhaustion on restart.

## Coding Conventions

- Keep all logic in `src/main.rs` unless the file grows beyond ~200 lines, then split into modules.
- Use `tracing::{info, error, warn}` for all logging. Never use `println!` or `eprintln!`.
- All CLI args are defined in the `Args` struct using `clap` derive. Never use `std::env::args()` directly.
- Build Axum handler responses with `Response::builder()` — never return a raw `&str` or a tuple wrapping `&str`, as those produce a `text/plain` Content-Type that can't be cleanly overridden.

## Known Issues & Workarounds

- **`rustls-acme` 0.15.1 `missing field 'token'` error:** Let's Encrypt now offers `dns-persist-01` challenges that lack a `token` field. This causes deserialization of the **entire** challenge list to fail (including TLS-ALPN-01), so no certificate is ever issued. A local one-line patch (`#[serde(default)]` on the `token` field) is applied via `[patch.crates-io]` in `Cargo.toml`, pointing to `patches/rustls-acme/`. The upstream fix is tracked at https://github.com/FlorianUekermann/rustls-acme/issues/92. When a patched version is released: remove the `[patch.crates-io]` section, delete `patches/rustls-acme/`, update the version in `[dependencies]`, and run `cargo update`.

## AI Workflow Requirements

After completing any code changes:
1. **Run `cargo check`** (or `cargo run` if behaviour needs verifying) to confirm the project compiles and works correctly.
2. **Update `README.md`** with any user-facing changes (new flags, behaviour changes, new requirements, etc.).
3. **Update `.github/copilot-instructions.md`** with any architectural decisions, new patterns, or gotchas discovered.

Do not mark a task complete until `cargo check` passes.

## Common Tasks

### Add a new route
Add a handler using `Response::builder()` and register it on the `Router` in `main()`:
```rust
async fn about() -> Response {
    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "text/html; charset=utf-8")
        .body(Body::from("<h1>About</h1>"))
        .unwrap()
}
// in main():
let app = Router::new()
    .route("/", get(index))
    .route("/about", get(about));
```

### Add a new CLI flag
Add a field to `Args` with a `#[arg(...)]` attribute:
```rust
/// Enable verbose output
#[arg(short, long)]
verbose: bool,
```

### Embed a new static file
Add the file to `static/` and embed it:
```rust
const STYLE_CSS: &str = include_str!("../static/style.css");
```

### Update Let's Encrypt to production
Run with `--production`. No code changes needed.

### Update the rustls-acme dependency after a patch is released
```bash
cargo update -p rustls-acme
```

## What NOT to Do

- Do not add HTTP (port 80) listener unless explicitly requested — the TLS-ALPN-01 approach does not need it.
- Do not change staging-by-default behaviour.
- Do not introduce `unwrap()` in ACME event handling — log errors and continue.
- Do not replace `include_str!` with runtime file reads; the binary must be self-contained.
- Do not use `axum::response::Html` or return `&str` body in a header tuple — always use `Response::builder()` to guarantee exactly one `Content-Type` header.
- Do not skip updating `README.md` and `.github/copilot-instructions.md` after making changes.
