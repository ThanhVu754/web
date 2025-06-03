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
            
def get_all_users_admin(search_term=None, status_filter=None, role_filter=None): # Bỏ page, per_page cho đơn giản, JS sẽ tự xử lý phân trang mock
    """
    Lấy danh sách người dùng cho admin, có tìm kiếm, lọc.
    Cần đảm bảo bảng users có cột 'status' và 'created_at'.
    """
    conn = _get_db_connection()
    users_list = []
    try:
        query_params = []
        # Lấy thêm cột status nếu schema của bạn đã có
        base_query = "SELECT id, full_name, email, phone_number, role, status, strftime('%Y-%m-%d', created_at) as registered_date FROM users"
        conditions = []

        if search_term:
            like_term = f"%{search_term}%"
            conditions.append("(full_name LIKE ? OR email LIKE ? OR phone_number LIKE ?)")
            query_params.extend([like_term, like_term, like_term])
        
        if status_filter: # Dành cho cột status mới thêm
            conditions.append("status = ?")
            query_params.append(status_filter)

        if role_filter:
            conditions.append("role = ?")
            query_params.append(role_filter)

        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)
        
        base_query += " ORDER BY created_at DESC"
        
        cursor = conn.execute(base_query, tuple(query_params))
        raw_users = cursor.fetchall()
        for row in raw_users:
            users_list.append(dict(row)) # Chuyển sqlite3.Row thành dict
        return users_list
    except Exception as e:
        current_app.logger.error(f"Error fetching all users for admin: {e}")
        return []
    finally:
        if conn:
            conn.close()

def create_user_by_admin(user_data):
    """
    Admin tạo người dùng mới. user_data là dict chứa:
    full_name, email, password (bắt buộc), phone_number, role, status (tùy chọn)
    """
    # Password là bắt buộc khi admin tạo user
    if not user_data.get('password'):
        raise ValueError("Mật khẩu là bắt buộc khi tạo người dùng mới.")
        
    hashed_password = generate_password_hash(user_data['password'])
    conn = _get_db_connection()
    try:
        cursor = conn.execute(
            """INSERT INTO users (full_name, email, password_hash, phone_number, role, status) 
               VALUES (?, ?, ?, ?, ?, ?)""",
            (user_data['full_name'], user_data['email'], hashed_password, 
             user_data.get('phone_number'), 
             user_data.get('role', 'client'), 
             user_data.get('status', 'active')) # Mặc định status là active khi admin tạo
        )
        conn.commit()
        return cursor.lastrowid
    except sqlite3.IntegrityError as ie: # Email hoặc phone có thể đã tồn tại
        current_app.logger.warning(f"ADMIN User Creation - IntegrityError: {ie} for email {user_data.get('email')}")
        raise # Ném lại để controller xử lý và trả về lỗi cụ thể (ví dụ 409)
    except Exception as e:
        current_app.logger.error(f"Error admin creating user {user_data.get('email')}: {e}")
        raise
    finally:
        if conn:
            conn.close()


def update_user_by_admin(user_id, user_data):
    """
    Admin cập nhật thông tin người dùng. user_data là dict.
    Có thể cập nhật: full_name, email, phone_number, role, status.
    Mật khẩu chỉ cập nhật nếu được cung cấp và không rỗng.
    """
    conn = _get_db_connection()
    fields_to_update_sql = []
    params = []

    if 'full_name' in user_data and user_data['full_name'] is not None:
        fields_to_update_sql.append("full_name = ?")
        params.append(user_data['full_name'])
    if 'email' in user_data and user_data['email'] is not None:
        fields_to_update_sql.append("email = ?")
        params.append(user_data['email'])
    if 'phone_number' in user_data: # Cho phép phone_number là NULL hoặc chuỗi
        fields_to_update_sql.append("phone_number = ?")
        params.append(user_data['phone_number'])
    if 'role' in user_data and user_data['role'] is not None:
        fields_to_update_sql.append("role = ?")
        params.append(user_data['role'])
    if 'status' in user_data and user_data['status'] is not None: 
        fields_to_update_sql.append("status = ?")
        params.append(user_data['status'])
    
    # Chỉ hash và cập nhật mật khẩu nếu mật khẩu mới được cung cấp và không rỗng
    if 'password' in user_data and user_data['password']: 
        if len(user_data['password']) < 6: # Có thể thêm validation độ dài ở đây hoặc controller
             raise ValueError("Mật khẩu mới phải có ít nhất 6 ký tự.")
        hashed_password = generate_password_hash(user_data['password'])
        fields_to_update_sql.append("password_hash = ?")
        params.append(hashed_password)

    if not fields_to_update_sql:
        return True # Không có gì để cập nhật, coi như thành công

    params.append(user_id)
    query = f"UPDATE users SET {', '.join(fields_to_update_sql)}, updated_at = datetime('now', 'localtime') WHERE id = ?"
    
    try:
        conn.execute(query, tuple(params))
        conn.commit()
        return True
    except sqlite3.IntegrityError as ie: # Có thể do cố gắng đặt email/phone trùng
        current_app.logger.warning(f"ADMIN User Update - IntegrityError: {ie} for user_id {user_id}")
        raise
    except Exception as e:
        current_app.logger.error(f"Error admin updating user ID {user_id}: {e}")
        raise
    finally:
        if conn:
            conn.close()

def delete_user_by_admin(user_id):
    """Admin xóa người dùng. Cẩn thận không cho xóa chính mình hoặc admin cuối cùng."""
    conn = _get_db_connection()
    try:
        # Thêm logic kiểm tra nếu cần (ví dụ: không cho xóa user đang đăng nhập)
        # if int(user_id) == session.get('user_id'):
        #     raise ValueError("Không thể tự xóa tài khoản của chính mình.")

        cursor = conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        return cursor.rowcount > 0 
    except sqlite3.IntegrityError as ie: # Nếu user có booking liên quan và không có ON DELETE CASCADE/SET NULL
        current_app.logger.error(f"ADMIN User Delete - IntegrityError for user ID {user_id}: {ie}")
        raise ValueError(f"Không thể xóa người dùng ID {user_id} do có các dữ liệu liên quan (ví dụ: đặt chỗ).")
    except Exception as e:
        current_app.logger.error(f"Error admin deleting user ID {user_id}: {e}")
        raise
    finally:
        if conn:
            conn.close()