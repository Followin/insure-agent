use axum::Json;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use serde::Deserialize;
use sqlx::PgPool;

use super::create::{PersonRef, PolicyData, resolve_car, resolve_person};
use super::get_by_id::PolicyFull;
use super::model::{PolicyStatus, PolicyType};
use crate::endpoints::car::model::Car;
use crate::endpoints::person::model::Person;

// === Update Request ===

#[derive(Deserialize)]
pub struct UpdatePolicyRequest {
    pub holder: PersonRef,
    pub series: String,
    pub number: String,
    pub start_date: chrono::NaiveDate,
    pub end_date: Option<chrono::NaiveDate>,
    pub status: PolicyStatus,
    #[serde(flatten)]
    pub data: PolicyData,
}

// === Helper Structs ===

struct PolicyTypeRow {
    policy_type: PolicyType,
}

// === Endpoint ===

pub async fn update_policy(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
    Json(body): Json<UpdatePolicyRequest>,
) -> Result<Json<PolicyFull>, StatusCode> {
    let mut tx = pool.begin().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Verify the policy exists and get its type
    let existing = sqlx::query_as!(
        PolicyTypeRow,
        r#"
        select type as "policy_type: PolicyType"
        from policy
        where id = $1
        "#,
        id
    )
    .fetch_optional(&mut *tx)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    // Verify the policy type matches (cannot change policy type)
    let request_type = match &body.data {
        PolicyData::GreenCard(_) => PolicyType::GreenCard,
        PolicyData::Medassistance(_) => PolicyType::Medassistance,
        PolicyData::Osago(_) => PolicyType::Osago,
    };

    if std::mem::discriminant(&existing.policy_type) != std::mem::discriminant(&request_type) {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Resolve holder
    let holder_id = resolve_person(&mut tx, body.holder)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Update main policy table
    sqlx::query!(
        r#"
        update policy
        set
            holder_id = $2,
            series = $3,
            number = $4,
            start_date = $5,
            end_date = $6,
            status = $7
        where id = $1
        "#,
        id,
        holder_id,
        body.series,
        body.number,
        body.start_date,
        body.end_date,
        body.status as PolicyStatus
    )
    .execute(&mut *tx)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Update type-specific data
    let details = match body.data {
        PolicyData::GreenCard(data) => {
            let car_id = resolve_car(&mut tx, data.car)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            sqlx::query!(
                r#"
                update green_card_policy
                set
                    territory = $2,
                    period_months = $3,
                    premium = $4,
                    car_id = $5
                where id = $1
                "#,
                id,
                data.territory,
                data.period_months,
                data.premium,
                car_id
            )
            .execute(&mut *tx)
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
                car_id
            )
            .fetch_one(&mut *tx)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            super::get_by_id::PolicyDetails::GreenCard(super::get_by_id::GreenCardDetails {
                territory: data.territory,
                period_months: data.period_months,
                premium: data.premium,
                car,
            })
        }
        PolicyData::Medassistance(data) => {
            sqlx::query!(
                r#"
                update medassistance_policy
                set
                    territory = $2,
                    period_months = $3,
                    premium = $4,
                    payout = $5,
                    program = $6
                where id = $1
                "#,
                id,
                data.territory,
                data.period_months,
                data.premium,
                data.payout,
                data.program
            )
            .execute(&mut *tx)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            // Resolve all member IDs first
            let mut member_ids = Vec::with_capacity(data.members.len());
            for member in data.members {
                let member_id = resolve_person(&mut tx, member)
                    .await
                    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
                member_ids.push(member_id);
            }

            // Delete existing members and insert new ones in bulk
            sqlx::query!(
                r#"
                delete from medassistance_policy_member
                where medassistance_policy_id = $1
                "#,
                id
            )
            .execute(&mut *tx)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            sqlx::query!(
                r#"
                insert into medassistance_policy_member (
                    medassistance_policy_id,
                    member_id
                )
                select $1, unnest($2::int[])
                "#,
                id,
                &member_ids
            )
            .execute(&mut *tx)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            // Fetch all members in a single query
            let members = sqlx::query_as!(
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
                where id = any($1)
                "#,
                &member_ids
            )
            .fetch_all(&mut *tx)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            super::get_by_id::PolicyDetails::Medassistance(super::get_by_id::MedassistanceDetails {
                territory: data.territory,
                period_months: data.period_months,
                premium: data.premium,
                payout: data.payout,
                program: data.program,
                members,
            })
        }
        PolicyData::Osago(data) => {
            let car_id = resolve_car(&mut tx, data.car)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            sqlx::query!(
                r#"
                update osago_policy
                set
                    period_months = $2,
                    zone = $3,
                    exempt = $4,
                    premium = $5,
                    franchise = $6,
                    car_id = $7
                where id = $1
                "#,
                id,
                data.period_months,
                data.zone,
                data.exempt,
                data.premium,
                data.franchise,
                car_id
            )
            .execute(&mut *tx)
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
                car_id
            )
            .fetch_one(&mut *tx)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            super::get_by_id::PolicyDetails::Osago(super::get_by_id::OsagoDetails {
                period_months: data.period_months,
                zone: data.zone,
                exempt: data.exempt,
                premium: data.premium,
                franchise: data.franchise,
                car,
            })
        }
    };

    // Fetch updated holder
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
        holder_id
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    tx.commit().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(PolicyFull {
        id,
        holder,
        series: body.series,
        number: body.number,
        start_date: body.start_date,
        end_date: body.end_date,
        status: body.status,
        details,
    }))
}
