use super::model::CarRef;
use crate::shared::IdResult;

pub async fn resolve_car(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    car_ref: CarRef,
) -> Result<i32, sqlx::Error> {
    match car_ref {
        CarRef::Existing { id } => Ok(id),
        CarRef::New(car) => {
            let result = sqlx::query_as!(
                IdResult,
                r#"
                insert into car (chassis, make, model, registration, plate, year, engine_displacement_litres, mileage_km, unladen_weight, laden_weight, seats)
                values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                returning id
                "#,
                car.chassis,
                car.make,
                car.model,
                car.registration,
                car.plate,
                car.year,
                car.engine_displacement_litres,
                car.mileage_km,
                car.unladen_weight,
                car.laden_weight,
                car.seats
            )
            .fetch_one(&mut **tx)
            .await?;
            Ok(result.id)
        }
    }
}
