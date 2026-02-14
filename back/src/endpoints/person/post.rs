use axum::extract::State;
use axum::http::StatusCode;
use axum::Json;
use serde::Deserialize;
use sqlx::PgPool;

use super::model::{Person, Sex};
use crate::error::AppResult;
use crate::models::PersonStatus;

#[derive(Deserialize)]
pub struct CreatePerson {
    first_name: String,
    first_name_lat: Option<String>,
    last_name: String,
    last_name_lat: Option<String>,
    patronymic_name: Option<String>,
    patronymic_name_lat: Option<String>,
    sex: Sex,
    birth_date: chrono::NaiveDate,
    tax_number: String,
    phone: String,
    phone2: Option<String>,
    email: String,
    status: PersonStatus,
}

pub async fn create_person(
    State(pool): State<PgPool>,
    Json(body): Json<CreatePerson>,
) -> AppResult<(StatusCode, Json<Person>)> {
    let person = sqlx::query_as!(
        Person,
        r#"
        insert into person (first_name, first_name_lat, last_name, last_name_lat, patronymic_name, patronymic_name_lat, sex, birth_date, tax_number, phone, phone2, email, status)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        returning
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
        "#,
        body.first_name,
        body.first_name_lat,
        body.last_name,
        body.last_name_lat,
        body.patronymic_name,
        body.patronymic_name_lat,
        body.sex as Sex,
        body.birth_date,
        body.tax_number,
        body.phone,
        body.phone2,
        body.email,
        body.status as PersonStatus
    )
    .fetch_one(&pool)
    .await?;

    Ok((StatusCode::CREATED, Json(person)))
}
