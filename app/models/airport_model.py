# app/models/airport_model.py
import sqlite3
from flask import current_app

def _get_db_connection():
    """Hàm tiện ích nội bộ để lấy kết nối DB."""
    conn = sqlite3.connect(current_app.config['DATABASE_PATH'])
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def get_all_airports():
    """
    Lấy danh sách tất cả các sân bay từ cơ sở dữ liệu.
    """
    conn = _get_db_connection()
    try:
        airports = conn.execute("SELECT id, name, city, iata_code FROM airports ORDER BY city, name").fetchall()
        return [dict(airport) for airport in airports] # Chuyển đổi thành list các dict
    except Exception as e:
        print(f"Error fetching airports: {e}")
        return []
    finally:
        if conn:
            conn.close()

def get_airport_by_iata_code(iata_code):
    """
    Lấy thông tin một sân bay dựa trên mã IATA.
    """
    conn = _get_db_connection()
    try:
        airport = conn.execute(
            "SELECT id, name, city, iata_code FROM airports WHERE iata_code = ?",
            (iata_code,)
        ).fetchone()
        return dict(airport) if airport else None
    except Exception as e:
        print(f"Error fetching airport by IATA code {iata_code}: {e}")
        return None
    finally:
        if conn:
            conn.close()

def get_airport_id_by_iata_code(iata_code):
    """
    Lấy ID của một sân bay dựa trên mã IATA.
    Hữu ích khi tìm kiếm chuyến bay nếu form gửi mã IATA.
    """
    conn = _get_db_connection()
    try:
        airport_id = conn.execute(
            "SELECT id FROM airports WHERE iata_code = ?",
            (iata_code,)
        ).fetchone()
        return airport_id['id'] if airport_id else None
    except Exception as e:
        print(f"Error fetching airport ID by IATA code {iata_code}: {e}")
        return None
    finally:
        if conn:
            conn.close()