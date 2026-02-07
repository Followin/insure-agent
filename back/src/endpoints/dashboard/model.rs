use chrono::NaiveDate;
use serde::Serialize;

use super::super::policy::model::PolicyType;

#[derive(Serialize)]
pub struct DashboardStats {
    pub people_count: i64,
    pub policy_count: i64,
    pub car_count: i64,
    pub upcoming_birthdays: Vec<BirthdayPerson>,
    pub expiring_policies: Vec<ExpiringPolicy>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct BirthdayPerson {
    pub id: i32,
    pub first_name: String,
    pub last_name: String,
    pub phone: String,
    pub birth_date: NaiveDate,
    pub age: i32,
    pub days_until: i32,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct ExpiringPolicy {
    pub id: i32,
    pub series: String,
    pub number: String,
    #[sqlx(rename = "type")]
    pub policy_type: PolicyType,
    pub end_date: NaiveDate,
    pub holder_first_name: String,
    pub holder_last_name: String,
    pub days_until: i32,
}
