# app/__init__.py
import os
import sqlite3
from flask import Flask, session, request # Đã thêm request ở một bước trước, giữ lại nếu decorator admin_required dùng

def create_app(test_config=None):
    # Tạo và cấu hình ứng dụng Flask
    # instance_relative_config=True cho phép load config từ thư mục instance
    app = Flask(__name__, instance_relative_config=True) 

    # Load config mặc định từ object Config trong file config.py ở thư mục gốc
    app.config.from_object('config.Config') 

    if test_config is None:
        # Load config từ instance/config.py (nếu tồn tại) khi không test
        # File này có thể override các giá trị từ config.Config
        app.config.from_pyfile('config.py', silent=True) 
    else:
        # Load test config nếu được truyền vào
        app.config.from_mapping(test_config)

    # Đảm bảo thư mục instance tồn tại
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        pass # Bỏ qua nếu không tạo được

    # Cấu hình đường dẫn database vào trong thư mục instance
    # (nếu chưa được override bởi instance/config.py)
    if 'DATABASE_PATH' not in app.config:
        app.config['DATABASE_PATH'] = os.path.join(app.instance_path, 'sangair.sqlite')
    
    # Tự động khởi tạo database nếu file chưa tồn tại
    db_path = app.config['DATABASE_PATH']
    # app.root_path là đường dẫn đến thư mục package 'app' (tức là your_project_root/app/)
    # schema.sql nằm ở thư mục gốc (your_project_root/schema.sql)
    schema_path = os.path.join(app.root_path, '../schema.sql') 

    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}. Initializing new database...")
        conn = None
        try:
            # Đảm bảo thư mục cha của db_path tồn tại (quan trọng nếu db_path nằm trong instance folder)
            db_dir = os.path.dirname(db_path)
            if db_dir: 
                 os.makedirs(db_dir, exist_ok=True)

            conn = sqlite3.connect(db_path)
            with open(schema_path, 'r', encoding='utf-8') as f:
                conn.executescript(f.read())
            conn.commit()
            print(f"Database initialized successfully at {db_path} from {schema_path}")
        except sqlite3.Error as e: # Bắt lỗi cụ thể của SQLite
            print(f"SQLite error during auto database initialization: {e}")
        except FileNotFoundError:
            print(f"Schema file not found at {schema_path}. Cannot auto-initialize database.")
        except Exception as e: # Bắt các lỗi khác
            print(f"An unexpected error occurred during auto database initialization: {e}")
        finally:
            if conn:
                conn.close()
    
    # Đăng ký Blueprints
    from .controllers import client_routes # Import client_routes từ package controllers cùng cấp
    app.register_blueprint(client_routes.client_bp)

    from .controllers import admin_routes # Import admin_routes từ package controllers cùng cấp
    app.register_blueprint(admin_routes.admin_bp) # Đăng ký admin_bp (đã có url_prefix='/admin' trong định nghĩa)

    # Đảm bảo thư mục upload tồn tại
    try:
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    except OSError:
        pass
    
    # (Tùy chọn) Route kiểm tra đơn giản
    @app.route('/hello')
    def hello():
        user_id = session.get('user_id')
        user_role = session.get('user_role')
        if user_id:
            return f'Hello from SangAir! User ID: {user_id}, Role: {user_role}'
        return 'Hello from SangAir! Bạn chưa đăng nhập.'

    return app