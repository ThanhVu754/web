# config.py
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a-different-demo-secret-key-for-instance'
    # DATABASE_PATH sẽ được cấu hình trong app/__init__.py để dùng app.instance_path
    DEBUG = True
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'app/static/uploads/menu_images')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}