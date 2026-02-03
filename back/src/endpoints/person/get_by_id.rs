use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use sqlx::PgPool;

use super::model::{Person, Sex};

pub async fn get_person(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> Result<Json<Person>, StatusCode> {
    sqlx::query_as!(
        Person,
        r#"
        select
            id,
            first_name,
            last_name,
            sex as "sex: Sex",
            birth_date,
            tax_number,
            phone,
            phone2,
            email
        from person
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
