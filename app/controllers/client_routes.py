# app/controllers/client_routes.py
from flask import Blueprint, request, jsonify, session, current_app, render_template
# Cập nhật import để bao gồm airport_model và flight_model
from app.models import client_model, airport_model, flight_model # <<< THÊM airport_model, flight_model
from werkzeug.security import check_password_hash
import re
from datetime import datetime # <<< THÊM datetime cho validation ngày

client_bp = Blueprint('client_bp', __name__,
                      template_folder='../templates/client',
                      url_prefix='/') # Giữ nguyên url_prefix này cho các trang HTML


# --- CÁC ROUTE PHỤC VỤ TRANG HTML CHO CLIENT (Giữ nguyên) ---
@client_bp.route('/')
@client_bp.route('/home')
# Sửa lại hàm home_page trong app/controllers/client_routes.py

# Đảm bảo đã import airport_model ở đầu file:
# from app.models import client_model, airport_model, flight_model

@client_bp.route('/')
@client_bp.route('/home')
def home_page():
    try:
        all_airports = airport_model.get_all_airports() # Lấy danh sách sân bay
    except Exception as e:
        current_app.logger.error(f"Lỗi khi lấy danh sách sân bay: {e}")
        all_airports = [] # Trả về danh sách rỗng nếu có lỗi

    return render_template(
        "client/home.html",
        flight_id=0,
        seat_class="Phổ thông",
        total_passengers=1,
        airports=all_airports # <<< Truyền danh sách sân bay vào template
    )

# ... (các route render_template khác như login_page, register_page, my_flights_page, e_menu_page, flight_services_page, online_checkin_page giữ nguyên) ...
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


# --- API AUTHENTICATION ROUTES (Giữ nguyên tiền tố /api/auth) ---
# ... (toàn bộ code cho register_api, login_api, logout_api, status_api giữ nguyên) ...
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

    if client_model.get_user_by_email(email):
        return jsonify({"success": False, "message": "Địa chỉ email này đã được đăng ký."}), 409

    user_id = client_model.create_user(full_name, email, password, phone_number)

    if user_id:
        return jsonify({"success": True, "message": "Đăng ký thành công!", "user_id": user_id}), 201
    else:
        return jsonify({"success": False, "message": "Đăng ký không thành công. Email hoặc số điện thoại có thể đã tồn tại hoặc có lỗi xảy ra."}), 500


@client_bp.route('/api/auth/login', methods=['POST'])
def login_api():
    # ... (code giữ nguyên) ...
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Dữ liệu không hợp lệ hoặc thiếu."}), 400

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"success": False, "message": "Email và mật khẩu không được để trống."}), 400

    user = client_model.get_user_by_email(email)

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
    # ... (code giữ nguyên) ...
    if 'user_id' in session:
        user = client_model.get_user_by_id(session['user_id'])
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

# --- PLACEHOLDER ROUTES CHO FORM ACTIONS (Giữ nguyên) ---
@client_bp.route('/tim-kiem-chuyen-bay-action', methods=['POST'])
def search_flights(): # Tên hàm này phải khớp với url_for('client_bp.search_flights')
    # ... (code giữ nguyên) ...
    if request.method == 'POST':
        origin = request.form.get('origin')
        destination = request.form.get('destination')
        current_app.logger.info(f"Form search_flights submitted (traditional POST): {request.form.to_dict()}")
        return jsonify({
            "message": "Yêu cầu tìm kiếm chuyến bay (POST truyền thống) đã được nhận. Sẽ được thay thế bằng AJAX.",
            "data": request.form.to_dict()
        })
    return "Đây là action tìm kiếm chuyến bay (GET). Form nên dùng POST.", 405


@client_bp.route('/dat-ve-action/<int:flight_id>', methods=['POST'])
def book_flight(flight_id): # Tên hàm này phải khớp với url_for('client_bp.book_flight')
    # ... (code giữ nguyên) ...
    if request.method == 'POST':
        passenger_name = request.form.get('full_name')
        current_app.logger.info(f"Form book_flight submitted for flight {flight_id} (traditional POST): {request.form.to_dict()}")
        return jsonify({
            "message": f"Yêu cầu đặt vé cho chuyến bay ID {flight_id} (POST truyền thống) đã được nhận. Sẽ được thay thế bằng AJAX.",
            "flight_id": flight_id,
            "data": request.form.to_dict()
        })
    return f"Đây là action đặt vé cho chuyến bay {flight_id} (GET). Form nên dùng POST.", 405


# --- API TÌM KIẾM CHUYẾN BAY ---
@client_bp.route('/api/flights/search', methods=['POST'])
def search_flights_api():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Dữ liệu tìm kiếm không hợp lệ."}), 400

    # Lấy các tham số từ JSON request body
    # Giả sử frontend gửi mã IATA cho điểm đi/đến, ví dụ: 'SGN', 'HAN'
    origin_iata = data.get('origin_iata')
    destination_iata = data.get('destination_iata')
    departure_date_str = data.get('departure_date') # Mong đợi dạng 'YYYY-MM-DD'
    # trip_type = data.get('trip_type', 'oneway') # 'oneway' hoặc 'roundtrip'
    # return_date_str = data.get('return_date') # Cần nếu là 'roundtrip'
    passengers = int(data.get('passengers', 1))
    seat_class = data.get('seat_class', 'Phổ thông')

    # Validation cơ bản
    if not all([origin_iata, destination_iata, departure_date_str]):
        return jsonify({"success": False, "message": "Vui lòng cung cấp điểm đi, điểm đến và ngày khởi hành."}), 400

    try:
        # Kiểm tra định dạng ngày
        datetime.strptime(departure_date_str, '%Y-%m-%d')
    except ValueError:
        return jsonify({"success": False, "message": "Định dạng ngày khởi hành không hợp lệ. Vui lòng sử dụng YYYY-MM-DD."}), 400

    # Lấy ID sân bay từ mã IATA
    origin_airport_id = airport_model.get_airport_id_by_iata_code(origin_iata.upper())
    destination_airport_id = airport_model.get_airport_id_by_iata_code(destination_iata.upper())

    if not origin_airport_id:
        return jsonify({"success": False, "message": f"Không tìm thấy sân bay với mã {origin_iata}."}), 400
    if not destination_airport_id:
        return jsonify({"success": False, "message": f"Không tìm thấy sân bay với mã {destination_iata}."}), 400
    if origin_airport_id == destination_airport_id:
        return jsonify({"success": False, "message": "Điểm đi và điểm đến không được trùng nhau."}), 400


    # Gọi hàm tìm kiếm từ flight_model
    try:
        flights = flight_model.search_flights(
            origin_airport_id,
            destination_airport_id,
            departure_date_str,
            passengers,
            seat_class
        )
        
        if not flights:
             return jsonify({"success": True, "message": "Không tìm thấy chuyến bay nào phù hợp.", "flights": []}), 200

        return jsonify({"success": True, "flights": flights}), 200
        
    except Exception as e:
        current_app.logger.error(f"Lỗi khi tìm kiếm chuyến bay: {e}")
        return jsonify({"success": False, "message": "Đã có lỗi xảy ra phía server khi tìm kiếm chuyến bay."}), 500


# --- CÁC API KHÁC CỦA CLIENT SẼ ĐƯỢC ĐỊNH NGHĨA Ở ĐÂY SAU ---
# Ví dụ:
# @client_bp.route('/api/airports', methods=['GET'])
# def get_airports_api():
#     airports = airport_model.get_all_airports()
#     return jsonify({"success": True, "airports": airports})

# @client_bp.route('/api/bookings', methods=['POST'])
# def create_booking_api():
#     # Logic tạo đặt chỗ thực sự, trả về JSON
#     pass