use axum::Json;
use axum::extract::{Path, State};
use serde::Deserialize;
use sqlx::PgPool;

use crate::error::{AppError, AppResult};
use crate::shared::person::model::{PersonFull, PersonStatus, Sex};

#[derive(Deserialize)]
pub struct UpdatePerson {
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

pub async fn update_person(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
    Json(body): Json<UpdatePerson>,
) -> AppResult<Json<PersonFull>> {
    let person = sqlx::query_as!(
        PersonFull,
        r#"
        update person
        set
            first_name = $2,
            first_name_lat = $3,
            last_name = $4,
            last_name_lat = $5,
            patronymic_name = $6,
            patronymic_name_lat = $7,
            sex = $8,
            birth_date = $9,
            tax_number = $10,
            phone = $11,
            phone2 = $12,
            email = $13,
            status = $14
        where id = $1
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
        id,
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
    .fetch_optional(&pool)
    .await?;

    person.map(Json).ok_or(AppError::not_found())
}
