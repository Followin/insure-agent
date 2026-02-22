mod get;

use axum::{Router, routing::get};
use sqlx::PgPool;

pub fn router() -> Router<PgPool> {
    Router::new().route("/agents", get(get::get_agents))
}
