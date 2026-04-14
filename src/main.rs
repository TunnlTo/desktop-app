use axum::{
    body::Body,
    http::{header, StatusCode},
    response::Response,
    routing::get,
    Router,
};
use clap::Parser;
use rustls_acme::{caches::DirCache, AcmeConfig};
use std::net::{Ipv4Addr, Ipv6Addr, SocketAddr};
use tokio_stream::StreamExt;
use tracing::{error, info};

const INDEX_HTML: &str = include_str!("../static/index.html");

#[derive(Parser)]
#[command(name = "rust-html-server", about = "HTTPS server with automatic Let's Encrypt")]
struct Args {
    /// Domain(s) for the TLS certificate. If omitted, --no-tls is implied.
    #[arg(short, long)]
    domain: Vec<String>,

    /// ACME contact email (required when domain is set)
    #[arg(short, long)]
    email: Option<String>,

    /// Listen port (defaults to 8080 in no-tls mode, 443 otherwise)
    #[arg(short, long)]
    port: Option<u16>,

    /// Directory to cache ACME certificates
    #[arg(long, default_value = "./acme_cache")]
    acme_cache_dir: String,

    /// Use Let's Encrypt production (default is staging)
    #[arg(long)]
    production: bool,

    /// Disable TLS and serve plain HTTP — for local development only
    #[arg(long)]
    no_tls: bool,
}

async fn index() -> Response {
    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "text/html; charset=utf-8")
        .body(Body::from(INDEX_HTML))
        .unwrap()
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let args = Args::parse();

    // If no domain is provided, default to no-tls dev mode
    let no_tls = args.no_tls || args.domain.is_empty();

    let app = Router::new().route("/", get(index));

    if no_tls {
        let port = args.port.unwrap_or(8080);
        let addr = SocketAddr::from((Ipv4Addr::UNSPECIFIED, port));
        let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
        info!("listening on http://{addr} (development mode, no TLS)");
        axum::serve(listener, app).await.unwrap();
        return;
    }

    if args.email.is_none() {
        eprintln!("error: --email is required when --domain is set");
        std::process::exit(1);
    }

    let email = args.email.unwrap();
    let port = args.port.unwrap_or(443);

    let contact = format!("mailto:{}", email);
    let env_name = if args.production { "production" } else { "staging" };

    info!(
        domains = ?args.domain,
        port = port,
        environment = env_name,
        "starting server"
    );

    let mut state = AcmeConfig::new(args.domain)
        .contact([contact])
        .cache(DirCache::new(args.acme_cache_dir))
        .directory_lets_encrypt(args.production)
        .state();

    let acceptor = state.axum_acceptor(state.default_rustls_config());

    tokio::spawn(async move {
        loop {
            match state.next().await {
                Some(Ok(ok)) => info!("acme event: {:?}", ok),
                Some(Err(err)) => error!("acme error: {:?}", err),
                None => break,
            }
        }
    });

    let addr_v6 = SocketAddr::from((Ipv6Addr::UNSPECIFIED, port));
    let addr_v4 = SocketAddr::from((Ipv4Addr::UNSPECIFIED, port));
    info!("listening on {addr_v4} and {addr_v6}");

    let server_v6 = axum_server::bind(addr_v6)
        .acceptor(acceptor.clone())
        .serve(app.clone().into_make_service());

    let server_v4 = axum_server::bind(addr_v4)
        .acceptor(acceptor)
        .serve(app.into_make_service());

    tokio::join!(server_v6, server_v4).0.unwrap();
}
