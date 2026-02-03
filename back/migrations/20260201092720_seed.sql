-- =========================================================
-- FAKE SEED DATA (Ukrainian Cyrillic names)
-- =========================================================

-- -----------------------------
-- PERSONS (15 people)
-- -----------------------------
INSERT INTO person (first_name, last_name, sex, birth_date, tax_number, phone, phone2, email) VALUES
-- id = 1
('Олександр', 'Петренко', 'M', '1990-03-15', '7701234567890', '+380 (50) 123-45-67', NULL, 'oleksandr.petrenko@gmail.com'),
-- id = 2
('Марина', 'Іванова', 'F', '1985-07-22', '7712345678901', '+380 (67) 234-56-78', '+380 (50) 876-54-32', 'marina.ivanova@ukr.net'),
-- id = 3
('Дмитро', 'Сидоренко', 'M', '1992-11-08', '7723456789012', '+380 (63) 345-67-89', NULL, 'dmytro.sydorenko@gmail.com'),
-- id = 4
('Ольга', 'Кузнецова', 'F', '1988-01-30', '7734567890123', '+380 (50) 456-78-90', '+380 (67) 112-23-34', 'olha.kuznetsova@ukr.net'),
-- id = 5
('Віктор', 'Новіков', 'M', '1978-05-12', '7745678901234', '+380 (63) 567-89-01', NULL, 'viktor.novikov@gmail.com'),
-- id = 6
('Єлена', 'Соколова', 'F', '1995-09-04', '7756789012345', '+380 (50) 678-90-12', '+380 (67) 445-56-67', 'yelena.sokolova@ukr.net'),
-- id = 7
('Іван', 'Лебеденко', 'M', '1982-12-19', '7767890123456', '+380 (63) 789-01-23', NULL, 'ivan.lebedenko@gmail.com'),
-- id = 8
('Наталя', 'Мельниченко', 'F', '1991-06-27', '7778901234567', '+380 (50) 890-12-34', '+380 (67) 667-78-89', 'natalya.melnychenko@ukr.net'),
-- id = 9
('Сергій', 'Козленко', 'M', '1986-02-14', '7789012345678', '+380 (63) 901-23-45', NULL, 'serhiy.kozlenko@gmail.com'),
-- id = 10
('Анна', 'Попова', 'F', '1993-08-10', '7790123456789', '+380 (50) 012-34-56', '+380 (67) 778-89-90', 'anna.popova@ukr.net'),
-- id = 11
('Михайло', 'Соловйов', 'M', '1980-04-03', '7701122334455', '+380 (63) 111-22-33', NULL, 'myhallo.soloviov@gmail.com'),
-- id = 12
('Юлія', 'Бергман', 'F', '1997-10-25', '7702233445566', '+380 (50) 222-33-44', '+380 (67) 554-43-21', 'yuliia.berhman@ukr.net'),
-- id = 13
('Павло', 'Степаненко', 'M', '1989-01-17', '7703344556677', '+380 (63) 333-44-55', NULL, 'pavlo.stepanenko@gmail.com'),
-- id = 14
('Світлана', 'Горбуненко', 'F', '1984-07-09', '7704455667788', '+380 (50) 444-55-66', '+380 (67) 998-87-76', 'svitlana.horbuнenko@ukr.net'),
-- id = 15
('Алексій', 'Орленко', 'M', '1976-03-28', '7705566778899', '+380 (63) 555-66-77', NULL, 'oleksiy.orlenko@gmail.com');


-- -----------------------------
-- CARS (8 cars)
-- -----------------------------
INSERT INTO car (chassis, make, model, registration, plate, year, engine_displacement_litres, mileage_km, unladen_weight, laden_weight, seats) VALUES
-- id = 1
('JT1BF1FK5A4123456', 'Toyota',      'Camry',    'AA 1234 AB', 'AA 1234 AB', 2018, 2, 87000,  1460, 1910, 5),
-- id = 2
('1HGBH41JXMN654321', 'Honda',       'Civic',    'BB 5678 CD', 'BB 5678 CD', 2020, 1, 42000,  1230, 1680, 5),
-- id = 3
('WVWZZZ3CZWE987654', 'Volkswagen',  'Golf',     'CC 9012 EF', 'CC 9012 EF', 2019, 1, 61000,  1280, 1750, 5),
-- id = 4
('XTA220740Y2111222', 'Lada',        'Vesta',    'DD 3456 GH', 'DD 3456 GH', 2021, 1, 25000,  1180, 1580, 5),
-- id = 5
('KL1234567890AB1234', 'Kia',        'Sportage', 'EE 7890 IJ', 'EE 7890 IJ', 2017, 2, 105000, 1590, 2100, 5),
-- id = 6
('2T1BURHE0JC333444', 'Toyota',      'Corolla',  'FF 1111 KL', 'FF 1111 KL', 2019, 1, 74000,  1320, 1780, 5),
-- id = 7
('5YJ3E1EA6JF555666', 'Tesla',       'Model 3',  'GG 2222 MN', 'GG 2222 MN', 2022, 0, 18000,  1850, 2300, 5),
-- id = 8
('LUSVVV777Y2777888', 'Skoda',       'Octavia',  'HH 3333 OP', 'HH 3333 OP', 2016, 2, 132000, 1380, 1830, 5);


-- -----------------------------
-- POLICIES
--   green_card    -> policy ids 1, 2, 3
--   medassistance -> policy ids 4, 5, 6
--   osago         -> policy ids 7, 8
-- -----------------------------
INSERT INTO policy (type, holder_id, series, number, start_date, end_date, status) VALUES
-- id = 1  green_card      (holder: Олександр Петренко)
('green_card',    1, 'GC', '100001', '2024-01-10', '2025-01-10', 'expired'),
-- id = 2  green_card      (holder: Дмитро Сидоренко)
('green_card',    3, 'GC', '100002', '2025-03-01', '2026-03-01', 'active'),
-- id = 3  green_card      (holder: Віктор Новіков)
('green_card',    5, 'GC', '100003', '2023-06-15', '2024-06-15', 'terminated'),
-- id = 4  medassistance   (holder: Марина Іванова)
('medassistance', 2, 'MA', '200001', '2024-09-01', '2025-09-01', 'active'),
-- id = 5  medassistance   (holder: Єлена Соколова)
('medassistance', 6, 'MA', '200002', '2023-11-20', '2024-11-20', 'expired'),
-- id = 6  medassistance   (holder: Наталя Мельниченко)
('medassistance', 8, 'MA', '200003', '2025-01-05', '2026-01-05', 'active'),
-- id = 7  osago           (holder: Сергій Козленко)
('osago',         9, 'OS', '300001', '2024-07-01', '2025-07-01', 'active'),
-- id = 8  osago           (holder: Анна Попова)
('osago',        10, 'OS', '300002', '2023-12-01', '2024-12-01', 'expired');


-- -----------------------------
-- GREEN CARD POLICIES (detail rows for policy ids 1, 2, 3)
-- -----------------------------
INSERT INTO green_card_policy (id, territory, period_months, premium, car_id) VALUES
(1, 'Європа',     12, 15000, 1),   -- Олександр  -> Toyota Camry
(2, 'Євроазія',   12, 18000, 3),   -- Дмитро      -> VW Golf
(3, 'Євроазія',    6,  9500, 5);   -- Віктор      -> Kia Sportage


-- -----------------------------
-- MEDASSISTANCE POLICIES (detail rows for policy ids 4, 5, 6)
-- -----------------------------
INSERT INTO medassistance_policy (id, territory, period_months, premium, payout, program) VALUES
(4, 'Кавказ',              12, 12000, 500000, 'Стандарт'),
(5, 'Європейський Союз',   6, 22000, 800000, 'Преміум'),
(6, 'Південна Азія',       12, 16000, 600000, 'Стандарт');


-- -----------------------------
-- MEDASSISTANCE POLICY MEMBERS
--   Policy 4 (holder Марина)  — members: Марина, Анна
--   Policy 5 (holder Єлена)   — members: Єлена
--   Policy 6 (holder Наталя)  — members: Наталя, Юлія, Світлана
-- -----------------------------
INSERT INTO medassistance_policy_member (medassistance_policy_id, member_id) VALUES
(4,  2),   -- Марина Іванова
(4, 10),   -- Анна Попова
(5,  6),   -- Єлена Соколова
(6,  8),   -- Наталя Мельниченко
(6, 12),   -- Юлія Бергман
(6, 14);   -- Світлана Горбуненко
