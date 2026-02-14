use axum::Json;
use axum::extract::{Path, State};
use serde::Deserialize;
use sqlx::PgPool;

use super::create::{PersonRef, PolicyData, resolve_car, resolve_person};
use super::get_by_id::PolicyFull;
use crate::endpoints::car::model::Car;
use crate::endpoints::person::model::Person;
use crate::error::{AppError, AppResult};
use crate::models::{CarInsurancePeriodUnit, OsagoZone, PersonStatus, PolicyStatus, PolicyType};

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
) -> AppResult<Json<PolicyFull>> {
    let mut tx = pool.begin().await?;

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
    .await?
    .ok_or(AppError::not_found())?;

    // Verify the policy type matches (cannot change policy type)
    let request_type = match &body.data {
        PolicyData::GreenCard(_) => PolicyType::GreenCard,
        PolicyData::Medassistance(_) => PolicyType::Medassistance,
        PolicyData::Osago(_) => PolicyType::Osago,
    };

    if std::mem::discriminant(&existing.policy_type) != std::mem::discriminant(&request_type) {
        return Err(AppError::bad_request());
    }

    // Resolve holder
    let holder_id = resolve_person(&mut tx, body.holder).await?;

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
    .await?;

    // Update type-specific data
    let details = match body.data {
        PolicyData::GreenCard(data) => {
            let car_id = resolve_car(&mut tx, data.car).await?;

            sqlx::query!(
                r#"
                update green_card_policy
                set
                    territory = $2,
                    period_in_units = $3,
                    period_unit = $4,
                    premium = $5,
                    car_id = $6
                where id = $1
                "#,
                id,
                data.territory,
                data.period_in_units,
                data.period_unit as CarInsurancePeriodUnit,
                data.premium,
                car_id
            )
            .execute(&mut *tx)
            .await?;

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
            .await?;

            super::get_by_id::PolicyDetails::GreenCard(super::get_by_id::GreenCardDetails {
                territory: data.territory,
                period_unit: data.period_unit,
                period_in_units: data.period_in_units,
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
                    period_days = $3,
                    premium = $4,
                    payout = $5,
                    program = $6
                where id = $1
                "#,
                id,
                data.territory,
                data.period_days,
                data.premium,
                data.payout,
                data.program
            )
            .execute(&mut *tx)
            .await?;

            // Resolve all member IDs first
            let mut member_ids = Vec::with_capacity(data.members.len());
            for member in data.members {
                let member_id = resolve_person(&mut tx, member).await?;
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
            .await?;

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
            .await?;

            // Fetch all members in a single query
            let members = sqlx::query_as!(
                Person,
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
                where id = any($1)
                "#,
                &member_ids
            )
            .fetch_all(&mut *tx)
            .await?;

            super::get_by_id::PolicyDetails::Medassistance(super::get_by_id::MedassistanceDetails {
                territory: data.territory,
                period_days: data.period_days,
                premium: data.premium,
                payout: data.payout,
                program: data.program,
                members,
            })
        }
        PolicyData::Osago(data) => {
            let car_id = resolve_car(&mut tx, data.car).await?;

            sqlx::query!(
                r#"
                update osago_policy
                set
                    period_in_units = $2,
                    period_unit = $3,
                    zone = $4,
                    exempt = $5,
                    premium = $6,
                    car_id = $7
                where id = $1
                "#,
                id,
                data.period_in_units,
                data.period_unit as CarInsurancePeriodUnit,
                data.zone as OsagoZone,
                data.exempt,
                data.premium,
                car_id
            )
            .execute(&mut *tx)
            .await?;

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
            .await?;

            super::get_by_id::PolicyDetails::Osago(super::get_by_id::OsagoDetails {
                period_in_units: data.period_in_units,
                period_unit: data.period_unit,
                zone: data.zone,
                exempt: data.exempt,
                premium: data.premium,
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
        holder_id
    )
    .fetch_one(&mut *tx)
    .await?;

    tx.commit().await?;

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
