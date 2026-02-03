use axum::Json;
use axum::extract::State;
use sqlx::PgPool;

use super::model::{Person, Sex};

pub async fn get_people(State(pool): State<PgPool>) -> Json<Vec<Person>> {
    let people = sqlx::query_as!(
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
        "#
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    Json(people)
}

