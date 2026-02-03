pub mod create;
pub mod get;
pub mod model;
pub mod search;

use axum::{Router, routing::get};
use sqlx::PgPool;

pub fn router() -> Router<PgPool> {
    Router::new().route("/policies", get(get::get_policies).post(create::create_policy))
}
