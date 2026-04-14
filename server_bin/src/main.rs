const INDEX_HTML: &str = include_str!("../static/index.html");

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    server_core::start_server(INDEX_HTML).await;
}
