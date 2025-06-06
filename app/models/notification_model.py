# app/models/notification_model.py
import sqlite3
from flask import current_app
from datetime import datetime

def _get_db_connection():
    conn = sqlite3.connect(current_app.config['DATABASE_PATH'])
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def create_notification(data):
    conn = _get_db_connection()
    try:
        if not data.get('content'):
            raise ValueError("Nội dung thông báo là bắt buộc.")
        title = data.get('title', data['content'][:30] + '...')
        cursor = conn.execute(
            """
            INSERT INTO notifications (title, content, is_active, display_order)
            VALUES (?, ?, ?, ?)
            """,
            (
                title,
                data['content'],
                int(data.get('is_active', 1)),
                int(data.get('display_order', 0))
            )
        )
        conn.commit()
        return cursor.lastrowid
    except sqlite3.Error as e:
        if conn: conn.rollback()
        raise e
    finally:
        if conn: conn.close()

def get_all_notifications_admin():
    conn = _get_db_connection()
    try:
        items = conn.execute("SELECT * FROM notifications ORDER BY display_order ASC, id DESC").fetchall()
        return [dict(item) for item in items]
    except Exception as e:
        current_app.logger.error(f"Error fetching all notifications for admin: {e}", exc_info=True)
        return []
    finally:
        if conn: conn.close()

def get_active_notifications_client():
    conn = _get_db_connection()
    try:
        items = conn.execute(
            "SELECT title, content, link_url FROM notifications WHERE is_active = 1 ORDER BY display_order ASC, id DESC"
        ).fetchall()
        return [dict(item) for item in items]
    except Exception as e:
        current_app.logger.error(f"Error fetching active notifications for client: {e}", exc_info=True)
        return []
    finally:
        if conn: conn.close()

def get_notification_by_id(item_id):
    conn = _get_db_connection()
    try:
        item = conn.execute("SELECT * FROM notifications WHERE id = ?", (item_id,)).fetchone()
        return dict(item) if item else None
    finally:
        if conn: conn.close()

def update_notification(item_id, data):
    conn = _get_db_connection()
    try:
        fields_to_update = []
        params = []
        
        if 'content' in data:
            fields_to_update.append("content = ?")
            params.append(data['content'])
        if 'is_active' in data:
            fields_to_update.append("is_active = ?")
            params.append(int(data['is_active']))
        
        if not fields_to_update:
            return True

        params.append(datetime.now().isoformat())
        params.append(item_id)
        
        query = f"UPDATE notifications SET {', '.join(fields_to_update)}, updated_at = ? WHERE id = ?"
        cursor = conn.execute(query, tuple(params))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        if conn: conn.rollback()
        raise e
    finally:
        if conn: conn.close()

def delete_notification(item_id):
    conn = _get_db_connection()
    try:
        cursor = conn.execute("DELETE FROM notifications WHERE id = ?", (item_id,))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        if conn: conn.rollback()
        raise e
    finally:
        if conn: conn.close()