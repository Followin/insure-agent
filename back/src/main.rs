use axum::http::{HeaderMap, Uri};
use axum::{Router, response::Redirect, routing::get};
use sqlx::PgPool;
use tower_http::cors::CorsLayer;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    println!("new");
    let connection_string = std::env::var("DATABASE_URL")
        .unwrap_or("postgres://postgres:postgres@localhost:5432/insure".to_owned());

    let pool = PgPool::connect(&connection_string).await.unwrap();

    let mut app = Router::new().route(
        "/",
        get(|| async move {
            let row = sqlx::query!("select id, name from test")
                .fetch_one(&pool)
                .await
                .unwrap();

            format!("Hello, update1 {}, from {}", row.name, row.id)
        }),
    );

    if let Ok(origin) = std::env::var("CORS_ORIGIN") {
        println!("CORS mode: origin={}", origin);
        let cors = CorsLayer::new()
            .allow_origin(origin.parse::<axum::http::HeaderValue>().unwrap())
            .allow_methods(tower_http::cors::Any)
            .allow_headers(tower_http::cors::Any);
        app = app.layer(cors);
    }

    let tls_cert = std::env::var("TLS_CERT").ok();
    let tls_key = std::env::var("TLS_KEY").ok();

    match (tls_cert, tls_key) {
        (Some(cert_path), Some(key_path)) => {
            println!("TLS mode: cert={}, key={}", cert_path, key_path);

            let config =
                axum_server::tls_rustls::RustlsConfig::from_pem_file(&cert_path, &key_path)
                    .await
                    .expect("Failed to load TLS certificate/key");

            // Spawn HTTP->HTTPS redirect server on port 80
            tokio::spawn(async {
                let redirect_app =
                    Router::new().fallback(|headers: HeaderMap, uri: Uri| async move {
                        let host = headers
                            .get("host")
                            .and_then(|h| h.to_str().ok())
                            .unwrap_or("localhost");
                        let host = host.split(':').next().unwrap_or(host);
                        let path_and_query =
                            uri.path_and_query().map(|pq| pq.as_str()).unwrap_or("/");
                        let https_uri = format!("https://{}{}", host, path_and_query);
                        Redirect::permanent(&https_uri)
                    });

                let listener = tokio::net::TcpListener::bind("0.0.0.0:80").await.unwrap();
                println!("HTTP redirect server listening on 0.0.0.0:80");
                axum::serve(listener, redirect_app).await.unwrap();
            });

            // Serve HTTPS on port 443
            println!("HTTPS server listening on 0.0.0.0:443");
            axum_server::bind_rustls(
                "0.0.0.0:443".parse::<std::net::SocketAddr>().unwrap(),
                config,
            )
            .serve(app.into_make_service())
            .await
            .unwrap();
        }
        _ => {
            let bind_address = std::env::var("BIND_ADDRESS").unwrap_or("0.0.0.0:3000".to_owned());
            println!("HTTP server listening on {}", &bind_address);
            let listener = tokio::net::TcpListener::bind(&bind_address).await.unwrap();
            println!("Listening on {}", &bind_address);
            axum::serve(listener, app).await.unwrap();
        }
    }
}
