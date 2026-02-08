-- =====================================================
-- Migration Script: backup → insure database
-- =====================================================
-- This script migrates data from the backup database to the insure database
-- Run with: docker exec insure-postgres-1 psql -U postgres -d insure -f /path/to/migrate_backup_to_insure.sql
--
-- Prerequisites:
--   - dblink extension must be enabled (CREATE EXTENSION IF NOT EXISTS dblink)
--   - Both databases must exist in the same PostgreSQL instance
--
-- Field Mappings:
--   backup.people → insure.person
--   backup.cars → insure.car
--   backup.green_card → insure.policy + insure.green_card_policy
--   backup.medassistance → insure.policy + insure.medassistance_policy
--   backup.medassistance_person → insure.medassistance_policy_member
--   backup.osago → insure.policy + insure.osago_policy
-- =====================================================

-- Enable dblink extension
CREATE EXTENSION IF NOT EXISTS dblink;

-- =====================================================
-- SETUP: Create staging tables
-- =====================================================

DROP TABLE IF EXISTS staging_osago CASCADE;
DROP TABLE IF EXISTS staging_medassistance_person CASCADE;
DROP TABLE IF EXISTS staging_medassistance CASCADE;
DROP TABLE IF EXISTS staging_green_card CASCADE;
DROP TABLE IF EXISTS staging_cars CASCADE;
DROP TABLE IF EXISTS staging_people CASCADE;

CREATE TABLE staging_people (
    old_id INTEGER PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    sex sex,
    birth_date DATE,
    tax_number VARCHAR(255),
    phone VARCHAR(255),
    phone2 VARCHAR(255),
    email VARCHAR(255),
    new_id INTEGER
);

CREATE TABLE staging_cars (
    old_id INTEGER PRIMARY KEY,
    chassis VARCHAR(255),
    make VARCHAR(255),
    model VARCHAR(255),
    registration VARCHAR(255),
    plate VARCHAR(255),
    year INTEGER,
    engine_displacement_litres INTEGER,
    mileage_km INTEGER,
    unladen_weight INTEGER,
    laden_weight INTEGER,
    seats INTEGER,
    new_id INTEGER
);

CREATE TABLE staging_green_card (
    old_id INTEGER PRIMARY KEY,
    series VARCHAR(255),
    number VARCHAR(255),
    territory VARCHAR(255),
    start_date DATE,
    end_date DATE,
    period_in_units int,
    period_unit car_insurance_period_unit,
    holder_old_id INTEGER,
    car_old_id INTEGER,
    premium INTEGER,
    status policy_status,
    new_policy_id INTEGER
);

CREATE TABLE staging_medassistance (
    old_id INTEGER PRIMARY KEY,
    series VARCHAR(255),
    number VARCHAR(255),
    territory VARCHAR(255),
    start_date DATE,
    end_date DATE,
    period_days INTEGER,
    payout INTEGER,
    program VARCHAR(255),
    premium INTEGER,
    status policy_status,
    new_policy_id INTEGER
);

CREATE TABLE staging_medassistance_person (
    policy_old_id INTEGER,
    person_old_id INTEGER
);

CREATE TABLE staging_osago (
    old_id INTEGER PRIMARY KEY,
    series VARCHAR(255),
    number VARCHAR(255),
    start_date DATE,
    end_date DATE,
    period_in_units int,
    period_unit car_insurance_period_unit,
    zone VARCHAR(255),
    holder_old_id INTEGER,
    car_old_id INTEGER,
    exempt BOOLEAN,
    premium INTEGER,
    franchise INTEGER,
    status policy_status,
    new_policy_id INTEGER
);

-- =====================================================
-- 1. IMPORT PEOPLE DATA FROM BACKUP
-- =====================================================
-- Mapping:
--   ClientID → old_id (for tracking)
--   Ім'я → first_name
--   Прізвище → last_name
--   Стать → sex (чол/Чол/ч/M → 'M', жін/Жін/ж/F → 'F')
--   Дата народж → birth_date
--   ІПН → tax_number
--   телефон 1 → phone
--   телефон 2 → phone2
--   email → email

INSERT INTO staging_people (
    old_id,
    first_name,
    last_name,
    sex,
    birth_date,
    tax_number,
    phone,
    phone2,
    email
)
SELECT
    "ClientID",
    COALESCE(NULLIF(TRIM("first_name"), ''), 'N/A'),
    COALESCE(NULLIF(TRIM("last_name"), ''), 'N/A'),
    CASE
        WHEN "sex" in ('чол') then 'm'::sex
        WHEN "sex" in ('жін') then 'f'::sex
        ELSE 'unknown'::sex
    END,
    COALESCE("birth_date"::date, '1900-01-01'::date),
    COALESCE(NULLIF(TRIM("tax_number"), ''), 'N/A'),
    COALESCE(NULLIF(TRIM("phone"), ''), 'N/A'),
    NULLIF(TRIM("phone2"), ''),
    COALESCE(NULLIF(TRIM("email"), ''), 'N/A')
FROM dblink('dbname=backup',
    $q$SELECT
        "ClientID",
        "Ім'я" as first_name,
        "Прізвище" as last_name,
        "Стать" as sex,
        "Дата народж"::date as birth_date,
        "ІПН" as tax_number,
        "телефон 1" as phone,
        "телефон 2" as phone2,
        "email"
    FROM people
    WHERE "ClientID" IS NOT NULL$q$
) AS t(
    "ClientID" INTEGER,
    "first_name" VARCHAR,
    "last_name" VARCHAR,
    "sex" VARCHAR,
    "birth_date" DATE,
    "tax_number" VARCHAR,
    "phone" VARCHAR,
    "phone2" VARCHAR,
    "email" VARCHAR
);

-- =====================================================
-- 2. IMPORT CARS DATA FROM BACKUP
-- =====================================================
-- Mapping:
--   Код → old_id (for tracking)
--   Номер кузова → chassis (cleaned of #http://...# suffix)
--   Марка та модель → make
--   Пункт регістрації → registration
--   Реєстраційний № → plate (cleaned of #http://...# suffix)
--   Рік випуску → year
--   Об'єм двигуна → engine_displacement_litres
--   Пробіг → mileage_km
--   Маса без навантаження → unladen_weight
--   Повна маса → laden_weight
--   Кількість місць → seats

INSERT INTO staging_cars (
    old_id,
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
)
SELECT
    "Код",
    split_part(COALESCE("chassis", ''), '#', 1),
    split_part(COALESCE("make_model", 'N/A'), ' ', 1),
    substring("make_model" from position(' ' in "make_model") + 1),
    COALESCE("registration", 'N/A'),
    split_part(COALESCE("plate", ''), '#', 1),
    COALESCE("year", 2000),
    CASE WHEN "engine" ~ '^[0-9]+$' THEN "engine"::integer ELSE 0 END,
    CASE WHEN "mileage" ~ '^[0-9]+$' THEN "mileage"::integer ELSE 0 END,
    COALESCE("unladen", 0),
    COALESCE("laden", 0),
    COALESCE("seats", 5)
FROM dblink('dbname=backup',
    $q$SELECT
        "Код",
        "Номер кузова" as chassis,
        "Марка та модель" as make_model,
        "Пункт регістрації" as registration,
        "Реєстраційний №" as plate,
        "Рік випуску" as year,
        "Об'єм двигуна" as engine,
        "Пробіг" as mileage,
        "Маса без навантаження" as unladen,
        "Повна маса" as laden,
        "Кількість місць" as seats
    FROM cars
    WHERE "Код" IS NOT NULL$q$
) AS t(
    "Код" INTEGER,
    "chassis" TEXT,
    "make_model" VARCHAR,
    "registration" VARCHAR,
    "plate" TEXT,
    "year" INTEGER,
    "engine" VARCHAR,
    "mileage" VARCHAR,
    "unladen" INTEGER,
    "laden" INTEGER,
    "seats" INTEGER
);

-- =====================================================
-- 3. IMPORT GREEN CARD DATA FROM BACKUP
-- =====================================================
-- Mapping:
--   Код → old_id (for tracking)
--   СеріяПолісу → series
--   НомерПолісу → number
--   Терріторія дії → territory
--   Початок → start_date
--   Припинення → end_date
--   Срок → period_months (parsed from text: "15 дней"→1, "1 міс"→1, "1рік"→12, etc.)
--   Страхувальник → holder_old_id (FK to people.ClientID)
--   Машина → car_old_id (FK to cars.Код)
--   Страхова премія → premium
--   Статус дії → status (1→active, 9→expired, others→expired)

INSERT INTO staging_green_card (
    old_id,
    series,
    number,
    territory,
    start_date,
    end_date,
    period_in_units,
    period_unit,
    holder_old_id,
    car_old_id,
    premium,
    status
)
SELECT
    "Код",
    COALESCE("series", 'N/A'),
    COALESCE("number"::text, 'N/A'),
    COALESCE("territory", 'N/A'),
    COALESCE("start_date"::date, CURRENT_DATE),
    "end_date"::date,
    CASE
        WHEN "period" in ('15', '15 д', '15 діб', '15діб', '15 дн', '15дн', '15 дней', '15 днів') THEN 15
        WHEN "period" in ('1 мес', '1 мім', '1 міс', '1міс') THEN 1
        WHEN "period" in ('2 міс', '2міс') THEN 2
        WHEN "period" in ('3', '3 міс', '3 міс') THEN 3
        WHEN "period" in ('4 міс') THEN 4
        WHEN "period" in ('5 міс') THEN 5
        WHEN "period" in ('6 мес', '6 міс') THEN 6
        WHEN "period" in ('7 міс') THEN 7
        WHEN "period" in ('8 міс') THEN 8
        WHEN "period" in ('9 міс') THEN 9
        WHEN "period" in ('10 міс') THEN 10
        WHEN "period" in ('11 міс') THEN 11
        WHEN "period" in ('12', '1 рік', '1 РІК', '1рік') THEN 1
        ELSE 0
    END,
    CASE
        WHEN "period" in ('15', '15 д', '15 діб', '15діб', '15 дн', '15дн', '15 дней', '15 днів') THEN 'day'::car_insurance_period_unit
        WHEN "period" in ('1 мес', '1 мім', '1 міс', '1міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('2 міс', '2міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('3', '3 міс', '3 міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('4 міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('5 міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('6 мес', '6 міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('7 міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('8 міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('9 міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('10 міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('11 міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('12', '1 рік', '1 РІК', '1рік') THEN 'year'::car_insurance_period_unit
        ELSE 'day'::car_insurance_period_unit
    END,
    "holder",
    "car",
    COALESCE("premium"::integer, 0),
    CASE
        WHEN status = 1 THEN 'active'::policy_status
        WHEN status = 2 THEN 'prolonged'::policy_status
        WHEN status = 3 THEN 'rejected'::policy_status
        WHEN status = 4 THEN 'stopped'::policy_status
        WHEN status = 5 THEN 'postponed'::policy_status
        WHEN status = 6 THEN 'cancelled'::policy_status
        WHEN status = 7 THEN 'project'::policy_status
        WHEN status = 8 THEN 'replaced'::policy_status
        WHEN status = 9 THEN 'expired'::policy_status
        ELSE 'expired'::policy_status
    END
FROM dblink('dbname=backup',
    $q$SELECT
        "Код",
        "СеріяПолісу" as series,
        "НомерПолісу" as number,
        "Терріторія дії" as territory,
        "Початок" as start_date,
        "Припинення" as end_date,
        "Срок" as period,
        "Страхувальник" as holder,
        "Машина" as car,
        "Страхова премія" as premium,
        "Статус дії" as status
    FROM green_card
    WHERE "Код" IS NOT NULL$q$
) AS t(
    "Код" INTEGER,
    "series" VARCHAR,
    "number" INTEGER,
    "territory" VARCHAR,
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "period" VARCHAR,
    "holder" INTEGER,
    "car" INTEGER,
    "premium" DOUBLE PRECISION,
    "status" INTEGER
);

-- =====================================================
-- 4. IMPORT MEDASSISTANCE DATA FROM BACKUP
-- =====================================================
-- Mapping:
--   Код → old_id (for tracking)
--   СеріяПолісу → series
--   НомерПолісу → number
--   Місце дії → territory (area codes like "1;2;3")
--   Початок → start_date
--   Припинення → end_date
--   Срок → period_months
--   Страхова сума → payout
--   Програма → program (BUSINESS, STANDART, ELIT, etc.)
--   Страхова премія → premium
--   Статус → status (1→active, 9→expired)

INSERT INTO staging_medassistance (
    old_id,
    series,
    number,
    territory,
    start_date,
    end_date,
    period_days,
    payout,
    program,
    premium,
    status
)
SELECT
    "Код",
    COALESCE("series", 'N/A'),
    COALESCE("number", 'N/A'),
    COALESCE("territory", 'N/A'),
    COALESCE("start_date"::date, CURRENT_DATE),
    "end_date"::date,
    COALESCE("period"::integer, 1),
    COALESCE("payout"::integer, 0),
    COALESCE("program", 'STANDART'),
    COALESCE("premium"::integer, 0),
    CASE
        WHEN status = 1 THEN 'active'::policy_status
        WHEN status = 2 THEN 'prolonged'::policy_status
        WHEN status = 3 THEN 'rejected'::policy_status
        WHEN status = 4 THEN 'stopped'::policy_status
        WHEN status = 5 THEN 'postponed'::policy_status
        WHEN status = 6 THEN 'cancelled'::policy_status
        WHEN status = 7 THEN 'project'::policy_status
        WHEN status = 8 THEN 'replaced'::policy_status
        WHEN status = 9 THEN 'expired'::policy_status
        ELSE 'expired'::policy_status
    END
FROM dblink('dbname=backup',
    $q$SELECT
        "Код",
        "СеріяПолісу" as series,
        "НомерПолісу" as number,
        "Місце дії" as territory,
        "Початок" as start_date,
        "Припинення" as end_date,
        "Срок" as period,
        "Страхова сума" as payout,
        "Програма" as program,
        "Страхова премія" as premium,
        "Статус" as status
    FROM medassistance
    WHERE "Код" IS NOT NULL$q$
) AS t(
    "Код" INTEGER,
    "series" VARCHAR,
    "number" VARCHAR,
    "territory" TEXT,
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "period" DOUBLE PRECISION,
    "payout" DOUBLE PRECISION,
    "program" VARCHAR,
    "premium" DOUBLE PRECISION,
    "status" INTEGER
);

-- =====================================================
-- 5. IMPORT MEDASSISTANCE_PERSON DATA FROM BACKUP
-- =====================================================
-- Mapping:
--   Код полиса → policy_old_id (FK to medassistance.Код)
--   КодОС → person_old_id (FK to people.ClientID)

INSERT INTO staging_medassistance_person (
    policy_old_id,
    person_old_id
)
SELECT
    "policy_id",
    "person_id"
FROM dblink('dbname=backup',
    $q$SELECT
        "Код полиса" as policy_id,
        "КодОС" as person_id
    FROM medassistance_person
    WHERE "Код полиса" IS NOT NULL AND "КодОС" IS NOT NULL$q$
) AS t(
    "policy_id" INTEGER,
    "person_id" INTEGER
);

-- =====================================================
-- 6. IMPORT OSAGO DATA FROM BACKUP
-- =====================================================
-- Mapping:
--   Код → old_id (for tracking)
--   СеріяПолісу → series
--   НомерПолісу → number
--   Початок → start_date
--   Закінчення → end_date
--   Срок → period_months (parsed from text)
--   Зона → zone
--   Машина → car_old_id (FK to cars.Код)
--   ClientID_FK → holder_old_id (FK to people.ClientID)
--   Льгота → exempt
--   Стоимость → premium
--   Франшиза → franchise
--   СтатусПолісу → status (1→active, 9→expired)

INSERT INTO staging_osago (
    old_id,
    series,
    number,
    start_date,
    end_date,
    period_in_units,
    period_unit,
    zone,
    holder_old_id,
    car_old_id,
    exempt,
    premium,
    franchise,
    status
)
SELECT
    "Код",
    COALESCE("series", 'N/A'),
    COALESCE("number", 'N/A'),
    COALESCE("start_date"::date, CURRENT_DATE),
    "end_date"::date,
    CASE
        WHEN "period" in ('15', '15 д', '15 діб', '15діб', '15 дн', '15дн', '15 дней', '15 днів') THEN 15
        WHEN "period" in ('1 мес', '1 мім', '1 міс', '1міс') THEN 1
        WHEN "period" in ('2 міс', '2міс') THEN 2
        WHEN "period" in ('3', '3 міс', '3 міс') THEN 3
        WHEN "period" in ('4 міс') THEN 4
        WHEN "period" in ('5 міс') THEN 5
        WHEN "period" in ('6 мес', '6 міс') THEN 6
        WHEN "period" in ('7 міс') THEN 7
        WHEN "period" in ('8 міс') THEN 8
        WHEN "period" in ('9 міс') THEN 9
        WHEN "period" in ('10 міс') THEN 10
        WHEN "period" in ('11 міс') THEN 11
        WHEN "period" in ('12', '1 рік', '1 РІК', '1рік') THEN 1
        ELSE 0
        END,
    CASE
        WHEN "period" in ('15', '15 д', '15 діб', '15діб', '15 дн', '15дн', '15 дней', '15 днів') THEN 'day'::car_insurance_period_unit
        WHEN "period" in ('1 мес', '1 мім', '1 міс', '1міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('2 міс', '2міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('3', '3 міс', '3 міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('4 міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('5 міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('6 мес', '6 міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('7 міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('8 міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('9 міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('10 міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('11 міс') THEN 'month'::car_insurance_period_unit
        WHEN "period" in ('12', '1 рік', '1 РІК', '1рік') THEN 'year'::car_insurance_period_unit
        ELSE 'day'::car_insurance_period_unit
        END,
    COALESCE("zone"::text, '1'),
    "holder",
    "car",
    COALESCE("exempt", false),
    COALESCE("premium"::integer, 0),
    COALESCE("franchise", 0),
    CASE
        WHEN status = 1 THEN 'active'::policy_status
        WHEN status = 2 THEN 'prolonged'::policy_status
        WHEN status = 3 THEN 'rejected'::policy_status
        WHEN status = 4 THEN 'stopped'::policy_status
        WHEN status = 5 THEN 'postponed'::policy_status
        WHEN status = 6 THEN 'cancelled'::policy_status
        WHEN status = 7 THEN 'project'::policy_status
        WHEN status = 8 THEN 'replaced'::policy_status
        WHEN status = 9 THEN 'expired'::policy_status
        ELSE 'expired'::policy_status
    END
FROM dblink('dbname=backup',
    $q$SELECT
        "Код",
        "СеріяПолісу" as series,
        "НомерПолісу" as number,
        "Початок" as start_date,
        "Закінчення" as end_date,
        "Срок" as period,
        "Зона" as zone,
        "ClientID_FK" as holder,
        "Машина" as car,
        "Льгота" as exempt,
        "Стоимость" as premium,
        "Франшиза" as franchise,
        "СтатусПолісу" as status
    FROM osago
    WHERE "Код" IS NOT NULL$q$
) AS t(
    "Код" INTEGER,
    "series" VARCHAR,
    "number" VARCHAR,
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "period" VARCHAR,
    "zone" SMALLINT,
    "holder" INTEGER,
    "car" INTEGER,
    "exempt" BOOLEAN,
    "premium" DOUBLE PRECISION,
    "franchise" INTEGER,
    "status" INTEGER
);

-- =====================================================
-- MIGRATION PHASE 1: Insert people into person table
-- =====================================================

DO $$
DECLARE
    r RECORD;
    v_new_person_id INTEGER;
BEGIN
    FOR r IN SELECT * FROM staging_people ORDER BY old_id LOOP
        INSERT INTO person (
            first_name,
            last_name,
            sex,
            birth_date,
            tax_number,
            phone,
            phone2,
            email
        )
        VALUES (
            r.first_name,
            r.last_name,
            r.sex,
            r.birth_date,
            r.tax_number,
            r.phone,
            r.phone2,
            r.email
        )
        RETURNING id INTO v_new_person_id;

        UPDATE staging_people SET new_id = v_new_person_id WHERE old_id = r.old_id;
    END LOOP;
END $$;

-- =====================================================
-- MIGRATION PHASE 2: Insert cars into car table
-- =====================================================

DO $$
DECLARE
    r RECORD;
    v_new_car_id INTEGER;
BEGIN
    FOR r IN SELECT * FROM staging_cars ORDER BY old_id LOOP
        INSERT INTO car (
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
        )
        VALUES (
            COALESCE(NULLIF(r.chassis, ''), 'UNKNOWN'),
            COALESCE(NULLIF(r.make, ''), 'Unknown'),
            COALESCE(r.model, ''),
            COALESCE(NULLIF(r.registration, ''), 'Unknown'),
            COALESCE(NULLIF(r.plate, ''), 'UNKNOWN'),
            COALESCE(r.year, 2000),
            COALESCE(r.engine_displacement_litres, 0),
            COALESCE(r.mileage_km, 0),
            COALESCE(r.unladen_weight, 0),
            COALESCE(r.laden_weight, 0),
            COALESCE(r.seats, 5)
        )
        RETURNING id INTO v_new_car_id;

        UPDATE staging_cars SET new_id = v_new_car_id WHERE old_id = r.old_id;
    END LOOP;
END $$;

-- =====================================================
-- MIGRATION PHASE 3: Insert green_card policies
-- =====================================================

DO $$
DECLARE
    r RECORD;
    v_holder_new_id INTEGER;
    v_car_new_id INTEGER;
    v_new_policy_id INTEGER;
    v_policy_status policy_status;
BEGIN
    FOR r IN SELECT * FROM staging_green_card ORDER BY old_id LOOP
        -- Get new holder ID from staging_people
        SELECT new_id INTO v_holder_new_id FROM staging_people WHERE old_id = r.holder_old_id;
        -- Get new car ID from staging_cars
        SELECT new_id INTO v_car_new_id FROM staging_cars WHERE old_id = r.car_old_id;

        IF v_holder_new_id IS NOT NULL AND v_car_new_id IS NOT NULL THEN
            -- Insert into policy table
            INSERT INTO policy (
                type,
                holder_id,
                series,
                number,
                start_date,
                end_date,
                status
            )
            VALUES (
                'green_card'::policy_type,
                v_holder_new_id,
                r.series,
                r.number,
                r.start_date,
                r.end_date,
                r.status
            )
            RETURNING id INTO v_new_policy_id;

            -- Insert into green_card_policy table
            INSERT INTO green_card_policy (
                id,
                territory,
                period_in_units,
                period_unit,
                premium,
                car_id
            )
            VALUES (
                v_new_policy_id,
                r.territory,
                r.period_in_units,
                r.period_unit,
                r.premium,
                v_car_new_id
            );

            UPDATE staging_green_card SET new_policy_id = v_new_policy_id WHERE old_id = r.old_id;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- MIGRATION PHASE 4: Insert medassistance policies
-- =====================================================

DO $$
DECLARE
    r RECORD;
    v_holder_new_id INTEGER;
    v_new_policy_id INTEGER;
    v_policy_status policy_status;
BEGIN
    FOR r IN SELECT * FROM staging_medassistance ORDER BY old_id LOOP
        -- Get holder from first person in medassistance_person
        SELECT sp.new_id INTO v_holder_new_id
        FROM staging_medassistance_person smp
        JOIN staging_people sp ON smp.person_old_id = sp.old_id
        WHERE smp.policy_old_id = r.old_id
        ORDER BY smp.person_old_id
        LIMIT 1;

        IF v_holder_new_id IS NOT NULL THEN
            -- Insert into policy table
            INSERT INTO policy (
                type,
                holder_id,
                series,
                number,
                start_date,
                end_date,
                status
            )
            VALUES (
                'medassistance'::policy_type,
                v_holder_new_id,
                r.series,
                r.number,
                r.start_date,
                r.end_date,
                r.status
            )
            RETURNING id INTO v_new_policy_id;

            -- Insert into medassistance_policy table
            INSERT INTO medassistance_policy (
                id,
                territory,
                period_days,
                premium,
                payout,
                program
            )
            VALUES (
                v_new_policy_id,
                r.territory,
                r.period_days,
                r.premium,
                r.payout,
                COALESCE(NULLIF(r.program, ''), 'STANDART')
            );

            UPDATE staging_medassistance SET new_policy_id = v_new_policy_id WHERE old_id = r.old_id;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- MIGRATION PHASE 5: Insert medassistance_policy_member
-- =====================================================

INSERT INTO medassistance_policy_member (
    medassistance_policy_id,
    member_id
)
SELECT DISTINCT
    sm.new_policy_id,
    sp.new_id
FROM staging_medassistance_person smp
JOIN staging_medassistance sm ON smp.policy_old_id = sm.old_id
JOIN staging_people sp ON smp.person_old_id = sp.old_id
WHERE sm.new_policy_id IS NOT NULL AND sp.new_id IS NOT NULL;

-- =====================================================
-- MIGRATION PHASE 6: Insert osago policies
-- =====================================================

DO $$
DECLARE
    r RECORD;
    v_holder_new_id INTEGER;
    v_car_new_id INTEGER;
    v_new_policy_id INTEGER;
    v_policy_status policy_status;
BEGIN
    FOR r IN SELECT * FROM staging_osago ORDER BY old_id LOOP
        -- Get new holder ID from staging_people
        SELECT new_id INTO v_holder_new_id FROM staging_people WHERE old_id = r.holder_old_id;
        -- Get new car ID from staging_cars
        SELECT new_id INTO v_car_new_id FROM staging_cars WHERE old_id = r.car_old_id;

        IF v_holder_new_id IS NOT NULL AND v_car_new_id IS NOT NULL THEN
            -- Insert into policy table
            INSERT INTO policy (
                type,
                holder_id,
                series,
                number,
                start_date,
                end_date,
                status
            )
            VALUES (
                'osago'::policy_type,
                v_holder_new_id,
                r.series,
                r.number,
                r.start_date,
                r.end_date,
                r.status
            )
            RETURNING id INTO v_new_policy_id;

            -- Insert into osago_policy table
            INSERT INTO osago_policy (
                id,
                period_in_units,
                period_unit,
                car_id,
                zone,
                exempt,
                premium,
                franchise
            )
            VALUES (
                v_new_policy_id,
                r.period_in_units,
                r.period_unit,
                v_car_new_id,
                r.zone,
                r.exempt,
                r.premium,
                r.franchise
            );

            UPDATE staging_osago SET new_policy_id = v_new_policy_id WHERE old_id = r.old_id;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- SUMMARY REPORT
-- =====================================================

SELECT '=== MIGRATION SUMMARY ===' as report;

SELECT 'People migrated' as entity, COUNT(*) as count
FROM staging_people WHERE new_id IS NOT NULL
UNION ALL
SELECT 'Cars migrated', COUNT(*)
FROM staging_cars WHERE new_id IS NOT NULL
UNION ALL
SELECT 'Green Card policies migrated', COUNT(*)
FROM staging_green_card WHERE new_policy_id IS NOT NULL
UNION ALL
SELECT 'Medassistance policies migrated', COUNT(*)
FROM staging_medassistance WHERE new_policy_id IS NOT NULL
UNION ALL
SELECT 'Medassistance members linked', COUNT(*)
FROM medassistance_policy_member
UNION ALL
SELECT 'OSAGO policies migrated', COUNT(*)
FROM staging_osago WHERE new_policy_id IS NOT NULL;

SELECT '=== FINAL TABLE COUNTS ===' as report;

SELECT 'person' as table_name, COUNT(*) as count
FROM person
UNION ALL
SELECT 'car', COUNT(*)
FROM car
UNION ALL
SELECT 'policy', COUNT(*)
FROM policy
UNION ALL
SELECT 'green_card_policy', COUNT(*)
FROM green_card_policy
UNION ALL
SELECT 'medassistance_policy', COUNT(*)
FROM medassistance_policy
UNION ALL
SELECT 'medassistance_policy_member', COUNT(*)
FROM medassistance_policy_member
UNION ALL
SELECT 'osago_policy', COUNT(*)
FROM osago_policy;

-- =====================================================
-- CLEANUP: Remove staging tables
-- =====================================================

DROP TABLE IF EXISTS staging_osago CASCADE;
DROP TABLE IF EXISTS staging_medassistance_person CASCADE;
DROP TABLE IF EXISTS staging_medassistance CASCADE;
DROP TABLE IF EXISTS staging_green_card CASCADE;
DROP TABLE IF EXISTS staging_cars CASCADE;
DROP TABLE IF EXISTS staging_people CASCADE;

SELECT '=== MIGRATION COMPLETE ===' as report;
