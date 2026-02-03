use axum::Json;
use axum::extract::State;
use axum::http::StatusCode;
use serde::Deserialize;
use sqlx::PgPool;

use super::model::{Person, Sex};

#[derive(Deserialize)]
pub struct CreatePerson {
    first_name: String,
    last_name: String,
    sex: Sex,
    birth_date: chrono::NaiveDate,
    tax_number: String,
    phone: String,
    phone2: Option<String>,
    email: String,
}

pub async fn create_policy(
    State(pool): State<PgPool>,
    Json(body): Json<CreatePerson>,
) -> (StatusCode, Json<Person>) {
    let person = sqlx::query_as::<_, Person>(
        "INSERT INTO person (first_name, last_name, sex, birth_date, tax_number, phone, phone2, email)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *",
    )
    .bind(&body.first_name)
    .bind(&body.last_name)
    .bind(&body.sex)
    .bind(body.birth_date)
    .bind(&body.tax_number)
    .bind(&body.phone)
    .bind(&body.phone2)
    .bind(&body.email)
    .fetch_one(&pool)
    .await
    .unwrap();

    (StatusCode::CREATED, Json(person))
}
