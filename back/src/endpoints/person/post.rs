use axum::extract::State;
use axum::http::StatusCode;
use axum::Json;
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

pub async fn create_person(
    State(pool): State<PgPool>,
    Json(body): Json<CreatePerson>,
) -> (StatusCode, Json<Person>) {
    let person = sqlx::query_as!(
        Person,
        r#"
        insert into person (first_name, last_name, sex, birth_date, tax_number, phone, phone2, email)
        values ($1, $2, $3, $4, $5, $6, $7, $8)
        returning
            id,
            first_name,
            last_name,
            sex as "sex: Sex",
            birth_date,
            tax_number,
            phone,
            phone2,
            email
        "#,
        body.first_name,
        body.last_name,
        body.sex as Sex,
        body.birth_date,
        body.tax_number,
        body.phone,
        body.phone2,
        body.email
    )
    .fetch_one(&pool)
    .await
    .unwrap();

    (StatusCode::CREATED, Json(person))
}
