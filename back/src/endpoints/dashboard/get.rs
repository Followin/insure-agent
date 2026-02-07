use axum::Json;
use axum::extract::State;
use sqlx::PgPool;

use super::model::{BirthdayPerson, DashboardStats, ExpiringPolicy};

pub async fn get_dashboard(State(pool): State<PgPool>) -> Json<DashboardStats> {
    let people_count = sqlx::query_scalar!("select count(*) from person")
        .fetch_one(&pool)
        .await
        .unwrap()
        .unwrap_or(0);

    let policy_count = sqlx::query_scalar!("select count(*) from policy")
        .fetch_one(&pool)
        .await
        .unwrap()
        .unwrap_or(0);

    let car_count = sqlx::query_scalar!("select count(*) from car")
        .fetch_one(&pool)
        .await
        .unwrap()
        .unwrap_or(0);

    // Find people with birthdays in the next 7 days
    // The query handles year wraparound (e.g., Dec 30 -> Jan 5)
    // - Convert birth_date and current_date to 'MMDD' format for comparison
    // - days_until: Calculate days until birthday this year, or next year if already passed
    // - age: Calculate the age they will turn on their upcoming birthday
    // - Two WHERE conditions handle:
    //   1. Normal case: birthday MMDD is within 7 days in same year
    //   2. Year wraparound: when current_date + 7 days crosses into next year
    let upcoming_birthdays = sqlx::query_as!(
        BirthdayPerson,
        r#"
        select
            id,
            first_name,
            last_name,
            phone,
            birth_date,
            extract(year from age(
                case
                    when to_char(birth_date, 'MMDD') >= to_char(current_date, 'MMDD')
                    then to_date(to_char(current_date, 'YYYY') || to_char(birth_date, 'MMDD'), 'YYYYMMDD')
                    else to_date(to_char(current_date::date + interval '1 year', 'YYYY') || to_char(birth_date, 'MMDD'), 'YYYYMMDD')
                end,
                birth_date
            ))::int as "age!: i32",
            case
                when to_char(birth_date, 'MMDD') >= to_char(current_date, 'MMDD')
                then to_date(to_char(current_date, 'YYYY') || to_char(birth_date, 'MMDD'), 'YYYYMMDD') - current_date
                else to_date(to_char(current_date::date + interval '1 year', 'YYYY') || to_char(birth_date, 'MMDD'), 'YYYYMMDD') - current_date
            end as "days_until!: i32"
        from person
        where
            (to_char(birth_date, 'MMDD') >= to_char(current_date, 'MMDD')
             and to_char(birth_date, 'MMDD') <= to_char(current_date + interval '7 days', 'MMDD'))
            or
            (to_char(current_date + interval '7 days', 'MMDD') < to_char(current_date, 'MMDD')
             and (to_char(birth_date, 'MMDD') >= to_char(current_date, 'MMDD')
                  or to_char(birth_date, 'MMDD') <= to_char(current_date + interval '7 days', 'MMDD')))
        order by "days_until!: i32" asc
        "#
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    // Policies expiring in the next 7 days
    let expiring_policies = sqlx::query_as!(
        ExpiringPolicy,
        r#"
        select
            p.id,
            p.series,
            p.number,
            p.type as "policy_type: _",
            p.end_date as "end_date!: chrono::NaiveDate",
            pe.first_name as holder_first_name,
            pe.last_name as holder_last_name,
            (p.end_date - current_date)::int as "days_until!: i32"
        from policy p
        join person pe on p.holder_id = pe.id
        where
            p.end_date >= current_date
            and p.end_date <= current_date + interval '7 days'
            and p.status = 'active'
        order by p.end_date asc
        "#
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    Json(DashboardStats {
        people_count,
        policy_count,
        car_count,
        upcoming_birthdays,
        expiring_policies,
    })
}
