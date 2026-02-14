use super::model::{PersonRef, PersonStatus, Sex};
use crate::shared::IdResult;

pub async fn resolve_person(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    person_ref: PersonRef,
) -> Result<i32, sqlx::Error> {
    match person_ref {
        PersonRef::Existing { id } => Ok(id),
        PersonRef::New(person) => {
            let result = sqlx::query_as!(
                IdResult,
                r#"
                insert into person (first_name, first_name_lat, last_name, last_name_lat, patronymic_name, patronymic_name_lat, sex, birth_date, tax_number, phone, phone2, email, status)
                values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                returning id
                "#,
                person.first_name,
                person.first_name_lat,
                person.last_name,
                person.last_name_lat,
                person.patronymic_name,
                person.patronymic_name_lat,
                person.sex as Sex,
                person.birth_date,
                person.tax_number,
                person.phone,
                person.phone2,
                person.email,
                person.status as PersonStatus
            )
            .fetch_one(&mut **tx)
            .await?;
            Ok(result.id)
        }
    }
}
