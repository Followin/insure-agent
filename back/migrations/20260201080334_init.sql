create type sex as enum ('M', 'F');

create table person (
    id serial primary key,
    first_name varchar(255) not null,
    last_name varchar(255) not null,
    sex sex not null,
    birth_date date not null,
    tax_number varchar(20) not null,
    phone varchar(20) not null,
    phone2 varchar(20) null,
    email varchar(255) not null
);

create type policy_type as enum ('green_card', 'medassistance', 'osago');

create type policy_status as enum ('active', 'expired', 'terminated');

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
    period_months int not null,
    premium int not null,
    car_id int references car(id) not null
);

create table medassistance_policy(
    id serial references policy(id) primary key,
    territory varchar(255) not null,
    period_months int not null,
    premium int not null,
    payout int not null,
    program varchar(255) not null
);

create table medassistance_policy_member(
    medassistance_policy_id int references medassistance_policy(id) not null,
    member_id int references person(id) not null
)
