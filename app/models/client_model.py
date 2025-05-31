# init file for package
import sqlite3
from config import DB_PATH

# ===== CONNECT DB =====
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ===== BOOKINGS =====
def create_booking(data):
    with get_connection() as conn:
        conn.execute("""
            INSERT INTO bookings (flight_code, passenger_name, email, phone, payment_method)
            VALUES (?, ?, ?, ?, ?)
        """, (
            data['flight_code'],
            data['passenger_name'],
            data['email'],
            data['phone'],
            data['payment_method']
        ))
        conn.commit()

def find_booking(pnr, last_name_prefix):
    with get_connection() as conn:
        row = conn.execute("""
            SELECT * FROM bookings WHERE booking_code=? AND passenger_name LIKE ?
        """, (pnr, f"{last_name_prefix}%")).fetchone()
        return dict(row) if row else None


# ===== FLIGHTS =====
def search_flights(departure, destination):
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT * FROM flights WHERE departure=? AND destination=?
        """, (departure, destination)).fetchall()
        return [dict(row) for row in rows]


# ===== E-MENU =====
def get_all_emenu_items():
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM emenu").fetchall()
        return [dict(row) for row in rows]
