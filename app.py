# app.py (ở thư mục gốc)
from app import create_app # Import hàm create_app từ package 'app' (tức là từ file app/__init__.py)

# Tạo instance của ứng dụng Flask bằng cách gọi hàm create_app()
# Biến 'app' này sẽ được Flask CLI tìm kiếm nếu bạn sử dụng các lệnh như 'flask run' (mặc dù chúng ta đã có cách chạy trực tiếp)
app = create_app()

if __name__ == '__main__':
    # Dòng này cho phép bạn chạy ứng dụng trực tiếp bằng lệnh 'python app.py'
    # Chế độ debug sẽ được lấy từ file config (app.config.get('DEBUG', True))
    # host='0.0.0.0' cho phép truy cập từ các máy khác trong cùng mạng
    # port=5000 là cổng mặc định của Flask
    app.run(debug=app.config.get('DEBUG', True), host='0.0.0.0', port=5000)