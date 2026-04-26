use std::collections::HashMap;

use jetdb::{PageReader, Value, read_catalog, read_table_def, read_table_rows};
use tokio_postgres::NoTls;

type IdMap = HashMap<i32, i32>;

fn text_val(val: &Value) -> String {
    match val {
        Value::Text(s) => s.trim().to_string(),
        _ => String::new(),
    }
}

fn text_or(val: &Value, default: &str) -> String {
    let s = text_val(val);
    if s.is_empty() { default.to_string() } else { s }
}

fn long_val(val: &Value) -> Option<i32> {
    match val {
        Value::Long(n) => Some(*n),
        _ => None,
    }
}

fn money_to_int(val: &Value) -> i32 {
    match val {
        Value::Money(s) => s.parse::<f64>().unwrap_or(0.0) as i32,
        Value::Double(f) => *f as i32,
        Value::Long(n) => *n,
        _ => 0,
    }
}

fn double_to_int(val: &Value) -> i32 {
    match val {
        Value::Double(f) => *f as i32,
        Value::Long(n) => *n,
        Value::Money(s) => s.parse::<f64>().unwrap_or(0.0) as i32,
        _ => 0,
    }
}

fn timestamp_to_date(val: &Value) -> Option<String> {
    match val {
        Value::Timestamp(ts) => {
            let adjusted = ts + 2.0 / 24.0;
            Some(jetdb::timestamp::format_timestamp(adjusted, "%Y-%m-%d"))
        }
        _ => None,
    }
}

fn escape(s: &str) -> String {
    s.replace('\'', "''")
}

fn qs(s: &str) -> String {
    format!("'{}'", escape(s))
}

fn qn(s: &str) -> String {
    if s.is_empty() {
        "NULL".to_string()
    } else {
        qs(s)
    }
}

fn date_sql(val: &Value) -> String {
    timestamp_to_date(val)
        .map(|d| format!("'{d}'::date"))
        .unwrap_or_else(|| "NULL".into())
}

fn date_sql_or(val: &Value, default: &str) -> String {
    timestamp_to_date(val)
        .map(|d| format!("'{d}'::date"))
        .unwrap_or_else(|| format!("'{default}'::date"))
}

fn map_sex(val: &Value) -> &str {
    match val {
        Value::Text(s) if s == "чол" => "m",
        Value::Text(s) if s == "жін" => "f",
        _ => "unknown",
    }
}

fn map_person_status(val: &Value) -> &str {
    match val {
        Value::Text(s) if s == "Активний" => "active",
        Value::Text(s) if s == "Неактивний" => "inactive",
        Value::Text(s) if s == "Архів" => "archived",
        _ => "active",
    }
}

fn map_policy_status(val: &Value) -> &str {
    match val {
        Value::Long(1) => "active",
        Value::Long(2) => "prolonged",
        Value::Long(3) => "rejected",
        Value::Long(4) => "stopped",
        Value::Long(5) => "postponed",
        Value::Long(6) => "cancelled",
        Value::Long(7) => "project",
        Value::Long(8) => "replaced",
        Value::Long(9) => "expired",
        _ => "expired",
    }
}

fn parse_period(s: &str) -> (i32, &'static str) {
    match s {
        "15" | "15 д" | "15 діб" | "15діб" | "15 дн" | "15дн" | "15 дней" | "15 днів" => {
            (15, "day")
        }
        "1 мес" | "1 мім" | "1 міс" | "1міс" => (1, "month"),
        "2 міс" | "2міс" => (2, "month"),
        "3" | "3 міс" | "3міс" => (3, "month"),
        "4 міс" => (4, "month"),
        "5 міс" => (5, "month"),
        "6 мес" | "6 міс" => (6, "month"),
        "7 міс" => (7, "month"),
        "8 міс" => (8, "month"),
        "9 міс" => (9, "month"),
        "10 міс" => (10, "month"),
        "11 міс" => (11, "month"),
        "12" | "1 рік" | "1 РІК" | "1рік" => (1, "year"),
        "1" => (1, "month"),
        _ => (0, "day"),
    }
}

fn map_osago_zone(val: &Value) -> &str {
    match val {
        Value::Byte(1) => "zone1",
        Value::Byte(2) => "zone2",
        Value::Byte(3) => "zone3",
        Value::Byte(4) => "zone4",
        Value::Byte(5) => "zone5",
        _ => "outside",
    }
}

fn clean_hyperlink(s: &str) -> String {
    s.split('#').next().unwrap_or("").to_string()
}

struct Table {
    columns: Vec<String>,
    rows: Vec<Vec<Value>>,
}

impl Table {
    fn open(reader: &mut PageReader, name: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let catalog = read_catalog(reader)?;
        let entry = catalog
            .iter()
            .find(|e| e.name == name)
            .ok_or_else(|| format!("table '{name}' not found"))?;
        let def = read_table_def(reader, name, entry.table_page)?;
        let result = read_table_rows(reader, &def)?;
        if result.skipped_rows > 0 {
            eprintln!(
                "  warning: {} rows skipped due to parse errors",
                result.skipped_rows
            );
        }
        let columns = def.columns.iter().map(|c| c.name.clone()).collect();
        Ok(Self {
            columns,
            rows: result.rows,
        })
    }

    fn idx(&self, name: &str) -> usize {
        self.columns
            .iter()
            .position(|c| c == name)
            .unwrap_or_else(|| panic!("column '{name}' not found in {:?}", self.columns))
    }
}

async fn query_returning_id(
    client: &tokio_postgres::Client,
    q: &str,
) -> Result<i32, tokio_postgres::Error> {
    let rows = client.query(q, &[]).await?;
    Ok(rows[0].get(0))
}

async fn exec(client: &tokio_postgres::Client, q: &str) -> bool {
    match client.execute(q, &[]).await {
        Ok(_) => true,
        Err(e) => {
            eprintln!("  SQL error: {e}");
            false
        }
    }
}

async fn link_agent(
    client: &tokio_postgres::Client,
    agent_ids: &IdMap,
    agent_old: Option<i32>,
    policy_id: i32,
) {
    let agent_new = agent_old
        .and_then(|id| agent_ids.get(&id))
        .or_else(|| agent_ids.get(&1))
        .copied();
    if let Some(aid) = agent_new {
        let _ = exec(
            client,
            &format!("INSERT INTO agent_policy (agent_id, policy_id) VALUES ({aid}, {policy_id})"),
        )
        .await;
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    let path = args.get(1).ok_or("usage: migration-tool <file.accdb> <pg_conn_string>")?;
    let pg_conn = args.get(2).ok_or("usage: migration-tool <file.accdb> <pg_conn_string>")?;

    let (client, connection) = tokio_postgres::connect(pg_conn, NoTls).await?;
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("pg connection error: {e}");
        }
    });

    println!("pruning existing data...");
    for table in [
        "agent_policy",
        "osago_policy",
        "medassistance_policy_member",
        "medassistance_policy",
        "green_card_policy",
        "policy",
        "car",
        "agent",
        "person",
    ] {
        client.execute(&format!("DELETE FROM {table}"), &[]).await?;
    }

    let mut reader = PageReader::open(path)?;

    let person_ids = migrate_people(&client, &mut reader).await?;
    let agent_ids = migrate_agents(&client, &mut reader).await?;
    let car_ids = migrate_cars(&client, &mut reader).await?;
    migrate_green_card(&client, &mut reader, &person_ids, &car_ids, &agent_ids).await?;
    let ma_policy_ids = migrate_medassistance(&client, &mut reader, &person_ids, &agent_ids).await?;
    migrate_medassistance_members(&client, &mut reader, &ma_policy_ids, &person_ids).await?;
    migrate_osago(&client, &mut reader, &person_ids, &car_ids, &agent_ids).await?;

    print_summary(&client).await?;
    Ok(())
}

async fn migrate_people(
    client: &tokio_postgres::Client,
    reader: &mut PageReader,
) -> Result<IdMap, Box<dyn std::error::Error>> {
    println!("migrating people...");
    let t = Table::open(reader, "Особисті данні")?;

    let (i_id, i_first, i_first_lat, i_last, i_last_lat) = (
        t.idx("ClientID"),
        t.idx("Ім'я"),
        t.idx("Ім'яLAT"),
        t.idx("Прізвище"),
        t.idx("ПризвLAT"),
    );
    let (i_patron, i_patron_lat, i_sex, i_birth, i_tax) = (
        t.idx("По батькові"),
        t.idx("По батькLAT"),
        t.idx("Стать"),
        t.idx("Дата народж"),
        t.idx("ІПН"),
    );
    let (i_phone, i_phone2, i_email, i_status) = (
        t.idx("телефон 1"),
        t.idx("телефон 2"),
        t.idx("email"),
        t.idx("ClientStatus"),
    );

    let mut ids = IdMap::new();
    let mut ok = 0u64;
    let mut fail = 0u64;

    for row in &t.rows {
        let old_id = match long_val(&row[i_id]) {
            Some(id) => id,
            None => {
                fail += 1;
                continue;
            }
        };

        let q = format!(
            "INSERT INTO person (first_name, first_name_lat, last_name, last_name_lat,
             patronymic_name, patronymic_name_lat, sex, birth_date, tax_number,
             phone, phone2, email, status) VALUES (
             {}, {}, {}, {}, {}, {}, {}::sex, {}, {}, {}, {}, {}, {}::person_status)
             RETURNING id",
            qs(&text_or(&row[i_first], "N/A")),
            qn(&text_val(&row[i_first_lat])),
            qs(&text_or(&row[i_last], "N/A")),
            qn(&text_val(&row[i_last_lat])),
            qn(&text_val(&row[i_patron])),
            qn(&text_val(&row[i_patron_lat])),
            qs(map_sex(&row[i_sex])),
            date_sql_or(&row[i_birth], "1900-01-01"),
            qs(&text_or(&row[i_tax], "N/A")),
            qs(&text_or(&row[i_phone], "N/A")),
            qn(&text_val(&row[i_phone2])),
            qs(&text_or(&row[i_email], "N/A")),
            qs(map_person_status(&row[i_status])),
        );

        match query_returning_id(client, &q).await {
            Ok(new_id) => {
                ids.insert(old_id, new_id);
                ok += 1;
            }
            Err(e) => {
                eprintln!("  person {old_id}: {e}");
                fail += 1;
            }
        }
    }
    println!("  people: {ok} inserted, {fail} failed");
    Ok(ids)
}

async fn migrate_agents(
    client: &tokio_postgres::Client,
    reader: &mut PageReader,
) -> Result<IdMap, Box<dyn std::error::Error>> {
    println!("migrating agents...");
    let t = Table::open(reader, "Агенти")?;
    let (i_id, i_name) = (t.idx("AgentID"), t.idx("ПІБ"));

    let mut ids = IdMap::new();
    let mut ok = 0u64;
    let mut fail = 0u64;

    for row in &t.rows {
        let old_id = match long_val(&row[i_id]) {
            Some(id) => id,
            None => {
                fail += 1;
                continue;
            }
        };
        let name = text_or(&row[i_name], "Невідомий агент");
        let q = format!(
            "INSERT INTO agent (full_name) VALUES ({}) RETURNING id",
            qs(&name)
        );
        match query_returning_id(client, &q).await {
            Ok(new_id) => {
                ids.insert(old_id, new_id);
                ok += 1;
            }
            Err(e) => {
                eprintln!("  agent {old_id}: {e}");
                fail += 1;
            }
        }
    }
    println!("  agents: {ok} inserted, {fail} failed");
    Ok(ids)
}

async fn migrate_cars(
    client: &tokio_postgres::Client,
    reader: &mut PageReader,
) -> Result<IdMap, Box<dyn std::error::Error>> {
    println!("migrating cars...");
    let t = Table::open(reader, "Автотранспортний засіб")?;

    let i_id = t.idx("Код");
    let i_chassis = t.idx("Номер кузова");
    let i_make_model = t.idx("Марка та модель");
    let i_reg = t.idx("Пункт регістрації");
    let i_plate = t.idx("Реєстраційний №");
    let i_year = t.idx("Рік випуску");
    let i_engine = t.idx("Об'єм двигуна");
    let i_mileage = t.idx("Пробіг");
    let i_unladen = t.idx("Маса без навантаження");
    let i_laden = t.idx("Повна маса");
    let i_seats = t.idx("Кількість місць");

    let mut ids = IdMap::new();
    let mut ok = 0u64;
    let mut fail = 0u64;

    for row in &t.rows {
        let old_id = match long_val(&row[i_id]) {
            Some(id) => id,
            None => {
                fail += 1;
                continue;
            }
        };

        let chassis = clean_hyperlink(&text_val(&row[i_chassis]));
        let make_model = text_or(&row[i_make_model], "N/A");
        let (make, model) = make_model.split_once(' ').unwrap_or((&make_model, ""));
        let registration = text_or(&row[i_reg], "N/A");
        let plate = clean_hyperlink(&text_val(&row[i_plate]));
        let year = long_val(&row[i_year]).unwrap_or(2000);
        let engine: i32 = text_val(&row[i_engine]).parse().unwrap_or(0);
        let mileage: i32 = text_val(&row[i_mileage]).parse().unwrap_or(0);
        let unladen = long_val(&row[i_unladen]).unwrap_or(0);
        let laden = long_val(&row[i_laden]).unwrap_or(0);
        let seats = long_val(&row[i_seats]).unwrap_or(5);

        let q = format!(
            "INSERT INTO car (chassis, make, model, registration, plate, year,
             engine_displacement_litres, mileage_km, unladen_weight, laden_weight, seats)
             VALUES ({}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}) RETURNING id",
            qs(if chassis.is_empty() {
                "UNKNOWN"
            } else {
                &chassis
            }),
            qs(if make.is_empty() { "Unknown" } else { make }),
            qs(model),
            qs(&registration),
            qs(if plate.is_empty() { "UNKNOWN" } else { &plate }),
            year,
            engine,
            mileage,
            unladen,
            laden,
            seats,
        );

        match query_returning_id(client, &q).await {
            Ok(new_id) => {
                ids.insert(old_id, new_id);
                ok += 1;
            }
            Err(e) => {
                eprintln!("  car {old_id}: {e}");
                fail += 1;
            }
        }
    }
    println!("  cars: {ok} inserted, {fail} failed");
    Ok(ids)
}

async fn migrate_green_card(
    client: &tokio_postgres::Client,
    reader: &mut PageReader,
    person_ids: &IdMap,
    car_ids: &IdMap,
    agent_ids: &IdMap,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("migrating green card policies...");
    let t = Table::open(reader, "Зеленая карта")?;

    let i_id = t.idx("Код");
    let i_series = t.idx("СеріяПолісу");
    let i_number = t.idx("НомерПолісу");
    let i_territory = t.idx("Терріторія дії");
    let i_start = t.idx("Початок");
    let i_end = t.idx("Припинення");
    let i_period = t.idx("Срок");
    let i_holder = t.idx("Страхувальник");
    let i_car = t.idx("Машина");
    let i_premium = t.idx("Страхова премія");
    let i_agent = t.idx("Агент");
    let i_status = t.idx("Статус дії");

    let mut ok = 0u64;
    let mut skip = 0u64;

    for row in &t.rows {
        let old_id = match long_val(&row[i_id]) {
            Some(id) => id,
            None => {
                skip += 1;
                continue;
            }
        };

        let holder_new = long_val(&row[i_holder])
            .and_then(|id| person_ids.get(&id))
            .copied();
        let car_new = long_val(&row[i_car])
            .and_then(|id| car_ids.get(&id))
            .copied();

        let (holder_new, car_new) = match (holder_new, car_new) {
            (Some(h), Some(c)) => (h, c),
            _ => {
                skip += 1;
                continue;
            }
        };

        let series = text_or(&row[i_series], "N/A");
        let number = match &row[i_number] {
            Value::Long(n) => n.to_string(),
            Value::Text(s) => s.clone(),
            _ => "N/A".to_string(),
        };
        let territory = text_or(&row[i_territory], "N/A");
        let period_str = text_val(&row[i_period]);
        let (period_units, period_unit) = parse_period(&period_str);
        let premium = money_to_int(&row[i_premium]);
        let status = map_policy_status(&row[i_status]);

        let q = format!(
            "WITH ins AS (
                INSERT INTO policy (type, holder_id, series, number, start_date, end_date, status)
                VALUES ('green_card'::policy_type, {holder_new}, {}, {}, {}, {}, '{status}'::policy_status)
                RETURNING id
            )
            INSERT INTO green_card_policy (id, territory, period_in_units, period_unit, premium, car_id)
            SELECT id, {}, {period_units}, '{period_unit}'::car_insurance_period_unit, {premium}, {car_new}
            FROM ins RETURNING id",
            qs(&series), qs(&number),
            date_sql_or(&row[i_start], "2000-01-01"), date_sql(&row[i_end]),
            qs(&territory),
        );

        match query_returning_id(client, &q).await {
            Ok(policy_id) => {
                ok += 1;
                link_agent(client, agent_ids, long_val(&row[i_agent]), policy_id).await;
            }
            Err(e) => {
                eprintln!("  green_card {old_id}: {e}");
                skip += 1;
            }
        }
    }
    println!("  green_card: {ok} inserted, {skip} skipped");
    Ok(())
}

async fn migrate_medassistance(
    client: &tokio_postgres::Client,
    reader: &mut PageReader,
    person_ids: &IdMap,
    agent_ids: &IdMap,
) -> Result<IdMap, Box<dyn std::error::Error>> {
    println!("migrating medassistance policies...");
    let members = Table::open(reader, "Многие МА")?;
    let t = Table::open(reader, "Медассистанс")?;

    let i_id = t.idx("Код");
    let i_series = t.idx("СеріяПолісу");
    let i_number = t.idx("НомерПолісу");
    let i_territory = t.idx("Місце дії");
    let i_start = t.idx("Початок");
    let i_end = t.idx("Припинення");
    let i_period = t.idx("Срок");
    let i_payout = t.idx("Страхова сума");
    let i_program = t.idx("Програма");
    let i_premium = t.idx("Страхова премія");
    let i_status = t.idx("Статус");
    let i_agent = t.idx("Агент");

    let mi_policy = members.idx("Код полиса");
    let mi_person = members.idx("КодОС");

    let mut first_person: HashMap<i32, i32> = HashMap::new();
    for mrow in &members.rows {
        if let (Some(pid), Some(mid)) = (long_val(&mrow[mi_policy]), long_val(&mrow[mi_person])) {
            first_person.entry(pid).or_insert(mid);
        }
    }

    let mut policy_ids = IdMap::new();
    let mut ok = 0u64;
    let mut skip = 0u64;

    for row in &t.rows {
        let old_id = match long_val(&row[i_id]) {
            Some(id) => id,
            None => {
                skip += 1;
                continue;
            }
        };

        let holder_new = first_person
            .get(&old_id)
            .and_then(|old| person_ids.get(old))
            .copied();

        let holder_new = match holder_new {
            Some(h) => h,
            None => {
                skip += 1;
                continue;
            }
        };

        let series = text_or(&row[i_series], "N/A");
        let number = text_or(&row[i_number], "N/A");
        let territory = match &row[i_territory] {
            Value::Text(s) => s.clone(),
            Value::Long(n) => n.to_string(),
            Value::Int(n) => n.to_string(),
            _ => "N/A".to_string(),
        };
        let period_days = double_to_int(&row[i_period]).max(1);
        let payout = money_to_int(&row[i_payout]);
        let program = text_or(&row[i_program], "STANDART");
        let premium = money_to_int(&row[i_premium]);
        let status = map_policy_status(&row[i_status]);

        let q = format!(
            "WITH ins AS (
                INSERT INTO policy (type, holder_id, series, number, start_date, end_date, status)
                VALUES ('medassistance'::policy_type, {holder_new}, {}, {}, {}, {}, '{status}'::policy_status)
                RETURNING id
            )
            INSERT INTO medassistance_policy (id, territory, period_days, premium, payout, program)
            SELECT id, {}, {period_days}, {premium}, {payout}, {}
            FROM ins RETURNING id",
            qs(&series), qs(&number),
            date_sql_or(&row[i_start], "2000-01-01"), date_sql(&row[i_end]),
            qs(&territory), qs(&program),
        );

        match query_returning_id(client, &q).await {
            Ok(new_id) => {
                ok += 1;
                policy_ids.insert(old_id, new_id);
                link_agent(client, agent_ids, long_val(&row[i_agent]), new_id).await;
            }
            Err(e) => {
                eprintln!("  medassistance {old_id}: {e}");
                skip += 1;
            }
        }
    }
    println!("  medassistance: {ok} inserted, {skip} skipped");
    Ok(policy_ids)
}

async fn migrate_medassistance_members(
    client: &tokio_postgres::Client,
    reader: &mut PageReader,
    policy_ids: &IdMap,
    person_ids: &IdMap,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("migrating medassistance members...");
    let t = Table::open(reader, "Многие МА")?;

    let i_policy = t.idx("Код полиса");
    let i_person = t.idx("КодОС");

    let mut ok = 0u64;
    let mut skip = 0u64;

    for row in &t.rows {
        let policy_new = long_val(&row[i_policy])
            .and_then(|id| policy_ids.get(&id))
            .copied();
        let person_new = long_val(&row[i_person])
            .and_then(|id| person_ids.get(&id))
            .copied();

        match (policy_new, person_new) {
            (Some(pid), Some(mid)) => {
                let q = format!(
                    "INSERT INTO medassistance_policy_member (medassistance_policy_id, member_id) VALUES ({pid}, {mid})"
                );
                if exec(client, &q).await {
                    ok += 1;
                } else {
                    skip += 1;
                }
            }
            _ => skip += 1,
        }
    }
    println!("  medassistance_members: {ok} inserted, {skip} skipped");
    Ok(())
}

async fn migrate_osago(
    client: &tokio_postgres::Client,
    reader: &mut PageReader,
    person_ids: &IdMap,
    car_ids: &IdMap,
    agent_ids: &IdMap,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("migrating osago policies...");
    let t = Table::open(reader, "ОСАГО")?;

    let i_id = t.idx("Код");
    let i_series = t.idx("СеріяПолісу");
    let i_number = t.idx("НомерПолісу");
    let i_start = t.idx("Початок");
    let i_end = t.idx("Закінчення");
    let i_period = t.idx("Срок");
    let i_zone = t.idx("Зона");
    let i_holder = t.idx("ClientID_FK");
    let i_car = t.idx("Машина");
    let i_premium = t.idx("Стоимость");
    let i_status = t.idx("СтатусПолісу");
    let i_agent = t.idx("Агент");

    let mut ok = 0u64;
    let mut skip = 0u64;

    for row in &t.rows {
        let old_id = match long_val(&row[i_id]) {
            Some(id) => id,
            None => {
                skip += 1;
                continue;
            }
        };

        let holder_new = long_val(&row[i_holder])
            .and_then(|id| person_ids.get(&id))
            .copied();
        let car_new = long_val(&row[i_car])
            .and_then(|id| car_ids.get(&id))
            .copied();

        let (holder_new, car_new) = match (holder_new, car_new) {
            (Some(h), Some(c)) => (h, c),
            _ => {
                skip += 1;
                continue;
            }
        };

        let series = text_or(&row[i_series], "N/A");
        let number = text_or(&row[i_number], "N/A");
        let period_str = text_val(&row[i_period]);
        let (period_units, period_unit) = parse_period(&period_str);
        let zone = map_osago_zone(&row[i_zone]);
        let premium = money_to_int(&row[i_premium]);
        let status = map_policy_status(&row[i_status]);

        let q = format!(
            "WITH ins AS (
                INSERT INTO policy (type, holder_id, series, number, start_date, end_date, status)
                VALUES ('osago'::policy_type, {holder_new}, {}, {}, {}, {}, '{status}'::policy_status)
                RETURNING id
            )
            INSERT INTO osago_policy (id, period_in_units, period_unit, car_id, zone, exempt, premium)
            SELECT id, {period_units}, '{period_unit}'::car_insurance_period_unit, {car_new}, '{zone}'::osago_zone, 'Нет', {premium}
            FROM ins RETURNING id",
            qs(&series), qs(&number),
            date_sql_or(&row[i_start], "2000-01-01"), date_sql(&row[i_end]),
        );

        match query_returning_id(client, &q).await {
            Ok(policy_id) => {
                ok += 1;
                link_agent(client, agent_ids, long_val(&row[i_agent]), policy_id).await;
            }
            Err(e) => {
                eprintln!("  osago {old_id}: {e}");
                skip += 1;
            }
        }
    }
    println!("  osago: {ok} inserted, {skip} skipped");
    Ok(())
}

async fn print_summary(client: &tokio_postgres::Client) -> Result<(), Box<dyn std::error::Error>> {
    println!("\n=== FINAL TABLE COUNTS ===");
    for table in [
        "person",
        "agent",
        "car",
        "policy",
        "green_card_policy",
        "medassistance_policy",
        "medassistance_policy_member",
        "osago_policy",
        "agent_policy",
    ] {
        let rows = client
            .query(&format!("SELECT count(*) FROM {table}"), &[])
            .await?;
        let count: i64 = rows[0].get(0);
        println!("  {table}: {count}");
    }
    Ok(())
}
