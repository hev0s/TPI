USE tpi26_nde_tpi;

INSERT INTO vehicule (brand, model, battery_capacity, weight, air_drag, base_consumption) VALUES

-- ==========================================
-- EUROPE
-- ==========================================

-- GROUPE RENAULT (RENAULT, DACIA, ALPINE)

('Renault', 'Zoe ZE40', 41.00, 1480, 0.33, 16.10),
('Renault', 'Zoe ZE50', 52.00, 1502, 0.33, 16.40),
('Renault', 'Twingo E-Tech', 21.30, 1112, 0.33, 16.00),
('Renault', 'Megane E-Tech EV40', 40.00, 1513, 0.29, 15.80),
('Renault', 'Megane E-Tech EV60', 60.00, 1636, 0.29, 16.10),
('Renault', 'Scenic E-Tech 60kWh', 60.00, 1730, 0.29, 16.30),
('Renault', 'Scenic E-Tech 87kWh', 87.00, 1842, 0.29, 16.80),
('Renault', '5 E-Tech 40kWh', 40.00, 1350, 0.29, 14.50),
('Renault', '5 E-Tech 52kWh', 52.00, 1449, 0.29, 14.90),
('Renault', 'Kangoo E-Tech', 45.00, 1608, 0.38, 18.50),
('Renault', 'Master E-Tech (87 kWh)', 87.00, 2500, 0.35, 21.00),
('Dacia', 'Spring (45)', 26.80, 970, 0.36, 13.90),
('Dacia', 'Spring (65)', 26.80, 975, 0.36, 14.50),
('Alpine', 'A290', 52.00, 1479, 0.32, 15.80),

-- GROUPE STELLANTIS (Peugeot, Citroën, Fiat, Opel, Jeep, DS)

('Peugeot', 'e-208', 50.00, 1455, 0.29, 15.50),
('Peugeot', 'e-208 (51 kWh)', 51.00, 1455, 0.29, 14.50),
('Peugeot', 'e-2008', 50.00, 1548, 0.32, 15.90),
('Peugeot', 'e-308', 51.00, 1680, 0.28, 15.10),
('Peugeot', 'e-3008 73kWh', 73.00, 2108, 0.28, 16.70),
('Peugeot', 'e-3008 98kWh', 98.00, 2174, 0.28, 17.00),
('Peugeot', 'e-Expert (75 kWh)', 75.00, 2088, 0.33, 26.10),
('Citroen', 'e-C4', 50.00, 1561, 0.29, 15.30),
('Citroen', 'e-C4 X', 50.00, 1584, 0.29, 15.00),
('Citroen', 'e-C3', 44.00, 1400, 0.32, 16.40),
('Citroen', 'e-Berlingo', 50.00, 1664, 0.38, 19.80),
('Fiat', '500e (24 kWh)', 23.80, 1255, 0.31, 13.00),
('Fiat', '500e (42 kWh)', 42.00, 1365, 0.31, 14.00),
('Fiat', '600e', 50.80, 1520, 0.30, 15.10),
('Fiat', 'E-Ulysse', 75.00, 2269, 0.33, 27.20),
('Opel', 'Corsa-e', 50.00, 1455, 0.29, 15.60),
('Opel', 'Mokka-e', 50.00, 1523, 0.32, 15.80),
('Opel', 'Astra Electric', 51.00, 1679, 0.28, 14.80),
('Jeep', 'Avenger', 50.80, 1536, 0.33, 15.40),
('DS', 'DS 3 E-Tense', 50.80, 1550, 0.31, 15.60),

-- GROUPE VOLKSWAGEN (VW, Audi, Porsche, Skoda, Cupra)

('Volkswagen', 'e-Up!', 32.30, 1160, 0.31, 14.40),
('Volkswagen', 'e-Golf', 32.00, 1540, 0.28, 15.80),
('Volkswagen', 'ID.3 Pure', 45.00, 1772, 0.27, 15.10),
('Volkswagen', 'ID.3 Pro', 58.00, 1812, 0.27, 15.40),
('Volkswagen', 'ID.4 Pure', 52.00, 1891, 0.28, 16.70),
('Volkswagen', 'ID.4 Pro', 77.00, 2124, 0.28, 16.50),
('Volkswagen', 'ID.4 GTX', 77.00, 2224, 0.28, 17.60),
('Volkswagen', 'ID.5 Pro', 77.00, 2118, 0.26, 16.10),
('Volkswagen', 'ID.7 Pro', 77.00, 2122, 0.23, 14.10),
('Volkswagen', 'ID. Buzz', 77.00, 2471, 0.29, 20.80),
('Audi', 'Q4 e-tron 35', 51.50, 1965, 0.28, 17.00),
('Audi', 'Q4 e-tron 40', 76.60, 2050, 0.28, 17.30),
('Audi', 'Q4 e-tron 50 quattro', 76.60, 2140, 0.28, 17.90),
('Audi', 'Q8 e-tron 50', 89.00, 2585, 0.27, 20.10),
('Audi', 'Q8 e-tron 55', 106.00, 2595, 0.27, 20.60),
('Audi', 'e-tron GT', 83.70, 2276, 0.24, 19.90),
('Audi', 'RS e-tron GT', 83.70, 2347, 0.24, 20.20),
('Porsche', 'Taycan (RWD)', 71.00, 2050, 0.22, 19.60),
('Porsche', 'Taycan 4S', 83.70, 2220, 0.22, 20.40),
('Porsche', 'Taycan Turbo S', 83.70, 2295, 0.22, 21.90),
('Porsche', 'Macan 4 Electric', 95.00, 2330, 0.25, 17.90),
('Porsche', 'Macan Turbo Electric', 95.00, 2405, 0.25, 18.80),
('Skoda', 'Enyaq iV 60', 58.00, 1965, 0.27, 15.90),
('Skoda', 'Enyaq iV 80', 77.00, 2075, 0.27, 16.10),
('Skoda', 'Enyaq Coupe iV 80', 77.00, 2084, 0.23, 15.50),
('Cupra', 'Born 58', 58.00, 1811, 0.27, 15.30),
('Cupra', 'Born 77', 77.00, 1950, 0.27, 15.80),
('Cupra', 'Tavascan Endurance', 77.00, 2178, 0.26, 15.60),

-- BMW

('BMW', 'i3 (120 Ah)', 37.90, 1345, 0.29, 15.30),
('BMW', 'iX1 xDrive30', 64.70, 2010, 0.26, 17.30),
('BMW', 'i4 eDrive35', 66.00, 2065, 0.24, 15.80),
('BMW', 'i4 eDrive40', 80.70, 2125, 0.24, 16.10),
('BMW', 'i4 M50', 80.70, 2290, 0.24, 18.00),
('BMW', 'i5 eDrive40', 81.20, 2130, 0.23, 15.90),
('BMW', 'iX3', 74.00, 2255, 0.29, 18.50),
('BMW', 'iX xDrive40', 71.00, 2365, 0.25, 19.40),
('BMW', 'iX xDrive50', 105.20, 2510, 0.25, 19.80),
('BMW', 'i7 xDrive60', 101.70, 2640, 0.24, 18.40),

-- MERCEDES-BENZ

('Mercedes-Benz', 'EQA 250', 66.50, 2040, 0.28, 17.70),
('Mercedes-Benz', 'EQB 250', 66.50, 2110, 0.28, 16.30),
('Mercedes-Benz', 'EQC 400', 80.00, 2495, 0.28, 22.20),
('Mercedes-Benz', 'EQE 300', 89.00, 2385, 0.22, 15.90),
('Mercedes-Benz', 'EQE 350+', 90.60, 2355, 0.22, 15.90),
('Mercedes-Benz', 'EQS 450+', 107.80, 2480, 0.20, 15.70),
('Mercedes-Benz', 'EQS 580 4MATIC', 107.80, 2585, 0.20, 18.30),
('Mercedes-Benz', 'EQV 300', 90.00, 2635, 0.34, 27.40),

-- SMART

('Smart', '#1 Pro+', 62.00, 1788, 0.29, 17.40),
('Smart', '#1 Premium', 62.00, 1788, 0.29, 16.70),
('Smart', '#1 Brabus', 62.00, 1900, 0.29, 18.20),
('Smart', '#3 Premium', 62.00, 1810, 0.27, 16.30),

-- VOLVO

('Volvo', 'EX30 Single Motor', 49.00, 1830, 0.28, 16.70),
('Volvo', 'EX30 Twin Motor Performance', 64.00, 1960, 0.28, 17.50),
('Volvo', 'XC40 Recharge Single Motor', 67.00, 1955, 0.32, 18.50),
('Volvo', 'XC40 Recharge Twin', 78.00, 2113, 0.32, 20.50),
('Volvo', 'EX90 Twin Motor', 107.00, 2811, 0.29, 20.90),

-- POLESTAR

('Polestar', 'Polestar 2 Standard Range', 67.00, 1940, 0.28, 17.00),
('Polestar', 'Polestar 2 Long Range', 78.00, 2048, 0.28, 17.10),
('Polestar', 'Polestar 3 Long Range', 107.00, 2584, 0.29, 20.10),

-- MINI

('Mini', 'Cooper SE', 28.90, 1365, 0.30, 15.20),
('Mini', 'Cooper E (Nouvelle Gen)', 36.60, 1540, 0.30, 13.80),

-- JAGUAR

('Jaguar', 'I-Pace EV400', 84.70, 2133, 0.29, 22.00),

-- LOTUS

('Lotus', 'Eletre R', 109.00, 2640, 0.26, 21.40),

-- ==========================================
-- ASIE
-- ==========================================

-- HYUNDAI

('Hyundai', 'Kona Electric (39 kWh)', 39.20, 1535, 0.28, 14.30),
('Hyundai', 'Kona Electric (64 kWh)', 64.00, 1685, 0.28, 14.70),
('Hyundai', 'Ioniq 5 Standard Range', 58.00, 1830, 0.29, 16.70),
('Hyundai', 'Ioniq 5 Long Range', 77.40, 1935, 0.29, 17.00),
('Hyundai', 'Ioniq 5 N', 84.00, 2200, 0.29, 21.20),
('Hyundai', 'Ioniq 6 Long Range RWD', 77.40, 1910, 0.21, 14.30),

-- KIA

('Kia', 'e-Soul (64 kWh)', 64.00, 1682, 0.34, 15.70),
('Kia', 'Niro EV', 64.80, 1739, 0.29, 16.20),
('Kia', 'EV6 Standard Range', 58.00, 1800, 0.28, 16.60),
('Kia', 'EV6 RWD', 77.40, 1910, 0.28, 16.50),
('Kia', 'EV6 GT', 77.40, 2125, 0.28, 20.60),
('Kia', 'EV9 RWD', 99.80, 2426, 0.28, 20.20),

-- GENESIS

('Genesis', 'GV60 Sport', 77.40, 2145, 0.29, 18.80),

-- BYD

('BYD', 'Dolphin', 60.40, 1658, 0.28, 15.90),
('BYD', 'Atto 3', 60.48, 1750, 0.29, 15.60),
('BYD', 'Seal RWD', 82.50, 2055, 0.22, 16.60),
('BYD', 'Seal AWD', 82.50, 2185, 0.22, 18.20),
('BYD', 'Han', 85.40, 2250, 0.23, 18.50),
('BYD', 'Tang', 86.40, 2489, 0.33, 23.80),

-- MG

('MG', 'MG4 Standard', 51.00, 1655, 0.28, 17.00),
('MG', 'MG4 Long Range', 64.00, 1675, 0.28, 16.00),
('MG', 'MG4 Extended Range', 77.00, 1751, 0.28, 16.50),
('MG', 'MG4 XPOWER', 64.00, 1800, 0.28, 18.70),
('MG', 'ZS EV Standard Range', 51.10, 1570, 0.33, 17.30),
('MG', 'ZS EV Long Range', 68.30, 1620, 0.33, 17.80),
('MG', 'Marvel R', 70.00, 1810, 0.32, 19.40),
('MG', 'MG5 Long Range', 61.10, 1562, 0.29, 17.50),

-- XPENG

('Xpeng', 'P7 RWD Long Range', 82.70, 2020, 0.24, 16.80),
('Xpeng', 'G9 RWD Standard', 75.80, 2235, 0.27, 19.40),

-- ZEEKR

('Zeekr', '001 RWD', 94.00, 2275, 0.23, 17.30),
('Zeekr', 'X RWD', 64.00, 1855, 0.28, 16.40),

-- NIO

('NIO', 'ET5 75 kWh', 73.50, 2140, 0.24, 18.60),
('NIO', 'ET7 100 kWh', 90.00, 2359, 0.21, 19.30),

-- AIWAYS

('Aiways', 'U5', 63.00, 1720, 0.29, 17.00),

-- NISSAN

('Nissan', 'Leaf (40 kWh)', 39.00, 1580, 0.28, 17.10),
('Nissan', 'Leaf e+ (62 kWh)', 59.00, 1739, 0.28, 18.50),
('Nissan', 'Ariya (63 kWh)', 63.00, 1914, 0.29, 17.60),
('Nissan', 'Ariya (87 kWh)', 87.00, 2122, 0.29, 18.50),

-- TOYOTA

('Toyota', 'bZ4X FWD', 71.40, 1895, 0.29, 16.50),

-- SUBARU

('Subaru', 'Solterra AWD', 71.40, 2013, 0.29, 17.90),

-- HONDA

('Honda', 'Honda e', 28.50, 1514, 0.32, 17.20),
('Honda', 'e:Ny1', 61.90, 1752, 0.32, 18.20),

-- LEXUS

('Lexus', 'UX 300e', 72.80, 1840, 0.31, 16.70),
('Lexus', 'RZ 450e', 71.40, 2050, 0.28, 18.30),

-- ==========================================
-- AMÉRICAINS
-- ==========================================

-- TESLA

('Tesla', 'Model 3 Propulsion', 57.50, 1765, 0.22, 13.20),
('Tesla', 'Model 3 Long Range', 75.00, 1844, 0.22, 14.70),
('Tesla', 'Model 3 Performance', 78.10, 1839, 0.22, 16.50),
('Tesla', 'Model Y Propulsion', 57.50, 1909, 0.23, 15.70),
('Tesla', 'Model Y Long Range', 75.00, 1979, 0.23, 16.90),
('Tesla', 'Model Y Performance', 75.00, 1995, 0.23, 17.30),
('Tesla', 'Model S Dual Motor', 95.00, 2095, 0.21, 17.50),
('Tesla', 'Model S Plaid', 95.00, 2162, 0.21, 18.70),
('Tesla', 'Model X Dual Motor', 95.00, 2360, 0.24, 20.80),
('Tesla', 'Model X Plaid', 95.00, 2455, 0.24, 21.40),
('Tesla', 'Cybertruck AWD', 123.00, 2995, 0.34, 23.50),
('Tesla', 'Cybertruck Cyberbeast', 123.00, 3104, 0.34, 24.80),

-- FORD

('Ford', 'Mustang Mach-E SR RWD', 70.00, 2044, 0.30, 17.20),
('Ford', 'Mustang Mach-E ER RWD', 91.00, 2111, 0.30, 16.50),
('Ford', 'Mustang Mach-E GT', 91.00, 2273, 0.30, 20.00),
('Ford', 'F-150 Lightning ER', 131.00, 3130, 0.44, 28.00),

-- RIVIAN

('Rivian', 'R1T Dual-Motor', 135.00, 3150, 0.30, 27.50),
('Rivian', 'R1T Quad-Motor', 135.00, 3242, 0.30, 29.50),
('Rivian', 'R1S Dual-Motor', 135.00, 3195, 0.32, 26.80),

-- LUCID

('Lucid', 'Air Pure RWD', 88.00, 2050, 0.20, 14.10),
('Lucid', 'Air Grand Touring', 112.00, 2360, 0.20, 14.90),
('Lucid', 'Air Sapphire', 118.00, 2420, 0.20, 16.00);