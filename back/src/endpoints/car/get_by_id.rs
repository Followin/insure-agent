use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use sqlx::PgPool;

use super::model::Car;

pub async fn get_car(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> Result<Json<Car>, StatusCode> {
    sqlx::query_as!(
        Car,
        r#"
        select
            id,
            chassis,
            make,
            model,
            registration,
            plate,
            year,
            engine_displacement_litres,
            mileage_km,
            unladen_weight,
            laden_weight,
            seats
        from car
        where id = $1
        "#,
        id
    )
    .fetch_optional(&pool)
    .await
    .unwrap()
    .map(Json)
    .ok_or(StatusCode::NOT_FOUND)
}
