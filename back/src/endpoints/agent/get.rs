use axum::Json;
use axum::extract::State;
use serde::Serialize;
use sqlx::PgPool;

use crate::error::AppResult;

#[derive(Serialize)]
pub struct Agent {
    pub id: i32,
    pub full_name: String,
}

pub async fn get_agents(State(pool): State<PgPool>) -> AppResult<Json<Vec<Agent>>> {
    let agents = sqlx::query_as!(
        Agent,
        r#"
        SELECT id, full_name
        FROM agent
        ORDER BY full_name
        "#
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(agents))
}
