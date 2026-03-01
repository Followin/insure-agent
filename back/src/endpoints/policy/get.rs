use axum::Json;
use axum::extract::{Query, State};
use chrono::NaiveDate;
use serde::Deserialize;
use sqlx::PgPool;

use crate::error::AppResult;
use crate::shared::policy::model::{PolicyShort, PolicyStatus, PolicyType};

#[derive(Deserialize)]
pub struct PolicyQuery {
    pub number: Option<String>,
    pub holder: Option<String>,
    pub car: Option<String>,
    pub start_date_from: Option<NaiveDate>,
    pub start_date_to: Option<NaiveDate>,
    pub end_date_from: Option<NaiveDate>,
    pub end_date_to: Option<NaiveDate>,
    pub policy_types: Option<String>,
    pub statuses: Option<String>,
}

fn parse_enum_list<T>(s: Option<&str>) -> Vec<T>
where
    T: serde::de::DeserializeOwned,
{
    s.filter(|s| !s.is_empty())
        .map(|s| {
            s.split(',')
                .filter_map(|t| {
                    serde_json::from_value(serde_json::Value::String(t.to_string())).ok()
                })
                .collect()
        })
        .unwrap_or_default()
}

pub async fn get_policies(
    State(pool): State<PgPool>,
    Query(query): Query<PolicyQuery>,
) -> AppResult<Json<Vec<PolicyShort>>> {
    let number_pattern = query
        .number
        .as_deref()
        .map(|s| format!("%{}%", s.to_lowercase()));
    let holder_pattern = query
        .holder
        .as_deref()
        .map(|s| format!("%{}%", s.to_lowercase()));
    let car_pattern = query
        .car
        .as_deref()
        .map(|s| format!("%{}%", s.to_lowercase()));

    let policy_types: Vec<PolicyType> = parse_enum_list(query.policy_types.as_deref());
    let statuses: Vec<PolicyStatus> = parse_enum_list(query.statuses.as_deref());

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
            car.plate as "car_plate?",
            (
                select string_agg(a.full_name, ', ' order by a.full_name)
                from agent a
                join agent_policy ap on a.id = ap.agent_id
                where ap.policy_id = policy.id
            ) as agent_names
        from policy
        join person on policy.holder_id = person.id
        left join green_card_policy on policy.id = green_card_policy.id
        left join osago_policy on policy.id = osago_policy.id
        left join car on car.id = coalesce(green_card_policy.car_id, osago_policy.car_id)
        where
            ($1::text is null or lower(series || number) like $1)
            and ($2::text is null or lower(person.first_name || ' ' || person.last_name) like $2)
            and ($3::text is null or lower(coalesce(car.make || ' ' || car.model || ' ' || coalesce(car.plate, ''), '')) like $3)
            and ($4::date is null or start_date >= $4)
            and ($5::date is null or start_date <= $5)
            and ($6::date is null or end_date >= $6)
            and ($7::date is null or end_date <= $7)
            and (cardinality($8::policy_type[]) = 0 or type = any($8::policy_type[]))
            and (cardinality($9::policy_status[]) = 0 or policy.status = any($9::policy_status[]))
        order by
            case policy.status
                when 'active' then 1
                when 'prolonged' then 2
                else 3
            end,
            start_date desc
        limit 150
        "#,
        number_pattern as Option<String>,
        holder_pattern as Option<String>,
        car_pattern as Option<String>,
        query.start_date_from as Option<NaiveDate>,
        query.start_date_to as Option<NaiveDate>,
        query.end_date_from as Option<NaiveDate>,
        query.end_date_to as Option<NaiveDate>,
        &policy_types as &[PolicyType],
        &statuses as &[PolicyStatus],
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(policies))
}
