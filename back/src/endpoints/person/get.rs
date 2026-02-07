use axum::Json;
use axum::extract::{Query, State};
use serde::Deserialize;
use sqlx::PgPool;

use super::model::{Person, Sex};

#[derive(Deserialize)]
pub struct PersonQuery {
    pub search: Option<String>,
}

pub async fn get_people(
    State(pool): State<PgPool>,
    Query(query): Query<PersonQuery>,
) -> Json<Vec<Person>> {
    let search = query.search.unwrap_or_default().to_lowercase();
    let search_pattern = format!("%{}%", search);
    let phone_pattern = format!("%{}%", search.chars().filter(|c| c.is_ascii_digit()).collect::<String>());

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
        where
            lower(first_name || ' ' || last_name) like $1
            or lower(tax_number) like $1
            or regexp_replace(phone, '[^0-9]', '', 'g') like $2
            or lower(email) like $1
        limit 30
        "#,
        search_pattern,
        phone_pattern
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    Json(people)
}

