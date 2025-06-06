# app/models/settings_model.py
import sqlite3
from flask import current_app
from datetime import datetime

def _get_db_connection():
    conn = sqlite3.connect(current_app.config['DATABASE_PATH'])
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def get_setting(key, default=None):
    conn = _get_db_connection()
    try:
        row = conn.execute("SELECT setting_value FROM settings WHERE setting_key = ?", (key,)).fetchone()
        return row['setting_value'] if row and row['setting_value'] is not None else default
    except Exception as e:
        current_app.logger.error(f"Error fetching setting '{key}': {e}", exc_info=True)
        return default
    finally:
        if conn:
            conn.close()

def update_setting(key, value):
    conn = _get_db_connection()
    try:
        # Lệnh INSERT OR REPLACE sẽ chèn mới nếu key chưa có, hoặc cập nhật nếu đã có
        conn.execute(
            "INSERT OR REPLACE INTO settings (setting_key, setting_value, updated_at) VALUES (?, ?, datetime('now', 'localtime'))",
            (key, value)
        )
        conn.commit()
        return True
    except Exception as e:
        current_app.logger.error(f"Error updating setting '{key}': {e}", exc_info=True)
        if conn: conn.rollback()
        return False
    finally:
        if conn:
            conn.close()

def get_multiple_settings(keys):
    """Lấy nhiều settings cùng lúc."""
    settings_dict = {}
    for key in keys:
        settings_dict[key] = get_setting(key)
    return settings_dict