pub mod get;
pub mod get_by_id;
pub mod model;
pub mod post;
pub mod search;
pub mod update;

use axum::{Router, routing::get};
use sqlx::PgPool;

pub fn router() -> Router<PgPool> {
    Router::new()
        .route("/people", get(get::get_people).post(post::create_person))
        .route("/people/search", get(search::search_people))
        .route("/people/{id}", get(get_by_id::get_person).put(update::update_person))
}
