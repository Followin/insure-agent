use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "policy_status")]
#[sqlx(rename_all = "snake_case")]
pub enum PolicyStatus {
    Expired,
    Active,
    Terminated,
}

#[derive(Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "policy_type")]
#[sqlx(rename_all = "snake_case")]
pub enum PolicyType {
    GreenCard,
    Medassistance,
    Osago,
}
