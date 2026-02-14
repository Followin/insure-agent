use serde::{Deserialize, Serialize};

use crate::models::PersonStatus;

#[derive(Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "sex")]
#[sqlx(rename_all = "snake_case")]
pub enum Sex {
    M,
    F,
    Unknown,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Person {
    pub id: i32,
    pub first_name: String,
    pub first_name_lat: Option<String>,
    pub last_name: String,
    pub last_name_lat: Option<String>,
    pub patronymic_name: Option<String>,
    pub patronymic_name_lat: Option<String>,
    pub sex: Sex,
    pub birth_date: chrono::NaiveDate,
    pub tax_number: String,
    pub phone: String,
    pub phone2: Option<String>,
    pub email: String,
    pub status: PersonStatus,
}
