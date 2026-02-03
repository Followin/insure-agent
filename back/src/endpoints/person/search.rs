use axum::extract::{Query, State};
use axum::Json;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Deserialize)]
pub struct SearchQuery {
    pub q: String,
}

#[derive(Serialize)]
pub struct PersonSearchResult {
    pub id: i32,
    pub label: String,
}

pub async fn search_people(
    State(pool): State<PgPool>,
    Query(query): Query<SearchQuery>,
) -> Json<Vec<PersonSearchResult>> {
    let pattern = format!("%{}%", query.q.to_lowercase());
    let results = sqlx::query_as!(
        PersonSearchResult,
        "SELECT id, first_name || ' ' || last_name AS \"label!\" FROM person WHERE LOWER(first_name || ' ' || last_name) LIKE $1",
        pattern
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    Json(results)
}
