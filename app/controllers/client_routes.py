# app/controllers/client_routes.py
from flask import Blueprint, request, jsonify, session, current_app, render_template # Đã có render_template
from app.models import client_model # Đã đổi tên từ user_model
from werkzeug.security import check_password_hash
import re

client_bp = Blueprint('client_bp', __name__,
                      template_folder='../templates/client',
                      url_prefix='/')


# --- CÁC ROUTE PHỤC VỤ TRANG HTML CHO CLIENT (Giữ nguyên như bước trước) ---
@client_bp.route('/')
@client_bp.route('/home')
def home_page():
    # Cung cấp một flight_id giả (ví dụ: 0) để url_for có thể xây dựng URL ban đầu.
    # JavaScript sau này sẽ cập nhật flight_id thực tế khi người dùng chọn chuyến bay,
    # hoặc sẽ bỏ qua hoàn toàn action của form để gọi API trực tiếp.
    # Các giá trị khác như seat_class, total_passengers cũng có thể cần giá trị mặc định.
    return render_template(
        "client/home.html", 
        flight_id=0,  # <<<< THAY ĐỔI Ở ĐÂY (từ None thành 0 hoặc một số nguyên giả khác)
        seat_class="Phổ thông", # Giá trị mặc định ví dụ
        total_passengers=1      # Giá trị mặc định ví dụ
    )

@client_bp.route('/dang-nhap')
def login_page():
    return render_template("client/dang_nhap.html")

@client_bp.route('/dang-ky')
def register_page():
    return render_template("client/dang_ki.html")

@client_bp.route('/chuyen-bay-cua-toi')
def my_flights_page():
    return render_template("client/my_flights.html")

@client_bp.route('/e-menu')
def e_menu_page():
    return render_template("client/e_menu.html")

@client_bp.route('/dich-vu-chuyen-bay')
def flight_services_page():
    return render_template("client/flight_services.html")

@client_bp.route('/check-in-online')
def online_checkin_page():
    return render_template("client/online_checkin.html")


# --- API AUTHENTICATION ROUTES (Giữ nguyên như bước trước, với tên hàm đã đổi) ---
EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

@client_bp.route('/api/auth/register', methods=['POST'])
def register_api():
    # ... (code giữ nguyên) ...
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Dữ liệu không hợp lệ hoặc thiếu."}), 400

    full_name = data.get('full_name')
    email = data.get('email')
    password = data.get('password')
    phone_number = data.get('phone_number')

    if not full_name or not email or not password:
        return jsonify({"success": False, "message": "Họ tên, email và mật khẩu không được để trống."}), 400
    
    if not re.match(EMAIL_REGEX, email):
        return jsonify({"success": False, "message": "Địa chỉ email không hợp lệ."}), 400
        
    if len(password) < 6:
        return jsonify({"success": False, "message": "Mật khẩu phải có ít nhất 6 ký tự."}), 400

    if client_model.get_user_by_email(email): # Đã sửa thành client_model
        return jsonify({"success": False, "message": "Địa chỉ email này đã được đăng ký."}), 409

    user_id = client_model.create_user(full_name, email, password, phone_number) # Đã sửa

    if user_id:
        return jsonify({"success": True, "message": "Đăng ký thành công!", "user_id": user_id}), 201
    else:
        return jsonify({"success": False, "message": "Đăng ký không thành công. Email hoặc số điện thoại có thể đã tồn tại hoặc có lỗi xảy ra."}), 500


@client_bp.route('/api/auth/login', methods=['POST'])
def login_api():
    # ... (code giữ nguyên, sử dụng client_model) ...
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Dữ liệu không hợp lệ hoặc thiếu."}), 400

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"success": False, "message": "Email và mật khẩu không được để trống."}), 400

    user = client_model.get_user_by_email(email) # Đã sửa

    if user and check_password_hash(user['password_hash'], password):
        session.clear()
        session['user_id'] = user['id']
        session['user_role'] = user['role']
        return jsonify({
            "success": True, 
            "message": "Đăng nhập thành công!",
            "user": {
                "id": user['id'],
                "full_name": user['full_name'],
                "email": user['email'],
                "role": user['role']
            }
        }), 200
    else:
        return jsonify({"success": False, "message": "Email hoặc mật khẩu không chính xác."}), 401

@client_bp.route('/api/auth/logout', methods=['POST'])
def logout_api():
    # ... (code giữ nguyên) ...
    session.clear()
    return jsonify({"success": True, "message": "Đăng xuất thành công."}), 200

@client_bp.route('/api/auth/status', methods=['GET'])
def status_api():
    # ... (code giữ nguyên, sử dụng client_model) ...
    if 'user_id' in session:
        user = client_model.get_user_by_id(session['user_id']) # Đã sửa
        if user:
            return jsonify({
                "logged_in": True,
                "user": {
                    "id": user['id'],
                    "full_name": user['full_name'],
                    "email": user['email'],
                    "role": user['role']
                }
            }), 200
        else:
            session.clear()
            return jsonify({"logged_in": False, "message": "Session không hợp lệ, vui lòng đăng nhập lại."}), 401
    return jsonify({"logged_in": False}), 200

# --- PLACEHOLDER ROUTES CHO FORM ACTIONS ĐỂ TRÁNH BUILDERROR ---
@client_bp.route('/tim-kiem-chuyen-bay-action', methods=['POST']) # URL này có thể khác với tên endpoint
def search_flights(): # Tên hàm này phải khớp với url_for('client_bp.search_flights')
    if request.method == 'POST':
        # Lấy dữ liệu form (ví dụ)
        origin = request.form.get('origin')
        destination = request.form.get('destination')
        departure_date = request.form.get('departure_date')
        # ... lấy các trường khác ...

        # Đây là xử lý tạm thời. Sau này JavaScript sẽ gọi API /api/flights/search
        # Bạn có thể redirect hoặc render một trang kết quả tạm thời nếu muốn
        # Hoặc đơn giản là trả về JSON để xác nhận form đã được nhận (nếu front-end không xử lý chặn submit)
        current_app.logger.info(f"Form search_flights submitted (traditional POST): {request.form.to_dict()}")
        return jsonify({
            "message": "Yêu cầu tìm kiếm chuyến bay (POST truyền thống) đã được nhận. Sẽ được thay thế bằng AJAX.",
            "data": request.form.to_dict()
        })
    # GET request đến URL này (nếu có) sẽ không làm gì nhiều cho POST-based form
    return "Đây là action tìm kiếm chuyến bay (GET). Form nên dùng POST.", 405


@client_bp.route('/dat-ve-action/<int:flight_id>', methods=['POST']) # URL này có thể khác với tên endpoint
def book_flight(flight_id): # Tên hàm này phải khớp với url_for('client_bp.book_flight')
    if request.method == 'POST':
        # Lấy dữ liệu form
        passenger_name = request.form.get('full_name')
        # ... lấy các trường khác ...
        
        # Xử lý tạm thời. Sau này JavaScript sẽ gọi API /api/bookings
        current_app.logger.info(f"Form book_flight submitted for flight {flight_id} (traditional POST): {request.form.to_dict()}")
        return jsonify({
            "message": f"Yêu cầu đặt vé cho chuyến bay ID {flight_id} (POST truyền thống) đã được nhận. Sẽ được thay thế bằng AJAX.",
            "flight_id": flight_id,
            "data": request.form.to_dict()
        })
    return f"Đây là action đặt vé cho chuyến bay {flight_id} (GET). Form nên dùng POST.", 405


# --- CÁC API THỰC SỰ CHO CLIENT SẼ ĐƯỢC ĐỊNH NGHĨA Ở ĐÂY SAU ---
# Ví dụ:
# @client_bp.route('/api/flights/search', methods=['POST'])
# def search_flights_api():
#     # Logic tìm kiếm chuyến bay thực sự, trả về JSON
#     pass

# @client_bp.route('/api/bookings', methods=['POST'])
# def create_booking_api():
#     # Logic tạo đặt chỗ thực sự, trả về JSON
#     pass