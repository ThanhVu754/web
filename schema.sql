CREATE TABLE IF NOT EXISTS flights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_number TEXT NOT NULL,
    departure_airport TEXT NOT NULL,
    arrival_airport TEXT NOT NULL,
    departure_date TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_date TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    base_price INTEGER NOT NULL,
    total_seats INTEGER NOT NULL,
    status TEXT DEFAULT 'scheduled'
);
