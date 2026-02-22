use axum::Json;
use axum::extract::{Path, State};
use serde::Serialize;
use sqlx::PgPool;

use crate::error::{AppError, AppResult};
use crate::shared::{
    person::model::{PersonFull, PersonStatus, Sex},
    policy::model::{PolicyShort, PolicyStatus, PolicyType},
};

#[derive(Serialize)]
pub struct PersonWithPolicies {
    #[serde(flatten)]
    pub person: PersonFull,
    pub policies: Vec<PolicyShort>,
}

pub async fn get_person(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> AppResult<Json<PersonWithPolicies>> {
    let person = sqlx::query_as!(
        PersonFull,
        r#"
        select
            id,
            first_name,
            first_name_lat,
            last_name,
            last_name_lat,
            patronymic_name,
            patronymic_name_lat,
            sex as "sex: Sex",
            birth_date,
            tax_number,
            phone,
            phone2,
            email,
            status as "status: PersonStatus"
        from person
        where id = $1
        "#,
        id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or(AppError::not_found())?;

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
        left join medassistance_policy_member mpm on policy.id = mpm.medassistance_policy_id
        where policy.holder_id = $1 or mpm.member_id = $1
        order by start_date desc
        "#,
        id
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(PersonWithPolicies { person, policies }))
}
