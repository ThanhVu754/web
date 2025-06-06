# app/controllers/client_routes.py
from flask import Blueprint, request, jsonify, session, current_app, render_template, redirect, url_for
# Cập nhật import để bao gồm airport_model và flight_model
from app.models import client_model, airport_model, flight_model # <<< THÊM airport_model, flight_model
from werkzeug.security import check_password_hash
import re
import sqlite3
from datetime import datetime
from app.models import booking_model

client_bp = Blueprint('client_bp', __name__,
                      template_folder='../templates/',
                      url_prefix='/') # Giữ nguyên url_prefix này cho các trang HTML

@client_bp.route('/')
@client_bp.route('/home')
def home_page():
    current_user_name = None
    if 'user_id' in session:
        user = client_model.get_user_by_id(session['user_id']) # Giả sử client_model là tên đúng
        if user:
            current_user_name = user['full_name']
    
    airports_list = [] # Khởi tạo danh sách rỗng
    try:
        # Gọi hàm lấy TẤT CẢ sân bay từ model của bạn
        airports_list = airport_model.get_all_airports() 
        if not airports_list: # Nếu không có sân bay nào từ CSDL
            current_app.logger.warning("Không có dữ liệu sân bay nào được tải từ CSDL cho trang chủ.")
    except Exception as e:
        current_app.logger.error(f"Lỗi khi lấy danh sách sân bay cho trang chủ: {e}")
        # airports_list vẫn sẽ là rỗng
    return render_template(
        "client/home.html", # Đường dẫn đến template home của client
        flight_id=0, 
        seat_class="Phổ thông",
        total_passengers=1,
        # Truyền cùng một danh sách cho cả hai dropdown hoặc hai danh sách riêng nếu bạn dùng
        # get_distinct_departure_airports và get_distinct_arrival_airports
        airports=airports_list, # <<< TRUYỀN BIẾN NÀY CHO TEMPLATE
        # Hoặc nếu bạn dùng 2 list riêng:
        # departure_airports=departure_airports_list, 
        # arrival_airports=arrival_airports_list,
        current_user_name=current_user_name
    )

# ... (các route render_template khác như login_page, register_page, my_flights_page, e_menu_page, flight_services_page, online_checkin_page giữ nguyên) ...
@client_bp.route('/dang-nhap') # URL này sẽ được cả client và admin dùng để đến trang đăng nhập
def login_page():
    # Nếu người dùng đã đăng nhập, kiểm tra role và redirect
    if 'user_id' in session:
        user_role = session.get('user_role')
        if user_role == 'admin':
            return redirect(url_for('admin_bp.dashboard_page')) # Chuyển admin về dashboard của họ
        else: # 'client' hoặc role khác
            return redirect(url_for('client_bp.home_page')) # Chuyển client về trang chủ
    return render_template("auth/dang_nhap.html") # <<< THAY ĐỔI ĐƯỜNG DẪN

@client_bp.route('/dang-ky') # URL này chỉ client sử dụng
def register_page():
    # Nếu người dùng đã đăng nhập, chuyển về trang chủ
    if 'user_id' in session:
        return redirect(url_for('client_bp.home_page'))
    return render_template("auth/dang_ki.html") # <<< THAY ĐỔI ĐƯỜNG DẪN

# Route đăng xuất dùng chung cho cả client và admin (nếu admin dùng link này)
@client_bp.route('/logout')
def logout_user():
    session.clear()
    return redirect(url_for('client_bp.home_page'))

@client_bp.route('/chuyen-bay-cua-toi')
def my_flights_page():
    if 'user_id' not in session: # Kiểm tra trực tiếp user_id trong session
        # flash("Vui lòng đăng nhập để xem chuyến bay của bạn.", "warning") # Tùy chọn
        return redirect(url_for('client_bp.login_page', next=request.url)) # Chuyển hướng đến trang đăng nhập

    # Nếu đã đăng nhập, tiếp tục xử lý bình thường
    current_user_name = "Khách" 
    user = client_model.get_user_by_id(session['user_id']) # client_model cần được import
    if user:
        current_user_name = user['full_name']
    
    # Logic để lấy và hiển thị các chuyến bay của tôi sẽ được thêm vào đây sau
    # (ví dụ: gọi API /api/my-bookings từ JavaScript trên trang my_flights.html)
    return render_template("client/my_flights.html", current_user_name=current_user_name)

@client_bp.route('/change-flight-action-placeholder', methods=['POST', 'GET']) # Đặt một URL tạm thời
def change_flight(): # Tên hàm này phải khớp với url_for('client_bp.change_flight')
    # Đây là xử lý tạm thời để tránh BuildError.
    # Logic đổi chuyến bay thực sự sẽ phức tạp và thường do JavaScript gọi API.
    if request.method == 'POST':
        # Xử lý dữ liệu form nếu cần (ví dụ: booking_pnr, new_departure_date)
        # booking_pnr = request.form.get('booking_pnr_for_change') # Nếu có input này trong form
        new_date = request.form.get('new_departure_date')
        current_app.logger.info(f"Yêu cầu đổi chuyến bay nhận được (POST). Ngày mới: {new_date}")
        # flash("Chức năng đổi chuyến bay đang được phát triển.", "info")
        # return redirect(url_for('client_bp.my_flights_page')) # Hoặc trả về JSON nếu JS xử lý
        return jsonify({"success": False, "message": f"Chức năng đổi chuyến bay (POST) cho ngày {new_date} đang được phát triển."}), 501 # Not Implemented
    
    # Nếu là GET, có thể là người dùng truy cập trực tiếp URL (ít khả năng với form action)
    # flash("Trang đổi chuyến bay đang được phát triển.", "info")
    # return redirect(url_for('client_bp.my_flights_page'))
    return jsonify({"message": "Chức năng đổi chuyến bay (GET) đang được phát triển."}), 501 # Not Implemented

# Tương tự, nếu bạn có url_for('client_bp.add_service') trong my_flights.html cho form add_service_form_vj
# bạn cũng cần một route placeholder cho nó.
@client_bp.route('/add-service-action-placeholder', methods=['POST', 'GET'])
def add_service():
    if request.method == 'POST':
        return jsonify({"success": False, "message": "Chức năng thêm dịch vụ (POST) đang được phát triển."}), 501
    return jsonify({"message": "Chức năng thêm dịch vụ (GET) đang được phát triển."}), 501

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
    data = request.get_json()
    # ... (validation input như cũ: full_name, email, password, phone_number) ...
    if not data:
        return jsonify({"success": False, "message": "Dữ liệu không hợp lệ hoặc thiếu."}), 400

    full_name = data.get('full_name')
    email = data.get('email')
    password = data.get('password')
    phone_number = data.get('phone_number')

    if not full_name or not email or not password:
        return jsonify({"success": False, "message": "Họ tên, email và mật khẩu không được để trống."}), 400

    # ... (các validation khác cho email, password length) ...
    if not re.match(EMAIL_REGEX, email): # Đảm bảo EMAIL_REGEX đã được định nghĩa
        return jsonify({"success": False, "message": "Địa chỉ email không hợp lệ."}), 400
    if len(password) < 6:
        return jsonify({"success": False, "message": "Mật khẩu phải có ít nhất 6 ký tự."}), 400

    if client_model.get_user_by_email(email): # Đảm bảo client_model đã được import
        return jsonify({"success": False, "message": "Địa chỉ email này đã được đăng ký."}), 409

    # Gọi hàm create_user đã được cập nhật
    user_id = client_model.create_user(full_name, email, password, phone_number) 

    if user_id:
        return jsonify({"success": True, "message": "Đăng ký thành công!", "user_id": user_id}), 201
    else:
        return jsonify({"success": False, "message": "Đăng ký không thành công. Email hoặc số điện thoại có thể đã tồn tại hoặc có lỗi xảy ra."}), 500


@client_bp.route('/api/auth/login', methods=['POST'])
def login_api():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Dữ liệu không hợp lệ hoặc thiếu."}), 400

    email = data.get('email')
    password = data.get('password')
    current_app.logger.info(f"Login attempt for email: {email}")

    if not email or not password:
        return jsonify({"success": False, "message": "Email và mật khẩu không được để trống."}), 400

    user = client_model.get_user_by_email(email) # Đảm bảo client_model đã được import

    if user:
        # SỬA ĐỔI Ở DÒNG LOGGING NÀY:
        # Kiểm tra xem 'status' có trong các keys của user (sqlite3.Row) không trước khi truy cập
        status_info = user['status'] if 'status' in user.keys() else 'N/A (status column not found)'
        current_app.logger.info(f"User found: {user['email']}. Stored hash: {user['password_hash']}. Status: {status_info}")
        
        # KIỂM TRA TRẠNG THÁI TÀI KHOẢN TRƯỚC KHI KIỂM TRA MẬT KHẨU
        # Đảm bảo cột 'status' tồn tại trong bảng users và được trả về bởi get_user_by_email
        if 'status' in user.keys(): # Kiểm tra xem có cột status không
            if user['status'] == 'locked':
                current_app.logger.warning(f"Login failed: Account for email {email} is locked.")
                return jsonify({"success": False, "message": "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên."}), 403
            
            if user['status'] == 'pending':
                current_app.logger.warning(f"Login failed: Account for email {email} is pending activation.")
                return jsonify({"success": False, "message": "Tài khoản của bạn đang chờ kích hoạt."}), 403
        else:
            # Xử lý trường hợp không có cột status, có thể coi là active hoặc báo lỗi tùy logic
            current_app.logger.warning(f"User {email} status column not found, assuming active for login attempt.")


        password_matches = check_password_hash(user['password_hash'], password)
        current_app.logger.info(f"Password match result for {email}: {password_matches}")

        if password_matches:
            session.clear()
            session['user_id'] = user['id']
            session['user_role'] = user['role']
            current_app.logger.info(f"User {user['email']} (ID: {user['id']}, Role: {user['role']}) logged in successfully.")
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
            current_app.logger.warning(f"Password mismatch for email: {email}")
            return jsonify({"success": False, "message": "Email hoặc mật khẩu không chính xác."}), 401
    else:
        current_app.logger.warning(f"Login failed: User not found for email: {email}")
        return jsonify({"success": False, "message": "Email hoặc mật khẩu không chính xác."}), 401

@client_bp.route('/api/auth/logout', methods=['POST'])
def logout_api():
    session.clear()
    return jsonify({"success": True, "message": "Đăng xuất thành công."}), 200


# Trong app/controllers/client_routes.py
from flask import redirect, url_for

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
    departure_date_str = data.get('departure_date')
    passengers = int(data.get('passengers', 1))
    seat_class = data.get('seat_class', 'Phổ thông')
    search_day_range = int(data.get('search_day_range', 7))

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
            seat_class,
            search_day_range # <<< Truyền tham số mới
        )
        
        if not flights: # flights có thể là list rỗng nếu không tìm thấy
             return jsonify({"success": True, "message": "Không tìm thấy chuyến bay nào phù hợp.", "flights": []}), 200

        return jsonify({"success": True, "flights": flights}), 200
        
    except Exception as e:
        current_app.logger.error(f"Lỗi khi tìm kiếm chuyến bay: {e}")
        return jsonify({"success": False, "message": "Đã có lỗi xảy ra phía server khi tìm kiếm chuyến bay."}), 500

# app/controllers/client_routes.py
# ... (import sqlite3, current_app, các model, ...)

@client_bp.route('/api/bookings', methods=['POST'])
def create_booking_api():
    data = request.get_json()
    current_app.logger.info(f"API Create Booking - Received RAW data: {data}")
    if not data:
        return jsonify({"success": False, "message": "Dữ liệu không hợp lệ hoặc thiếu (no data)."}), 400

    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "Vui lòng đăng nhập để đặt vé."}), 401

    # Lấy dữ liệu từ JSON request, sử dụng key mà JS gửi lên
    flight_id = data.get('flight_id')
    passengers_data_list = data.get('passengers_data') # JS gửi 'passengers_data'
    seat_class_value = data.get('seat_class_booked')   # JS gửi 'seat_class_booked'
    payment_method_val = data.get('payment_method')
    
    num_adults_val = data.get('num_adults')
    num_children_val = data.get('num_children')
    num_infants_val = data.get('num_infants')

    current_app.logger.info(
        f"API Create Booking - Parsed values: flight_id={flight_id}, "
        f"passengers_data_list_exists={passengers_data_list is not None}, "
        f"seat_class_booked={seat_class_value}, payment_method={payment_method_val}, "
        f"num_adults={num_adults_val}, num_children={num_children_val}, num_infants={num_infants_val}"
    )

    # --- Validation cơ bản ---
    if not all([flight_id, 
                passengers_data_list, isinstance(passengers_data_list, list), 
                seat_class_value, payment_method_val,
                num_adults_val is not None, 
                num_children_val is not None, 
                num_infants_val is not None]):
        # Log chi tiết hơn những gì bị thiếu
        missing_details = []
        if not flight_id: missing_details.append("flight_id")
        if not passengers_data_list or not isinstance(passengers_data_list, list): missing_details.append("passengers_data (phải là list và không rỗng)")
        if not seat_class_value: missing_details.append("seat_class_booked")
        if not payment_method_val: missing_details.append("payment_method")
        if num_adults_val is None: missing_details.append("num_adults")
        if num_children_val is None: missing_details.append("num_children")
        if num_infants_val is None: missing_details.append("num_infants")
        
        current_app.logger.error(f"API Create Booking - Validation failed: Missing/invalid fields: {', '.join(missing_details)}")
        return jsonify({"success": False, "message": f"Thiếu thông tin cần thiết: {', '.join(missing_details)}."}), 400
    
    if not passengers_data_list: # Kiểm tra list rỗng sau khi đã check type
         return jsonify({"success": False, "message": "Danh sách hành khách không được rỗng."}), 400

    try:
        num_adults = int(num_adults_val)
        num_children = int(num_children_val)
        num_infants = int(num_infants_val)
    except ValueError:
        return jsonify({"success": False, "message": "Số lượng hành khách (người lớn, trẻ em, em bé) không hợp lệ."}), 400

    if num_adults <= 0 and num_children <= 0 : # Logic này có thể cần xem lại nếu em bé được tính là hành khách chính
         return jsonify({"success": False, "message": "Cần ít nhất một người lớn hoặc trẻ em để đặt vé."}), 400
    
    total_pax_from_counts = num_adults + num_children + num_infants
    if len(passengers_data_list) != total_pax_from_counts and total_pax_from_counts > 0 : # Chỉ kiểm tra nếu total_pax_from_counts > 0
        # Trong demo, JS của bạn có thể chỉ gửi 1 passenger_data nhưng num_adults/children > 1
        # Logic này cần thống nhất giữa frontend và backend.
        # Tạm thời, nếu số lượng trong passengers_data không khớp, ta có thể chấp nhận và để model xử lý (ví dụ model chỉ lưu người đầu tiên)
        # Hoặc báo lỗi nếu muốn chặt chẽ:
        # return jsonify({"success": False, "message": f"Số lượng hành khách trong danh sách ({len(passengers_data_list)}) không khớp với tổng số đã khai báo ({total_pax_from_counts})."}), 400
        current_app.logger.warning(f"Passenger data list length ({len(passengers_data_list)}) "
                                   f"mismatch with declared counts (A:{num_adults},C:{num_children},I:{num_infants}). "
                                   f"Proceeding with declared counts for pricing/seat check, and provided passenger data for passenger records.")


    promotion_id = None # Sẽ xử lý sau nếu có
    discount_applied = 0 # Sẽ xử lý sau nếu có

    try:
        # Đảm bảo booking_model đã được import
        booking_result = booking_model.create_booking(
            user_id=user_id, 
            flight_id=flight_id,
            passengers_data=passengers_data_list, 
            seat_class_booked=seat_class_value,   
            num_adults=num_adults,
            num_children=num_children,
            num_infants=num_infants,
            payment_method=payment_method_val,    
            promotion_id=promotion_id,
            discount_applied=discount_applied
        )
        if booking_result:
            return jsonify({"success": True, "message": "Đặt vé thành công!", "booking": booking_result}), 201
        else:
            # Trường hợp model trả về None mà không ném lỗi (ít khả năng với logic model hiện tại)
            return jsonify({"success": False, "message": "Không thể tạo đặt chỗ do lỗi không xác định từ model."}), 500
            
    except ValueError as ve: 
        return jsonify({"success": False, "message": str(ve)}), 400
    except sqlite3.Error as db_err: 
        current_app.logger.error(f"Lỗi CSDL khi tạo booking: {db_err} - Data: {data}", exc_info=True)
        return jsonify({"success": False, "message": "Lỗi máy chủ khi xử lý đặt vé."}), 500
    except Exception as e:
        current_app.logger.error(f"Lỗi không xác định khi tạo booking: {e} - Data: {data}", exc_info=True)
        return jsonify({"success": False, "message": "Có lỗi không mong muốn xảy ra."}), 500

# --- API LẤY DANH SÁCH CHUYẾN BAY CỦA TÔI ---
@client_bp.route('/api/my-bookings', methods=['GET'])
def get_my_bookings_api():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "Vui lòng đăng nhập để xem các chuyến bay đã đặt."}), 401

    try:
        bookings = booking_model.get_bookings_by_user_id(user_id)
        return jsonify({"success": True, "bookings": bookings}), 200
    except Exception as e:
        current_app.logger.error(f"Lỗi khi lấy danh sách đặt chỗ của người dùng {user_id}: {e}")
        return jsonify({"success": False, "message": "Không thể lấy danh sách đặt chỗ. Vui lòng thử lại."}), 500
    
# Thêm vào cuối file app/controllers/client_routes.py

# Đảm bảo airport_model đã được import ở đầu file:
# from app.models import client_model, airport_model, flight_model, booking_model (nếu bạn đã tạo booking_model)

@client_bp.route('/api/airports', methods=['GET'])
def get_airports_api():
    """
    API trả về danh sách tất cả các sân bay.
    """
    try:
        airports = airport_model.get_all_airports()
        if airports is not None:
            return jsonify({"success": True, "airports": airports}), 200
        else:
            return jsonify({"success": False, "message": "Không thể tải danh sách sân bay."}), 500
    except Exception as e:
        current_app.logger.error(f"Lỗi khi lấy danh sách sân bay: {e}")
        return jsonify({"success": False, "message": "Lỗi máy chủ khi lấy danh sách sân bay."}), 500



@client_bp.route('/api/bookings/lookup', methods=['POST'])
def lookup_booking_api():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Dữ liệu không hợp lệ."}), 400

    pnr = data.get('pnr')
    last_name = data.get('lastName') # JavaScript gửi 'lastName'
    # first_name = data.get('firstName') # Nếu bạn cần cả tên đệm và tên

    if not pnr or not last_name:
        return jsonify({"success": False, "message": "Vui lòng nhập Mã đặt chỗ và Họ."}), 400

    try:
        booking_details = booking_model.get_booking_by_pnr_and_lastname(pnr, last_name)
        if booking_details:
            return jsonify({"success": True, "booking": booking_details}), 200
        else:
            return jsonify({"success": False, "message": "Không tìm thấy đặt chỗ phù hợp với thông tin bạn cung cấp."}), 404
    except Exception as e:
        current_app.logger.error(f"API Error looking up booking PNR {pnr}: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Lỗi máy chủ khi tra cứu đặt chỗ."}), 500


@client_bp.route('/thanh-toan')
# @login_required # Hoặc kiểm tra session như bên dưới
def payment_page_render():
    user_id = session.get('user_id')
    if not user_id:
        # Lưu URL hiện tại để quay lại sau khi đăng nhập
        return redirect(url_for('client_bp.login_page', next=request.url))
    
    current_user_name = "Khách" # Mặc định
    user = client_model.get_user_by_id(user_id)
    if user:
        current_user_name = user['full_name']
    
    # Trang payment.html sẽ tự lấy dữ liệu từ localStorage bằng JavaScript
    return render_template('client/payment.html', current_user_name=current_user_name)

