use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "policy_status")]
#[sqlx(rename_all = "snake_case")]
pub enum PolicyStatus {
    Active,
    Prolonged,
    Rejected,
    Stopped,
    Postponed,
    Cancelled,
    Project,
    Replaced,
    Expired,
}

#[derive(Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "policy_type")]
#[sqlx(rename_all = "snake_case")]
pub enum PolicyType {
    GreenCard,
    Medassistance,
    Osago,
}

#[derive(Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "car_insurance_period_unit")]
#[sqlx(rename_all = "snake_case")]
pub enum CarInsurancePeriodUnit {
    Day,
    Month,
    Year,
}

#[derive(Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "osago_zone")]
#[sqlx(rename_all = "snake_case")]
pub enum OsagoZone {
    Zone1,
    Zone2,
    Zone3,
    Zone4,
    Zone5,
    Outside,
}

#[derive(Serialize, Deserialize)]
pub struct PolicyShort {
    pub id: i32,
    pub policy_type: PolicyType,
    pub holder_name: String,
    pub series: String,
    pub number: String,
    pub start_date: chrono::NaiveDate,
    pub end_date: Option<chrono::NaiveDate>,
    pub status: PolicyStatus,
    pub car_model: Option<String>,
    pub car_plate: Option<String>,
}
