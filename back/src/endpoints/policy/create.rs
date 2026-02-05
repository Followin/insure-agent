use axum::Json;
use axum::extract::State;
use axum::http::StatusCode;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use super::model::{PolicyStatus, PolicyType};
use crate::endpoints::person::model::Sex;

// === Person Reference ===

#[derive(Deserialize)]
pub struct NewPerson {
    pub first_name: String,
    pub last_name: String,
    pub sex: Sex,
    pub birth_date: chrono::NaiveDate,
    pub tax_number: String,
    pub phone: String,
    pub phone2: Option<String>,
    pub email: String,
}

#[derive(Deserialize)]
#[serde(tag = "kind")]
pub enum PersonRef {
    Existing { id: i32 },
    New(NewPerson),
}

// === Car Reference ===

#[derive(Deserialize)]
pub struct NewCar {
    pub chassis: String,
    pub make: String,
    pub model: String,
    pub registration: String,
    pub plate: String,
    pub year: i32,
    pub engine_displacement_litres: i32,
    pub mileage_km: i32,
    pub unladen_weight: i32,
    pub laden_weight: i32,
    pub seats: i32,
}

#[derive(Deserialize)]
#[serde(tag = "kind")]
pub enum CarRef {
    Existing { id: i32 },
    New(NewCar),
}

// === Policy Type Specific Data ===

#[derive(Deserialize)]
pub struct GreenCardData {
    pub territory: String,
    pub period_months: i32,
    pub premium: i32,
    pub car: CarRef,
}

#[derive(Deserialize)]
pub struct MedassistanceData {
    pub territory: String,
    pub period_months: i32,
    pub premium: i32,
    pub payout: i32,
    pub program: String,
    pub members: Vec<PersonRef>,
}

#[derive(Deserialize)]
pub struct OsagoData {
    // osago has no extra fields in the schema
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

// === Helper Functions ===

struct IdResult {
    id: i32,
}

pub async fn resolve_person(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    person_ref: PersonRef,
) -> Result<i32, sqlx::Error> {
    match person_ref {
        PersonRef::Existing { id } => Ok(id),
        PersonRef::New(person) => {
            let result = sqlx::query_as!(
                IdResult,
                r#"
                insert into person (first_name, last_name, sex, birth_date, tax_number, phone, phone2, email)
                values ($1, $2, $3, $4, $5, $6, $7, $8)
                returning id
                "#,
                person.first_name,
                person.last_name,
                person.sex as Sex,
                person.birth_date,
                person.tax_number,
                person.phone,
                person.phone2,
                person.email
            )
            .fetch_one(&mut **tx)
            .await?;
            Ok(result.id)
        }
    }
}

pub async fn resolve_car(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    car_ref: CarRef,
) -> Result<i32, sqlx::Error> {
    match car_ref {
        CarRef::Existing { id } => Ok(id),
        CarRef::New(car) => {
            let result = sqlx::query_as!(
                IdResult,
                r#"
                insert into car (chassis, make, model, registration, plate, year, engine_displacement_litres, mileage_km, unladen_weight, laden_weight, seats)
                values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                returning id
                "#,
                car.chassis,
                car.make,
                car.model,
                car.registration,
                car.plate,
                car.year,
                car.engine_displacement_litres,
                car.mileage_km,
                car.unladen_weight,
                car.laden_weight,
                car.seats
            )
            .fetch_one(&mut **tx)
            .await?;
            Ok(result.id)
        }
    }
}

// === Endpoint ===

pub async fn create_policy(
    State(pool): State<PgPool>,
    Json(body): Json<CreatePolicyRequest>,
) -> Result<(StatusCode, Json<CreatePolicyResponse>), StatusCode> {
    let mut tx = pool.begin().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let holder_id = resolve_person(&mut tx, body.holder)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let policy_type = match &body.data {
        PolicyData::GreenCard(_) => PolicyType::GreenCard,
        PolicyData::Medassistance(_) => PolicyType::Medassistance,
        PolicyData::Osago(_) => PolicyType::Osago,
    };

    let policy = sqlx::query_as!(
        CreatePolicyResponse,
        r#"
        insert into policy (type, holder_id, series, number, start_date, end_date, status)
        values ($1, $2, $3, $4, $5, $6, 'active')
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
        body.end_date
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match body.data {
        PolicyData::GreenCard(data) => {
            let car_id = resolve_car(&mut tx, data.car)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            sqlx::query!(
                r#"
                insert into green_card_policy (id, territory, period_months, premium, car_id)
                values ($1, $2, $3, $4, $5)
                "#,
                policy.id,
                data.territory,
                data.period_months,
                data.premium,
                car_id
            )
            .execute(&mut *tx)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        }
        PolicyData::Medassistance(data) => {
            sqlx::query!(
                r#"
                insert into medassistance_policy (id, territory, period_months, premium, payout, program)
                values ($1, $2, $3, $4, $5, $6)
                "#,
                policy.id,
                data.territory,
                data.period_months,
                data.premium,
                data.payout,
                data.program
            )
            .execute(&mut *tx)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            for member in data.members {
                let member_id = resolve_person(&mut tx, member)
                    .await
                    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

                sqlx::query!(
                    r#"
                    insert into medassistance_policy_member (medassistance_policy_id, member_id)
                    values ($1, $2)
                    "#,
                    policy.id,
                    member_id
                )
                .execute(&mut *tx)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            }
        }
        PolicyData::Osago(_) => {
            // Osago has no additional tables
        }
    }

    tx.commit().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((StatusCode::CREATED, Json(policy)))
}
