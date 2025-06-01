# app/models/client_model.py (thay vì user_model.py)
import sqlite3
from flask import current_app
from werkzeug.security import generate_password_hash # check_password_hash sẽ dùng trong controller

def _get_db_connection():
    conn = sqlite3.connect(current_app.config['DATABASE_PATH'])
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def create_user(full_name, email, password, phone_number=None): # Bỏ role, status khỏi tham số cho client tự đăng ký
    """
    Client tự đăng ký tài khoản.
    Mặc định role là 'client' và status là 'active'.
    """
    hashed_password = generate_password_hash(password)
    conn = _get_db_connection()
    try:
        # Sử dụng giá trị DEFAULT cho role và status từ schema,
        # hoặc chỉ định rõ ở đây nếu muốn chắc chắn.
        # Schema đã có DEFAULT 'client' cho role và DEFAULT 'active' cho status.
        cursor = conn.execute(
            "INSERT INTO users (full_name, email, password_hash, phone_number, role, status) VALUES (?, ?, ?, ?, ?, ?)",
            (full_name, email, hashed_password, phone_number, 'client', 'active') # Đặt role và status rõ ràng
        )
        conn.commit()
        return cursor.lastrowid
    except sqlite3.IntegrityError: # Email hoặc phone đã tồn tại
        # current_app.logger.warning(f"Registration failed: Integrity error for email/phone: {email}/{phone_number}")
        return None
    except Exception as e:
        current_app.logger.error(f"Error creating user {email}: {e}")
        print(f"Error creating user {email}: {e}") # In ra lỗi để dễ debug cho demo
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