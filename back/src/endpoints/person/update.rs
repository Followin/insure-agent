use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use serde::Deserialize;
use sqlx::PgPool;

use super::model::{Person, Sex};

#[derive(Deserialize)]
pub struct UpdatePerson {
    first_name: String,
    last_name: String,
    sex: Sex,
    birth_date: chrono::NaiveDate,
    tax_number: String,
    phone: String,
    phone2: Option<String>,
    email: String,
}

pub async fn update_person(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
    Json(body): Json<UpdatePerson>,
) -> Result<Json<Person>, StatusCode> {
    let person = sqlx::query_as!(
        Person,
        r#"
        update person
        set
            first_name = $2,
            last_name = $3,
            sex = $4,
            birth_date = $5,
            tax_number = $6,
            phone = $7,
            phone2 = $8,
            email = $9
        where id = $1
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
        id,
        body.first_name,
        body.last_name,
        body.sex as Sex,
        body.birth_date,
        body.tax_number,
        body.phone,
        body.phone2,
        body.email
    )
    .fetch_optional(&pool)
    .await
    .unwrap();

    person.map(Json).ok_or(StatusCode::NOT_FOUND)
}
