pub mod get_by_id;
pub mod search;

use axum::{Router, routing::get};
use sqlx::PgPool;

pub fn router() -> Router<PgPool> {
    Router::new()
        .route("/cars/search", get(search::search_cars))
        .route("/cars/{id}", get(get_by_id::get_car))
}
