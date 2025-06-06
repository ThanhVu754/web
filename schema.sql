-- Xóa các bảng nếu đã tồn tại để tránh lỗi khi khởi tạo lại
DROP TABLE IF EXISTS booking_menu_items;
DROP TABLE IF EXISTS booking_ancillary_services;
DROP TABLE IF EXISTS passengers;
DROP TABLE IF EXISTS bookings; -- Sẽ được tạo lại với cấu trúc mới
DROP TABLE IF EXISTS promotions;
DROP TABLE IF EXISTS flights;
DROP TABLE IF EXISTS airports;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS ancillary_services;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- Bảng Users (Giữ nguyên)
-- Trong schema.sql
DROP TABLE IF EXISTS users; -- Xóa bảng cũ nếu có trước khi tạo lại
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client' CHECK(role IN ('client', 'admin')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'pending', 'locked')), -- Trạng thái tài khoản
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

-- Bảng Sessions (Giữ nguyên)
CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Bảng Airports (Giữ nguyên)
CREATE TABLE airports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    iata_code TEXT UNIQUE NOT NULL
);

-- Bảng Flights (Giữ nguyên như lần cập nhật trước)
-- Trong schema.sql

-- ... (các lệnh DROP TABLE và CREATE TABLE khác giữ nguyên) ...

DROP TABLE IF EXISTS flights; -- Đảm bảo xóa bảng cũ trước khi tạo lại với schema mới
CREATE TABLE flights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_number TEXT NOT NULL,
    departure_airport_id INTEGER NOT NULL,
    arrival_airport_id INTEGER NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    economy_price REAL NOT NULL DEFAULT 0,
    business_price REAL NOT NULL DEFAULT 0,
    first_class_price REAL NOT NULL DEFAULT 0,
    total_seats INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'on_time', 'delayed', 'cancelled', 'departed', 'landed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (departure_airport_id) REFERENCES airports (id) ON DELETE RESTRICT,
    FOREIGN KEY (arrival_airport_id) REFERENCES airports (id) ON DELETE RESTRICT
);

-- Bảng Promotions (Giữ nguyên)
CREATE TABLE promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    promo_code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_percentage REAL,
    discount_amount REAL,
    valid_from DATETIME NOT NULL,
    valid_to DATETIME NOT NULL,
    min_spend REAL DEFAULT 0,
    max_discount REAL,
    usage_limit INTEGER,
    times_used INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Bookings: Lưu thông tin các đặt chỗ (ĐÃ CẬP NHẬT - BỎ taxes_fees)
CREATE TABLE bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    flight_id INTEGER NOT NULL,
    booking_code TEXT UNIQUE NOT NULL,
    booking_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    num_adults INTEGER NOT NULL DEFAULT 1,
    num_children INTEGER DEFAULT 0,
    num_infants INTEGER DEFAULT 0,
    seat_class_booked TEXT NOT NULL,
    base_fare REAL NOT NULL, -- Giá vé gốc trước dịch vụ, giảm giá
    ancillary_services_total REAL DEFAULT 0, -- Tổng tiền các dịch vụ cộng thêm
    promotion_id INTEGER,
    discount_applied REAL DEFAULT 0, -- Số tiền đã được giảm
    total_amount REAL NOT NULL, -- Tổng tiền cuối cùng phải trả (base_fare + ancillary_services_total - discount_applied)
    payment_method TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    status TEXT NOT NULL DEFAULT 'pending_payment' CHECK(status IN ('pending_payment', 'confirmed', 'cancelled_by_user', 'cancelled_by_airline', 'changed', 'completed','payment_received','no_show')),
    checkin_status TEXT DEFAULT 'not_checked_in' CHECK(checkin_status IN ('not_checked_in', 'checked_in', 'boarding_pass_issued')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    FOREIGN KEY (flight_id) REFERENCES flights (id) ON DELETE CASCADE,
    FOREIGN KEY (promotion_id) REFERENCES promotions (id) ON DELETE SET NULL
);

-- Bảng Passengers (Giữ nguyên)
CREATE TABLE passengers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    title TEXT,
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    gender TEXT CHECK(gender IN ('male', 'female', 'other')),
    passenger_type TEXT NOT NULL DEFAULT 'adult' CHECK(passenger_type IN ('adult', 'child', 'infant')),
    passport_number TEXT,
    nationality TEXT,
    seat_assigned TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
);

-- Bảng Notifications (Giữ nguyên)
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    link_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    start_date DATETIME,
    end_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng MenuItems (Giữ nguyên)
CREATE TABLE menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK(category IN ('combo', 'do_an_nong', 'do_uong', 'mon_an_vat')),
    price_vnd REAL NOT NULL,
    price_usd REAL,
    image_url TEXT,
    is_available INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng AncillaryServices (Giữ nguyên)
CREATE TABLE ancillary_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK(category IN ('baggage', 'seat_preference', 'meal_preorder', 'insurance', 'priority_services', 'airport_transfer', 'in_flight_entertainment')),
    price_vnd REAL NOT NULL DEFAULT 0,
    price_usd REAL,
    conditions TEXT,
    is_available INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Booking_AncillaryServices (Giữ nguyên)
CREATE TABLE booking_ancillary_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    ancillary_service_id INTEGER NOT NULL,
    passenger_id INTEGER,
    quantity INTEGER DEFAULT 1,
    price_at_booking REAL NOT NULL,
    notes TEXT,
    FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    FOREIGN KEY (ancillary_service_id) REFERENCES ancillary_services (id) ON DELETE RESTRICT,
    FOREIGN KEY (passenger_id) REFERENCES passengers (id) ON DELETE CASCADE
);

-- Bảng Booking_MenuItems (Giữ nguyên)
CREATE TABLE booking_menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    passenger_id INTEGER,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    price_at_booking REAL NOT NULL,
    notes TEXT,
    FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    FOREIGN KEY (passenger_id) REFERENCES passengers (id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items (id) ON DELETE RESTRICT
);

-- Tạo Indexes (Giữ nguyên)
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_airports_iata_code ON airports (iata_code);
CREATE INDEX IF NOT EXISTS idx_flights_departure_airport_id ON flights (departure_airport_id);
CREATE INDEX IF NOT EXISTS idx_flights_arrival_airport_id ON flights (arrival_airport_id);
CREATE INDEX IF NOT EXISTS idx_flights_departure_time ON flights (departure_time);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_flight_id ON bookings (flight_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_code ON bookings (booking_code);
CREATE INDEX IF NOT EXISTS idx_passengers_booking_id ON passengers (booking_id);
CREATE INDEX IF NOT EXISTS idx_passengers_last_name ON passengers (last_name);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

PRAGMA foreign_keys = ON;

INSERT INTO users (full_name, email, password_hash, role, status, phone_number) VALUES 
('Admin Master', 'admin@gmail.com', 'scrypt:32768:8:1$DL1seCgmwTgBtSDU$7c021d76e34edf6145efb1eaf98550a96863cad6d7a8bbb965664097a240d21f5b0715c290d1cc905aaccffde51225182dcccb892388a4eeae1ef17024127b23', 'admin', 'active', NULL);

INSERT INTO airports (name, city, country, iata_code) VALUES
('Sân bay Quốc tế Tân Sơn Nhất', 'TP. Hồ Chí Minh', 'Việt Nam', 'SGN'),
('Sân bay Quốc tế Nội Bài', 'Hà Nội', 'Việt Nam', 'HAN'),
('Sân bay Quốc tế Đà Nẵng', 'Đà Nẵng', 'Việt Nam', 'DAD'),
('Sân bay Quốc tế Phú Quốc', 'Phú Quốc', 'Việt Nam', 'PQC'),
('Sân bay Quốc tế Cam Ranh', 'Nha Trang', 'Việt Nam', 'CXR'),
('Sân bay Quốc tế Cát Bi', 'Hải Phòng', 'Việt Nam', 'HPH'),
('Sân bay Liên Khương', 'Đà Lạt', 'Việt Nam', 'DLI'),
('Sân bay Phú Bài', 'Huế', 'Việt Nam', 'HUI'),
('Sân bay Vinh', 'Vinh', 'Việt Nam', 'VII'),
('Sân bay Côn Đảo', 'Côn Đảo', 'Việt Nam', 'VCS'),
('Sân bay Pleiku', 'Pleiku', 'Việt Nam', 'PXU'),
('Sân bay Phù Cát', 'Quy Nhơn', 'Việt Nam', 'UIH'),
('Sân bay Cần Thơ', 'Cần Thơ', 'Việt Nam', 'VCA');

INSERT INTO flights (flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, economy_price, business_price, first_class_price, total_seats, available_seats, status) VALUES
('SA1', (SELECT id FROM airports WHERE iata_code = 'SGN'), (SELECT id FROM airports WHERE iata_code = 'HAN'), datetime('now', '+3 days', '10:00:00'), datetime('now', '+3 days', '12:05:00'), 1500000, 3000000, 5000000, 150, 145, 'scheduled'),
('SA2', (SELECT id FROM airports WHERE iata_code = 'SGN'), (SELECT id FROM airports WHERE iata_code = 'HAN'), datetime('now', '+3 days', '15:30:00'), datetime('now', '+3 days', '17:35:00'), 1600000, 3200000, 5200000, 160, 160, 'scheduled'),
('SA3', (SELECT id FROM airports WHERE iata_code = 'HAN'), (SELECT id FROM airports WHERE iata_code = 'DAD'), datetime('now', '+4 days', '09:00:00'), datetime('now', '+4 days', '10:20:00'), 1100000, 2200000, 3800000, 180, 170, 'scheduled'),
('SA4', (SELECT id FROM airports WHERE iata_code = 'SGN'), (SELECT id FROM airports WHERE iata_code = 'PQC'), datetime('now', '+5 days', '13:00:00'), datetime('now', '+5 days', '14:00:00'), 950000, 1900000, 3800000, 70, 65, 'scheduled'),
('SA5', (SELECT id FROM airports WHERE iata_code = 'PQC'), (SELECT id FROM airports WHERE iata_code = 'SGN'), datetime('now', '+5 days', '16:00:00'), datetime('now', '+5 days', '17:00:00'), 980000, 1950000, 7000000, 150, 150, 'scheduled'),
('SA6', (SELECT id FROM airports WHERE iata_code = 'HAN'), (SELECT id FROM airports WHERE iata_code = 'CXR'), datetime('now', '+6 days', '07:00:00'), datetime('now', '+6 days', '08:50:00'), 2200000, 4500000, 3800000, 250, 240, 'scheduled'),
('SA7', (SELECT id FROM airports WHERE iata_code = 'DAD'), (SELECT id FROM airports WHERE iata_code = 'SGN'), datetime('now', '+4 days', '17:00:00'), datetime('now', '+4 days', '18:20:00'), 1250000, 2550000, 4050000, 150, 150, 'scheduled'),
('SA8', (SELECT id FROM airports WHERE iata_code = 'CXR'), (SELECT id FROM airports WHERE iata_code = 'HAN'), datetime('now', '+7 days', '11:00:00'), datetime('now', '+7 days', '12:50:00'), 2100000, 4300000, 6800000, 180, 180, 'scheduled'),
('SA9', (SELECT id FROM airports WHERE iata_code = 'HPH'), (SELECT id FROM airports WHERE iata_code = 'HUI'), datetime('now', '+3 days', '14:00:00'), datetime('now', '+3 days', '15:10:00'), 800000, 1000000, 2000000, 70, 70, 'scheduled'),
('SA10', (SELECT id FROM airports WHERE iata_code = 'DLI'), (SELECT id FROM airports WHERE iata_code = 'SGN'), datetime('now', '+5 days', '18:00:00'), datetime('now', '+5 days', '18:50:00'), 1300000, 2600000, 3000000, 150, 140, 'scheduled'),
('SA11', (SELECT id FROM airports WHERE iata_code = 'HAN'), (SELECT id FROM airports WHERE iata_code = 'SGN'), datetime('now', '+2 days', '06:00:00'), datetime('now', '+2 days', '08:05:00'), 1450000, 2900000, 4800000, 160, 150, 'scheduled'),
('SA12', (SELECT id FROM airports WHERE iata_code = 'HAN'), (SELECT id FROM airports WHERE iata_code = 'SGN'), datetime('now', '+2 days', '19:00:00'), datetime('now', '+2 days', '21:05:00'), 1480000, 2950000, 4900000, 160, 160, 'scheduled'),
('SA13', (SELECT id FROM airports WHERE iata_code = 'HAN'), (SELECT id FROM airports WHERE iata_code = 'VII'), datetime('now', '+5 days', '16:30:00'), datetime('now', '+5 days', '17:40:00'), 890000, 1750000, 2000000, 120, 115, 'scheduled'),
('SA14', (SELECT id FROM airports WHERE iata_code = 'SGN'), (SELECT id FROM airports WHERE iata_code = 'CXR'), datetime('now', '+3 days', '13:00:00'), datetime('now', '+3 days', '14:20:00'), 920000, 1900000, 3000000, 150, 150, 'scheduled'),
('SA15', (SELECT id FROM airports WHERE iata_code = 'HAN'), (SELECT id FROM airports WHERE iata_code = 'PQC'), datetime('now', '+6 days', '06:00:00'), datetime('now', '+6 days', '08:20:00'), 1750000, 3400000, 5200000, 180, 175, 'scheduled'),
('SA16', (SELECT id FROM airports WHERE iata_code = 'HAN'), (SELECT id FROM airports WHERE iata_code = 'DAD'), datetime('now', '+3 days', '09:30:00'), datetime('now', '+3 days', '10:45:00'), 900000, 1800000, 2900000, 150, 148, 'scheduled'),
('SA17', (SELECT id FROM airports WHERE iata_code = 'SGN'), (SELECT id FROM airports WHERE iata_code = 'CXR'), datetime('now', '+4 days', '06:00:00'), datetime('now', '+4 days', '07:20:00'), 1000000, 1950000, 3100000, 120, 120, 'scheduled'),
('SA18', (SELECT id FROM airports WHERE iata_code = 'DAD'), (SELECT id FROM airports WHERE iata_code = 'SGN'), datetime('now', '+5 days', '13:00:00'), datetime('now', '+5 days', '14:20:00'), 1350000, 2500000, 3700000, 150, 145, 'scheduled'),
('SA19', (SELECT id FROM airports WHERE iata_code = 'HPH'), (SELECT id FROM airports WHERE iata_code = 'PQC'), datetime('now', '+6 days', '11:00:00'), datetime('now', '+6 days', '13:10:00'), 1600000, 3000000, 5000000, 140, 139, 'scheduled');