use axum::Json;
use axum::extract::State;
use axum::http::StatusCode;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::{
    error::AppResult,
    shared::{
        car::{model::CarRef, resolver::resolve_car},
        person::{model::PersonRef, resolver::resolve_person},
        policy::model::{CarInsurancePeriodUnit, OsagoZone, PolicyStatus, PolicyType},
    },
};

// === Policy Type Specific Data ===

#[derive(Deserialize)]
pub struct GreenCardData {
    pub territory: String,
    pub period_in_units: i32,
    pub period_unit: CarInsurancePeriodUnit,
    pub premium: i32,
    pub car: CarRef,
}

#[derive(Deserialize)]
pub struct MedassistanceData {
    pub territory: String,
    pub period_days: i32,
    pub premium: i32,
    pub payout: i32,
    pub program: String,
    pub members: Vec<PersonRef>,
}

#[derive(Deserialize)]
pub struct OsagoData {
    pub period_in_units: i32,
    pub period_unit: CarInsurancePeriodUnit,
    pub zone: OsagoZone,
    pub exempt: String,
    pub premium: i32,
    pub car: CarRef,
}

#[derive(Deserialize)]
#[serde(tag = "policy_type")]
pub enum PolicyData {
    GreenCard(GreenCardData),
    Medassistance(MedassistanceData),
    Osago(OsagoData),
}

// === Create Policy Request ===

#[derive(Deserialize)]
pub struct CreatePolicyRequest {
    pub holder: PersonRef,
    pub series: String,
    pub number: String,
    pub start_date: chrono::NaiveDate,
    pub end_date: Option<chrono::NaiveDate>,
    pub status: PolicyStatus,
    pub agent_ids: Vec<i32>,
    #[serde(flatten)]
    pub data: PolicyData,
}

// === Response ===

#[derive(Serialize)]
pub struct CreatePolicyResponse {
    pub id: i32,
    pub policy_type: PolicyType,
    pub holder_id: i32,
    pub series: String,
    pub number: String,
    pub start_date: chrono::NaiveDate,
    pub end_date: Option<chrono::NaiveDate>,
    pub status: PolicyStatus,
}

// === Endpoint ===

pub async fn create_policy(
    State(pool): State<PgPool>,
    Json(body): Json<CreatePolicyRequest>,
) -> AppResult<(StatusCode, Json<CreatePolicyResponse>)> {
    let mut tx = pool.begin().await?;

    let holder_id = resolve_person(&mut tx, body.holder).await?;

    let policy_type = match &body.data {
        PolicyData::GreenCard(_) => PolicyType::GreenCard,
        PolicyData::Medassistance(_) => PolicyType::Medassistance,
        PolicyData::Osago(_) => PolicyType::Osago,
    };

    let policy = sqlx::query_as!(
        CreatePolicyResponse,
        r#"
        insert into policy (type, holder_id, series, number, start_date, end_date, status)
        values ($1, $2, $3, $4, $5, $6, $7)
        returning
            id,
            type as "policy_type: PolicyType",
            holder_id,
            series,
            number,
            start_date,
            end_date,
            status as "status: PolicyStatus"
        "#,
        policy_type as PolicyType,
        holder_id,
        body.series,
        body.number,
        body.start_date,
        body.end_date,
        body.status as PolicyStatus
    )
    .fetch_one(&mut *tx)
    .await?;

    match body.data {
        PolicyData::GreenCard(data) => {
            let car_id = resolve_car(&mut tx, data.car).await?;

            sqlx::query!(
                r#"
                insert into green_card_policy (id, territory, period_in_units, period_unit, premium, car_id)
                values ($1, $2, $3, $4, $5, $6)
                "#,
                policy.id,
                data.territory,
                data.period_in_units,
                data.period_unit as CarInsurancePeriodUnit,
                data.premium,
                car_id
            )
            .execute(&mut *tx)
            .await?;
        }
        PolicyData::Medassistance(data) => {
            sqlx::query!(
                r#"
                insert into medassistance_policy (id, territory, period_days, premium, payout, program)
                values ($1, $2, $3, $4, $5, $6)
                "#,
                policy.id,
                data.territory,
                data.period_days,
                data.premium,
                data.payout,
                data.program
            )
            .execute(&mut *tx)
            .await?;

            for member in data.members {
                let member_id = resolve_person(&mut tx, member).await?;

                sqlx::query!(
                    r#"
                    insert into medassistance_policy_member (medassistance_policy_id, member_id)
                    values ($1, $2)
                    "#,
                    policy.id,
                    member_id
                )
                .execute(&mut *tx)
                .await?;
            }
        }
        PolicyData::Osago(data) => {
            let car_id = resolve_car(&mut tx, data.car).await?;

            sqlx::query!(
                r#"
                insert into osago_policy (id, period_in_units, period_unit, car_id, zone, exempt, premium)
                values ($1, $2, $3, $4, $5, $6, $7)
                "#,
                policy.id,
                data.period_in_units,
                data.period_unit as CarInsurancePeriodUnit,
                car_id,
                data.zone as OsagoZone,
                data.exempt,
                data.premium
            )
            .execute(&mut *tx)
            .await?;
        }
    }

    // Insert agent_policy links
    for agent_id in body.agent_ids {
        sqlx::query!(
            r#"
            INSERT INTO agent_policy (agent_id, policy_id)
            VALUES ($1, $2)
            "#,
            agent_id,
            policy.id
        )
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok((StatusCode::CREATED, Json(policy)))
}
