pub mod car;
pub mod dashboard;
pub mod person;
pub mod policy;

use axum::Router;
use sqlx::PgPool;

pub fn router() -> Router<PgPool> {
    Router::new()
        .merge(car::router())
        .merge(dashboard::router())
        .merge(person::router())
        .merge(policy::router())
}
