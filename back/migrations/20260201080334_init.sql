create type sex as enum ('m', 'f', 'unknown');

create type person_status as enum ('active', 'inactive', 'archived');

create type policy_type as enum ('green_card', 'medassistance', 'osago');

create type policy_status as enum ('active', 'prolonged', 'rejected', 'stopped', 'postponed', 'cancelled', 'project', 'replaced', 'expired');

create type car_insurance_period_unit as enum ('day', 'month', 'year');

create type osago_zone as enum ('zone1', 'zone2', 'zone3', 'zone4', 'zone5', 'outside');

create table person (
    id serial primary key,
    first_name varchar(255) not null,
    first_name_lat varchar(255) null,
    last_name varchar(255) not null,
    last_name_lat varchar(255) null,
    patronymic_name varchar(255) null,
    patronymic_name_lat varchar(255) null,
    sex sex not null,
    birth_date date not null,
    tax_number varchar(20) not null,
    phone varchar(20) not null,
    phone2 varchar(20) null,
    email varchar(255) not null,
    status person_status not null
);

create table policy (
    id serial primary key,
    type policy_type not null,
    holder_id int references person(id) not null,
    series varchar(255) not null,
    number varchar(255) not null,
    start_date date not null,
    end_date date null,
    status policy_status not null
);

create table car(
    id serial primary key,
    chassis varchar(255) not null,
    make varchar(255) not null,
    model varchar(255) not null,
    registration varchar(255) not null,
    plate varchar(255) not null,
    year int not null,
    engine_displacement_litres int not null,
    mileage_km int not null,
    unladen_weight int not null,
    laden_weight int not null,
    seats int not null
);

create table green_card_policy(
    id serial references policy(id) primary key,
    territory varchar(255) not null,
    period_in_units int not null,
    period_unit car_insurance_period_unit not null,
    premium int not null,
    car_id int references car(id) not null
);

create table medassistance_policy(
    id serial references policy(id) primary key,
    territory varchar(255) not null,
    period_days int not null,
    premium int not null,
    payout int not null,
    program varchar(255) not null
);

create table medassistance_policy_member(
    medassistance_policy_id int references medassistance_policy(id) not null,
    member_id int references person(id) not null
);

create table osago_policy(
    id serial references policy(id) primary key,
    period_in_units int not null,
    period_unit car_insurance_period_unit not null,
    car_id int references car(id) not null,
    zone osago_zone not null,
    exempt varchar(255) not null,
    premium int not null
);

create table agent (
    id serial primary key,
    full_name varchar(255) not null
);

create table agent_policy(
    agent_id int references agent(id) not null,
    policy_id int references policy(id) not null
);
