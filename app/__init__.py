# app/__init__.py
import os
import sqlite3 # Cần import sqlite3 ở đây
from flask import Flask, session, current_app # current_app có thể không cần nếu không log trong phần init DB

def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object('config.Config') # Tải từ config.py gốc

    if test_config is None:
        # Tải từ instance/config.py (nếu có và nếu bạn muốn override)
        app.config.from_pyfile('config.py', silent=True)
    else:
        app.config.from_mapping(test_config)

    # Đảm bảo thư mục instance tồn tại
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        pass # Bỏ qua nếu không tạo được

    # Cấu hình đường dẫn database vào trong thư mục instance (nếu chưa được override)
    if 'DATABASE_PATH' not in app.config:
        app.config['DATABASE_PATH'] = os.path.join(app.instance_path, 'sangair.sqlite')

    # --- TỰ ĐỘNG KHỞI TẠO DATABASE NẾU CHƯA CÓ ---
    # Logic này sẽ chạy một lần khi app được tạo, nếu file DB chưa tồn tại
    # Nó cần được đặt trong app_context để sử dụng current_app nếu các hàm bên trong cần
    # Hoặc truyền app object trực tiếp
    
    # Để đơn giản và tránh phụ thuộc current_app sớm, ta có thể dùng app.config trực tiếp
    db_path = app.config['DATABASE_PATH']
    schema_path = os.path.join(app.root_path, '../schema.sql') # app.root_path là thư mục 'app', đi ra 1 cấp để lấy schema.sql

    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}. Initializing new database...")
        conn = None
        try:
            # Đảm bảo thư mục chứa db_path tồn tại (quan trọng nếu db_path nằm trong instance folder)
            db_dir = os.path.dirname(db_path)
            if db_dir: # Nếu db_path có thư mục cha (không phải file ở root)
                 os.makedirs(db_dir, exist_ok=True)

            conn = sqlite3.connect(db_path)
            with open(schema_path, 'r', encoding='utf-8') as f:
                conn.executescript(f.read())
            conn.commit()
            print(f"Database initialized successfully at {db_path} from {schema_path}")
        except sqlite3.Error as e:
            print(f"SQLite error during auto database initialization: {e}")
        except FileNotFoundError:
            print(f"Schema file not found at {schema_path}. Cannot auto-initialize database.")
        except Exception as e:
            print(f"An unexpected error occurred during auto database initialization: {e}")
        finally:
            if conn:
                conn.close()
    # ---------------------------------------------

    from app.controllers import client_routes
    app.register_blueprint(client_routes.client_bp)

    @app.route('/hello')
    def hello():
        user_id = session.get('user_id')
        user_role = session.get('user_role')
        if user_id:
            return f'Chào mừng đến với SangAir Backend Demo! User ID: {user_id}, Role: {user_role}'
        return 'Chào mừng đến với SangAir Backend Demo! Bạn chưa đăng nhập.'

    return app