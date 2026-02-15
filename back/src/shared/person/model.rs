use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "person_status")]
#[sqlx(rename_all = "snake_case")]
pub enum PersonStatus {
    Active,
    Inactive,
    Archived,
}

#[derive(Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "sex")]
#[sqlx(rename_all = "snake_case")]
pub enum Sex {
    M,
    F,
    Unknown,
}

#[derive(Deserialize)]
pub struct PersonNew {
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

#[derive(Deserialize)]
#[serde(tag = "kind")]
pub enum PersonRef {
    Existing { id: i32 },
    New(Box<PersonNew>),
    ExistingWithUpdates {
        id: i32,
        #[serde(flatten)]
        data: Box<PersonNew>,
    },
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct PersonFull {
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
