# app/models/client_model.py (thay vì user_model.py)
import sqlite3
from flask import current_app
from werkzeug.security import generate_password_hash # check_password_hash sẽ dùng trong controller

def _get_db_connection():
    conn = sqlite3.connect(current_app.config['DATABASE_PATH'])
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def create_user(full_name, email, password, phone_number=None, role='client'):
    hashed_password = generate_password_hash(password)
    conn = _get_db_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO users (full_name, email, password_hash, phone_number, role) VALUES (?, ?, ?, ?, ?)",
            (full_name, email, hashed_password, phone_number, role)
        )
        conn.commit()
        return cursor.lastrowid
    except sqlite3.IntegrityError:
        return None
    except Exception as e:
        print(f"Error creating user {email}: {e}")
        return None
    finally:
        if conn:
            conn.close()

def get_user_by_email(email):
    conn = _get_db_connection()
    try:
        user = conn.execute(
            "SELECT * FROM users WHERE email = ?", (email,)
        ).fetchone()
        return user
    finally:
        if conn:
            conn.close()

def get_user_by_id(user_id):
    conn = _get_db_connection()
    try:
        user = conn.execute(
            "SELECT * FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        return user
    finally:
        if conn:
            conn.close()