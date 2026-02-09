mod auth;
mod endpoints;
pub mod models;

use axum::http::{HeaderMap, HeaderName, Method, Uri};
use axum::middleware;
use axum::{Router, response::Redirect};
use sqlx::PgPool;
use tower_cookies::CookieManagerLayer;
use tower_http::cors::CorsLayer;
use tower_http::trace::{DefaultMakeSpan, DefaultOnResponse, TraceLayer};
use tracing::Level;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    dotenvy::dotenv().ok();
    let connection_string = std::env::var("DATABASE_URL")
        .unwrap_or("postgres://postgres:postgres@localhost:5432/insure".to_owned());

    let pool = PgPool::connect(&connection_string).await.unwrap();

    let mut app = Router::new()
        .merge(endpoints::router())
        .merge(auth::router())
        .layer(middleware::from_fn(
            auth::middleware::allowed_users_middleware,
        ))
        .layer(middleware::from_fn(auth::middleware::auth_middleware))
        .layer(CookieManagerLayer::new())
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(
                    DefaultMakeSpan::new()
                        .level(Level::INFO)
                        .include_headers(false),
                )
                .on_response(
                    DefaultOnResponse::new()
                        .level(Level::INFO)
                        .latency_unit(tower_http::LatencyUnit::Millis),
                ),
        )
        .with_state(pool);

    if let Ok(origin) = std::env::var("CORS_ORIGIN") {
        info!("CORS mode: origin={}", origin);

        let mut cors = CorsLayer::new()
            .allow_methods([
                Method::GET,
                Method::POST,
                Method::PUT,
                Method::DELETE,
                Method::OPTIONS,
            ])
            .allow_headers([
                HeaderName::from_static("content-type"),
                HeaderName::from_static("authorization"),
                HeaderName::from_static("accept"),
            ])
            .allow_credentials(true);

        let origins = origin.split(',').map(|s| s.trim()).collect::<Vec<_>>();
        for origin in origins {
            cors = cors.allow_origin(origin.parse::<axum::http::HeaderValue>().unwrap());
        }

        app = app.layer(cors);
    }

    let tls_cert = std::env::var("TLS_CERT").ok();
    let tls_key = std::env::var("TLS_KEY").ok();

    match (tls_cert, tls_key) {
        (Some(cert_path), Some(key_path)) => {
            info!("TLS mode: cert={}, key={}", cert_path, key_path);

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
                info!("HTTP redirect server listening on 0.0.0.0:80");
                axum::serve(listener, redirect_app).await.unwrap();
            });

            // Serve HTTPS on port 443
            info!("HTTPS server listening on 0.0.0.0:443");
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
            info!("HTTP server listening on {}", &bind_address);
            let listener = tokio::net::TcpListener::bind(&bind_address).await.unwrap();
            info!("Listening on {}", &bind_address);
            axum::serve(listener, app).await.unwrap();
        }
    }
}
