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
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client' CHECK(role IN ('client', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
CREATE TABLE flights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_number TEXT NOT NULL, -- Ví dụ: SA456, SA101
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
    UNIQUE (flight_number, departure_time),
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
    status TEXT NOT NULL DEFAULT 'pending_payment' CHECK(status IN ('pending_payment', 'confirmed', 'cancelled_by_user', 'cancelled_by_airline', 'changed', 'completed')),
    checkin_status TEXT DEFAULT 'not_checked_in' CHECK(checkin_status IN ('not_checked_in', 'checked_in', 'boarding_pass_issued')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    FOREIGN KEY (flight_id) REFERENCES flights (id) ON DELETE RESTRICT,
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