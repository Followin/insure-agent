create table if not exists test (
    id serial primary key,
    name varchar(255) not null
);

insert into test (id, name) values (1, 'test');
