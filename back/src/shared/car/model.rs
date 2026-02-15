use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(Deserialize)]
pub struct CarNew {
    pub chassis: String,
    pub make: String,
    pub model: String,
    pub registration: String,
    pub plate: String,
    pub year: i32,
    pub engine_displacement_litres: i32,
    pub mileage_km: i32,
    pub unladen_weight: i32,
    pub laden_weight: i32,
    pub seats: i32,
}

#[derive(Deserialize)]
#[serde(tag = "kind")]
pub enum CarRef {
    Existing { id: i32 },
    New(Box<CarNew>),
    ExistingWithUpdates {
        id: i32,
        #[serde(flatten)]
        data: Box<CarNew>,
    },
}

#[derive(FromRow, Serialize)]
pub struct CarFull {
    pub id: i32,
    pub chassis: String,
    pub make: String,
    pub model: String,
    pub registration: String,
    pub plate: String,
    pub year: i32,
    pub engine_displacement_litres: i32,
    pub mileage_km: i32,
    pub unladen_weight: i32,
    pub laden_weight: i32,
    pub seats: i32,
}
