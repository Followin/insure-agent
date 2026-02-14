use axum::Json;
use axum::extract::{Query, State};
use serde::Deserialize;
use sqlx::PgPool;

use crate::error::AppResult;
use crate::shared::policy::model::{PolicyShort, PolicyStatus, PolicyType};

#[derive(Deserialize)]
pub struct PolicyQuery {
    pub search: Option<String>,
    pub active_only: Option<bool>,
}

pub async fn get_policies(
    State(pool): State<PgPool>,
    Query(query): Query<PolicyQuery>,
) -> AppResult<Json<Vec<PolicyShort>>> {
    let search_pattern = query
        .search
        .map(|s| format!("%{}%", s.to_lowercase()))
        .unwrap_or_else(|| "%".to_string());
    let active_only = query.active_only.unwrap_or(false);

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
            policy.status as "status: PolicyStatus",
            car.make || ' ' || car.model as car_model,
            car.plate as "car_plate?"
        from policy
        join person on policy.holder_id = person.id
        left join green_card_policy on policy.id = green_card_policy.id
        left join osago_policy on policy.id = osago_policy.id
        left join car on car.id = coalesce(green_card_policy.car_id, osago_policy.car_id)
        where
            (lower(series || number) like $1
            or lower(person.first_name || ' ' || person.last_name) like $1
            or lower(coalesce(car.make || ' ' || car.model, '')) like $1
            or lower(coalesce(car.plate, '')) like $1)
            and (not $2 or policy.status = 'active')
        order by start_date desc
        limit 30
        "#,
        search_pattern,
        active_only
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(policies))
}
