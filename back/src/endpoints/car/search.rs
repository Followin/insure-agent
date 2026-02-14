use axum::extract::{Query, State};
use axum::Json;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::error::AppResult;

#[derive(Deserialize)]
pub struct SearchQuery {
    pub q: String,
}

#[derive(Serialize)]
pub struct CarSearchResult {
    pub id: i32,
    pub label: String,
}

pub async fn search_cars(
    State(pool): State<PgPool>,
    Query(query): Query<SearchQuery>,
) -> AppResult<Json<Vec<CarSearchResult>>> {
    let pattern = format!("%{}%", query.q.to_lowercase());
    let results = sqlx::query_as!(
        CarSearchResult,
        "SELECT id, plate || ' (' || make || ' ' || model || ')' AS \"label!\" FROM car WHERE LOWER(plate || ' ' || make || ' ' || model) LIKE $1",
        pattern
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(results))
}
