use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "sex")]
pub enum Sex {
    M,
    F,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Person {
    pub id: i32,
    pub first_name: String,
    pub last_name: String,
    pub sex: Sex,
    pub birth_date: chrono::NaiveDate,
    pub tax_number: String,
    pub phone: String,
    pub phone2: Option<String>,
    pub email: String,
}
