pub mod car;
pub mod person;
pub mod policy;

use axum::Router;
use sqlx::PgPool;

pub fn router() -> Router<PgPool> {
    Router::new()
        .merge(car::router())
        .merge(person::router())
        .merge(policy::router())
}
