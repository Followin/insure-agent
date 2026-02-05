use serde::Serialize;
use sqlx::FromRow;

#[derive(FromRow, Serialize)]
pub struct Car {
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
