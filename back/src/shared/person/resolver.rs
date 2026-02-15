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
        PersonRef::ExistingWithUpdates { id, data } => {
            sqlx::query!(
                r#"
                update person set
                    first_name = $2,
                    first_name_lat = $3,
                    last_name = $4,
                    last_name_lat = $5,
                    patronymic_name = $6,
                    patronymic_name_lat = $7,
                    sex = $8,
                    birth_date = $9,
                    tax_number = $10,
                    phone = $11,
                    phone2 = $12,
                    email = $13,
                    status = $14
                where id = $1
                "#,
                id,
                data.first_name,
                data.first_name_lat,
                data.last_name,
                data.last_name_lat,
                data.patronymic_name,
                data.patronymic_name_lat,
                data.sex as Sex,
                data.birth_date,
                data.tax_number,
                data.phone,
                data.phone2,
                data.email,
                data.status as PersonStatus
            )
            .execute(&mut **tx)
            .await?;
            Ok(id)
        }
    }
}
