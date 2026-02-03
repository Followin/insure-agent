use axum::Json;
use axum::extract::State;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use super::model::{PolicyStatus, PolicyType};

#[derive(Serialize, Deserialize)]
pub struct PolicyShort {
    pub id: i32,
    pub policy_type: PolicyType,
    pub holder_name: String,
    pub series: String,
    pub number: String,
    pub start_date: chrono::NaiveDate,
    pub end_date: Option<chrono::NaiveDate>,
    pub status: PolicyStatus,
}

pub async fn get_policies(State(pool): State<PgPool>) -> Json<Vec<PolicyShort>> {
    let policies = sqlx::query_as!(
        PolicyShort,
        r#"
        select 
            policy.id, 
            type as "policy_type: PolicyType",
            person.first_name || ' ' || person.last_name as "holder_name!",
            series,
            number,
            start_date,
            end_date,
            status as "status: PolicyStatus"
        from policy
        join person on policy.holder_id = person.id
        "#
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    Json(policies)
}
