pub mod create;
pub mod get;
pub mod get_by_id;
pub mod search;
pub mod update;

use axum::{Router, routing::get};
use sqlx::PgPool;

pub fn router() -> Router<PgPool> {
    Router::new()
        .route("/policies", get(get::get_policies).post(create::create_policy))
        .route(
            "/policies/{id}",
            get(get_by_id::get_policy_by_id).put(update::update_policy),
        )
}
