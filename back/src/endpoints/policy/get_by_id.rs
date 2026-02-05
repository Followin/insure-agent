use axum::Json;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use serde::Serialize;
use sqlx::PgPool;

use super::model::{PolicyStatus, PolicyType};
use crate::endpoints::car::model::Car;
use crate::endpoints::person::model::Person;

// === Response Models ===

#[derive(Serialize)]
pub struct GreenCardDetails {
    pub territory: String,
    pub period_months: i32,
    pub premium: i32,
    pub car: Car,
}

#[derive(Serialize)]
pub struct MedassistanceDetails {
    pub territory: String,
    pub period_months: i32,
    pub premium: i32,
    pub payout: i32,
    pub program: String,
    pub members: Vec<Person>,
}

#[derive(Serialize)]
pub struct OsagoDetails {}

#[derive(Serialize)]
#[serde(tag = "policy_type")]
pub enum PolicyDetails {
    GreenCard(GreenCardDetails),
    Medassistance(MedassistanceDetails),
    Osago(OsagoDetails),
}

#[derive(Serialize)]
pub struct PolicyFull {
    pub id: i32,
    pub holder: Person,
    pub series: String,
    pub number: String,
    pub start_date: chrono::NaiveDate,
    pub end_date: Option<chrono::NaiveDate>,
    pub status: PolicyStatus,
    #[serde(flatten)]
    pub details: PolicyDetails,
}

// === Helper Structs ===

struct PolicyBase {
    id: i32,
    policy_type: PolicyType,
    holder_id: i32,
    series: String,
    number: String,
    start_date: chrono::NaiveDate,
    end_date: Option<chrono::NaiveDate>,
    status: PolicyStatus,
}

struct GreenCardRow {
    territory: String,
    period_months: i32,
    premium: i32,
    car_id: i32,
}

struct MedassistanceRow {
    territory: String,
    period_months: i32,
    premium: i32,
    payout: i32,
    program: String,
}

// === Endpoint ===

pub async fn get_policy_by_id(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> Result<Json<PolicyFull>, StatusCode> {
    let policy = sqlx::query_as!(
        PolicyBase,
        r#"
        select
            id,
            type as "policy_type: PolicyType",
            holder_id,
            series,
            number,
            start_date,
            end_date,
            status as "status: PolicyStatus"
        from policy
        where id = $1
        "#,
        id
    )
    .fetch_optional(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    let holder = sqlx::query_as!(
        Person,
        r#"
        select
            id,
            first_name,
            last_name,
            sex as "sex: _",
            birth_date,
            tax_number,
            phone,
            phone2,
            email
        from person
        where id = $1
        "#,
        policy.holder_id
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let details = match policy.policy_type {
        PolicyType::GreenCard => {
            let row = sqlx::query_as!(
                GreenCardRow,
                r#"
                select
                    territory,
                    period_months,
                    premium,
                    car_id
                from green_card_policy
                where id = $1
                "#,
                id
            )
            .fetch_one(&pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            let car = sqlx::query_as!(
                Car,
                r#"
                select
                    id,
                    chassis,
                    make,
                    model,
                    registration,
                    plate,
                    year,
                    engine_displacement_litres,
                    mileage_km,
                    unladen_weight,
                    laden_weight,
                    seats
                from car
                where id = $1
                "#,
                row.car_id
            )
            .fetch_one(&pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            PolicyDetails::GreenCard(GreenCardDetails {
                territory: row.territory,
                period_months: row.period_months,
                premium: row.premium,
                car,
            })
        }
        PolicyType::Medassistance => {
            let row = sqlx::query_as!(
                MedassistanceRow,
                r#"
                select
                    territory,
                    period_months,
                    premium,
                    payout,
                    program
                from medassistance_policy
                where id = $1
                "#,
                id
            )
            .fetch_one(&pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            let members = sqlx::query_as!(
                Person,
                r#"
                select
                    p.id,
                    p.first_name,
                    p.last_name,
                    p.sex as "sex: _",
                    p.birth_date,
                    p.tax_number,
                    p.phone,
                    p.phone2,
                    p.email
                from person p
                join medassistance_policy_member m on p.id = m.member_id
                where m.medassistance_policy_id = $1
                "#,
                id
            )
            .fetch_all(&pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            PolicyDetails::Medassistance(MedassistanceDetails {
                territory: row.territory,
                period_months: row.period_months,
                premium: row.premium,
                payout: row.payout,
                program: row.program,
                members,
            })
        }
        PolicyType::Osago => PolicyDetails::Osago(OsagoDetails {}),
    };

    Ok(Json(PolicyFull {
        id: policy.id,
        holder,
        series: policy.series,
        number: policy.number,
        start_date: policy.start_date,
        end_date: policy.end_date,
        status: policy.status,
        details,
    }))
}
