use axum::Json;
use axum::extract::{Query, State};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::error::AppResult;

#[derive(Serialize)]
pub struct AgentWithPolicies {
    pub id: i32,
    pub full_name: String,
    pub policy_count: i64,
}

#[derive(Deserialize)]
pub struct AgentQuery {
    pub search: Option<String>,
}

pub async fn get_agents(
    State(pool): State<PgPool>,
    Query(query): Query<AgentQuery>,
) -> AppResult<Json<Vec<AgentWithPolicies>>> {
    let search = query.search.unwrap_or_default().to_lowercase();
    let search_pattern = format!("%{}%", search);

    let agents = sqlx::query_as!(
        AgentWithPolicies,
        r#"
        SELECT a.id, a.full_name, count(ap.policy_id) as "policy_count!: i64"
        FROM agent a
        LEFT JOIN agent_policy ap ON ap.agent_id = a.id
        WHERE lower(a.full_name) LIKE $1
        GROUP BY a.id, a.full_name
        ORDER BY a.full_name
        LIMIT 50
        "#,
        search_pattern
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(agents))
}
