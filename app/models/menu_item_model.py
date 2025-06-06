# app/models/menu_item_model.py
import sqlite3
from flask import current_app
from datetime import datetime

def _get_db_connection():
    conn = sqlite3.connect(current_app.config['DATABASE_PATH'])
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def create_menu_item(item_data):
    """
    Tạo một menu item mới.
    item_data là một dict chứa: name, category, description, price_vnd, 
                                price_usd, image_url, is_available, display_order.
    """
    conn = _get_db_connection()
    try:
        # Kiểm tra các trường bắt buộc (ví dụ: name, category, price_vnd)
        if not item_data.get('name') or not item_data.get('category') or item_data.get('price_vnd') is None:
            raise ValueError("Tên món, danh mục và giá VND là bắt buộc.")

        cursor = conn.execute(
            """
            INSERT INTO menu_items (name, description, category, price_vnd, price_usd, 
                                    image_url, is_available, display_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
            """,
            (
                item_data['name'],
                item_data.get('description'),
                item_data['category'],
                float(item_data['price_vnd']),
                float(item_data.get('price_usd')) if item_data.get('price_usd') is not None else None,
                item_data.get('image_url'),
                int(item_data.get('is_available', 1)), # Mặc định là available
                int(item_data.get('display_order', 0)) # Mặc định display_order là 0
            )
        )
        conn.commit()
        return cursor.lastrowid
    except sqlite3.IntegrityError as ie: # Bắt lỗi UNIQUE constraint (ví dụ: trùng tên món)
        current_app.logger.error(f"MODEL: IntegrityError creating menu item - {ie}. Data: {item_data}")
        if "menu_items.name" in str(ie).lower():
            raise ValueError(f"Tên món '{item_data.get('name')}' đã tồn tại.")
        else:
            raise ValueError(f"Lỗi ràng buộc cơ sở dữ liệu: {ie}")
    except ValueError as ve: # Bắt lỗi từ float() hoặc int() hoặc validation ở trên
        current_app.logger.error(f"MODEL: ValueError creating menu item - {ve}. Data: {item_data}")
        raise
    except Exception as e:
        current_app.logger.error(f"MODEL: Unexpected error creating menu item - {e}. Data: {item_data}", exc_info=True)
        if conn: conn.rollback() # Đảm bảo rollback nếu có lỗi khác
        raise
    finally:
        if conn:
            conn.close()

def get_all_menu_items_admin(search_term=None, category_filter=None):
    """
    Lấy danh sách tất cả các menu items cho admin, có tìm kiếm và lọc.
    """
    conn = _get_db_connection()
    items_list = []
    try:
        query_params = []
        base_query = "SELECT * FROM menu_items" # Lấy tất cả các cột
        conditions = []

        if search_term:
            like_term = f"%{search_term}%"
            conditions.append("(name LIKE ? OR description LIKE ?)") # Tìm theo tên hoặc mô tả
            query_params.extend([like_term, like_term])
        
        if category_filter:
            conditions.append("category = ?")
            query_params.append(category_filter)

        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)
        
        base_query += " ORDER BY display_order ASC, name ASC"
        
        current_app.logger.info(f"Admin fetching all menu items. Query: {base_query}, Params: {query_params}")
        cursor = conn.execute(base_query, tuple(query_params))
        raw_items = cursor.fetchall()
        for row in raw_items:
            items_list.append(dict(row))
        return items_list
    except Exception as e:
        current_app.logger.error(f"Error fetching all menu items for admin: {e}", exc_info=True)
        return []
    finally:
        if conn:
            conn.close()

def get_menu_item_by_id(item_id):
    """
    Lấy chi tiết một menu item bằng ID.
    """
    conn = _get_db_connection()
    try:
        item = conn.execute("SELECT * FROM menu_items WHERE id = ?", (item_id,)).fetchone()
        return dict(item) if item else None
    except Exception as e:
        current_app.logger.error(f"Error fetching menu item by ID {item_id}: {e}", exc_info=True)
        return None
    finally:
        if conn:
            conn.close()

def update_menu_item(item_id, item_data):
    """
    Cập nhật thông tin một menu item.
    item_data là một dict chứa các trường cần cập nhật.
    """
    conn = _get_db_connection()
    try:
        fields_to_update_sql = []
        params = []
        
        possible_fields = ['name', 'description', 'category', 'price_vnd', 'price_usd', 
                           'image_url', 'is_available', 'display_order']

        for field in possible_fields:
            if field in item_data: # Chỉ cập nhật nếu trường đó có trong item_data
                if item_data[field] is not None or field in ['description', 'image_url', 'price_usd']: # Cho phép một số trường có thể là NULL/rỗng
                    fields_to_update_sql.append(f"{field} = ?")
                    value = item_data[field]
                    if field in ['price_vnd', 'price_usd'] and value is not None:
                        value = float(value)
                    elif field in ['is_available', 'display_order'] and value is not None:
                        value = int(value)
                    params.append(value)
        
        if not fields_to_update_sql:
            return True # Không có gì để cập nhật

        params.append(datetime.now().isoformat()) # Cho updated_at
        params.append(item_id)
        
        query = f"UPDATE menu_items SET {', '.join(fields_to_update_sql)}, updated_at = ? WHERE id = ?"
        current_app.logger.debug(f"Executing update menu_item query: {query} with params: {tuple(params)}")
        
        cursor = conn.execute(query, tuple(params))
        conn.commit()
        return cursor.rowcount > 0
    except sqlite3.IntegrityError as ie:
        current_app.logger.error(f"MODEL: IntegrityError updating menu item {item_id} - {ie}. Data: {item_data}")
        if "menu_items.name" in str(ie).lower():
            raise ValueError(f"Tên món '{item_data.get('name')}' đã tồn tại.")
        else:
            raise ValueError(f"Lỗi ràng buộc cơ sở dữ liệu: {ie}")
    except ValueError as ve:
        current_app.logger.error(f"MODEL: ValueError updating menu item {item_id} - {ve}. Data: {item_data}")
        raise
    except Exception as e:
        current_app.logger.error(f"MODEL: Unexpected error updating menu item {item_id} - {e}. Data: {item_data}", exc_info=True)
        if conn: conn.rollback()
        raise
    finally:
        if conn:
            conn.close()

def delete_menu_item(item_id):
    """
    Xóa một menu item.
    Cần cẩn thận nếu có ràng buộc khóa ngoại từ bảng booking_menu_items.
    Schema hiện tại có ON DELETE RESTRICT cho booking_menu_items.menu_item_id.
    """
    conn = _get_db_connection()
    try:
        conn.execute("PRAGMA foreign_keys = ON;")
        cursor = conn.execute("DELETE FROM menu_items WHERE id = ?", (item_id,))
        conn.commit()
        return cursor.rowcount > 0
    except sqlite3.IntegrityError as ie:
        current_app.logger.error(f"MODEL: Cannot delete menu item ID {item_id} due to existing bookings: {ie}")
        raise ValueError(f"Không thể xóa món ID {item_id} vì đã có trong các đặt chỗ của khách. Bạn có thể đánh dấu là 'Không khả dụng' thay vì xóa.")
    except Exception as e:
        current_app.logger.error(f"MODEL: Error deleting menu item ID {item_id}: {e}", exc_info=True)
        if conn: conn.rollback()
        raise
    finally:
        if conn:
            conn.close()