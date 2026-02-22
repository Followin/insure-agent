use axum::Json;
use axum::extract::{Path, State};
use serde::Serialize;
use sqlx::PgPool;

use crate::error::{AppError, AppResult};
use crate::shared::{
    car::model::CarFull,
    person::model::{PersonFull, PersonStatus},
    policy::model::{CarInsurancePeriodUnit, OsagoZone, PolicyStatus, PolicyType},
};

// === Response Models ===

#[derive(Serialize)]
pub struct GreenCardDetails {
    pub territory: String,
    pub period_in_units: i32,
    pub period_unit: CarInsurancePeriodUnit,
    pub premium: i32,
    pub car: CarFull,
}

#[derive(Serialize)]
pub struct MedassistanceDetails {
    pub territory: String,
    pub period_days: i32,
    pub premium: i32,
    pub payout: i32,
    pub program: String,
    pub members: Vec<PersonFull>,
}

#[derive(Serialize)]
pub struct OsagoDetails {
    pub period_in_units: i32,
    pub period_unit: CarInsurancePeriodUnit,
    pub zone: OsagoZone,
    pub exempt: String,
    pub premium: i32,
    pub car: CarFull,
}

#[derive(Serialize)]
#[serde(tag = "policy_type")]
pub enum PolicyDetails {
    GreenCard(GreenCardDetails),
    Medassistance(MedassistanceDetails),
    Osago(OsagoDetails),
}

#[derive(Serialize)]
pub struct Agent {
    pub id: i32,
    pub full_name: String,
}

#[derive(Serialize)]
pub struct PolicyFull {
    pub id: i32,
    pub holder: PersonFull,
    pub series: String,
    pub number: String,
    pub start_date: chrono::NaiveDate,
    pub end_date: Option<chrono::NaiveDate>,
    pub status: PolicyStatus,
    pub agents: Vec<Agent>,
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
    period_in_units: i32,
    period_unit: CarInsurancePeriodUnit,
    premium: i32,
    car_id: i32,
}

struct MedassistanceRow {
    territory: String,
    period_days: i32,
    premium: i32,
    payout: i32,
    program: String,
}

struct OsagoRow {
    period_in_units: i32,
    period_unit: CarInsurancePeriodUnit,
    zone: OsagoZone,
    exempt: String,
    premium: i32,
    car_id: i32,
}

// === Endpoint ===

pub async fn get_policy_by_id(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> AppResult<Json<PolicyFull>> {
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
    .await?
    .ok_or(AppError::not_found())?;

    let holder = sqlx::query_as!(
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
            sex as "sex: _",
            birth_date,
            tax_number,
            phone,
            phone2,
            email,
            status as "status: PersonStatus"
        from person
        where id = $1
        "#,
        policy.holder_id
    )
    .fetch_one(&pool)
    .await?;

    let details = match policy.policy_type {
        PolicyType::GreenCard => {
            let row = sqlx::query_as!(
                GreenCardRow,
                r#"
                select
                    territory,
                    period_in_units,
                    period_unit as "period_unit: CarInsurancePeriodUnit",
                    premium,
                    car_id
                from green_card_policy
                where id = $1
                "#,
                id
            )
            .fetch_one(&pool)
            .await?;

            let car = sqlx::query_as!(
                CarFull,
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
            .await?;

            PolicyDetails::GreenCard(GreenCardDetails {
                territory: row.territory,
                period_in_units: row.period_in_units,
                period_unit: row.period_unit,
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
                    period_days,
                    premium,
                    payout,
                    program
                from medassistance_policy
                where id = $1
                "#,
                id
            )
            .fetch_one(&pool)
            .await?;

            let members = sqlx::query_as!(
                PersonFull,
                r#"
                select
                    p.id,
                    p.first_name,
                    p.first_name_lat,
                    p.last_name,
                    p.last_name_lat,
                    p.patronymic_name,
                    p.patronymic_name_lat,
                    p.sex as "sex: _",
                    p.birth_date,
                    p.tax_number,
                    p.phone,
                    p.phone2,
                    p.email,
                    p.status as "status: PersonStatus"
                from person p
                join medassistance_policy_member m on p.id = m.member_id
                where m.medassistance_policy_id = $1
                "#,
                id
            )
            .fetch_all(&pool)
            .await?;

            PolicyDetails::Medassistance(MedassistanceDetails {
                territory: row.territory,
                period_days: row.period_days,
                premium: row.premium,
                payout: row.payout,
                program: row.program,
                members,
            })
        }
        PolicyType::Osago => {
            let row = sqlx::query_as!(
                OsagoRow,
                r#"
                select
                    period_in_units,
                    period_unit as "period_unit: CarInsurancePeriodUnit",
                    zone as "zone: OsagoZone",
                    exempt,
                    premium,
                    car_id
                from osago_policy
                where id = $1
                "#,
                id
            )
            .fetch_one(&pool)
            .await?;

            let car = sqlx::query_as!(
                CarFull,
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
            .await?;

            PolicyDetails::Osago(OsagoDetails {
                period_in_units: row.period_in_units,
                period_unit: row.period_unit,
                zone: row.zone,
                exempt: row.exempt,
                premium: row.premium,
                car,
            })
        }
    };

    let agents = sqlx::query_as!(
        Agent,
        r#"
        SELECT a.id, a.full_name
        FROM agent a
        JOIN agent_policy ap ON a.id = ap.agent_id
        WHERE ap.policy_id = $1
        ORDER BY a.full_name
        "#,
        id
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(PolicyFull {
        id: policy.id,
        holder,
        series: policy.series,
        number: policy.number,
        start_date: policy.start_date,
        end_date: policy.end_date,
        status: policy.status,
        agents,
        details,
    }))
}
