mod get;
mod model;

use axum::Router;
use axum::routing::get;
use sqlx::PgPool;

pub fn router() -> Router<PgPool> {
    Router::new().route("/dashboard", get(get::get_dashboard))
}
