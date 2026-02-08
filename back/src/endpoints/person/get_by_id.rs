use axum::Json;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use serde::Serialize;
use sqlx::PgPool;

use super::model::{Person, Sex};
use crate::models::{PolicyShort, PolicyStatus, PolicyType};

#[derive(Serialize)]
pub struct PersonWithPolicies {
    #[serde(flatten)]
    pub person: Person,
    pub policies: Vec<PolicyShort>,
}

pub async fn get_person(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> Result<Json<PersonWithPolicies>, StatusCode> {
    let person = sqlx::query_as!(
        Person,
        r#"
        select
            id,
            first_name,
            last_name,
            sex as "sex: Sex",
            birth_date,
            tax_number,
            phone,
            phone2,
            email
        from person
        where id = $1
        "#,
        id
    )
    .fetch_optional(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

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
            status as "status: PolicyStatus",
            car.make || ' ' || car.model as car_model,
            car.plate as "car_plate?"
        from policy
        join person on policy.holder_id = person.id
        left join green_card_policy on policy.id = green_card_policy.id
        left join osago_policy on policy.id = osago_policy.id
        left join car on car.id = coalesce(green_card_policy.car_id, osago_policy.car_id)
        left join medassistance_policy_member mpm on policy.id = mpm.medassistance_policy_id
        where policy.holder_id = $1 or mpm.member_id = $1
        order by start_date desc
        "#,
        id
    )
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(PersonWithPolicies { person, policies }))
}
