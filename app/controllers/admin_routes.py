# app/controllers/admin_routes.py
from flask import Blueprint, render_template, session, redirect, url_for, current_app, request, jsonify # Đảm bảo request, jsonify đã được import
from functools import wraps
import sqlite3
from datetime import datetime
# Import các model cần thiết
from app.models import flight_model, airport_model, client_model
from app.models.flight_model import combine_datetime_str

admin_bp = Blueprint('admin_bp', __name__,
                     template_folder='../templates/admin',
                     url_prefix='/admin')

# --- Decorator @admin_required giữ nguyên như trước ---
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if hasattr(request, 'blueprint') and request.blueprint == admin_bp.name and hasattr(request, 'endpoint') and request.endpoint and 'api_' in request.endpoint:
                return jsonify(success=False, message="Yêu cầu đăng nhập với quyền quản trị."), 401
            return redirect(url_for('client_bp.login_page', next=request.url))
        
        user_role = session.get('user_role')
        if user_role != 'admin':
            if hasattr(request, 'blueprint') and request.blueprint == admin_bp.name and hasattr(request, 'endpoint') and request.endpoint and 'api_' in request.endpoint:
                return jsonify(success=False, message="Không có quyền truy cập."), 403
            return redirect(url_for('client_bp.home_page'))
        return f(*args, **kwargs)
    return decorated_function

# --- CÁC ROUTE PHỤC VỤ TRANG HTML CHO ADMIN (ĐÃ ĐỔI TÊN HÀM) ---

@admin_bp.route('/') # Đường dẫn /admin/
@admin_bp.route('/dashboard') # Đường dẫn /admin/dashboard
@admin_required
def dashboard(): # <<< ĐỔI TÊN TỪ dashboard_page
    return render_template('admin/dashboard.html')

@admin_bp.route('/flights') # Đường dẫn /admin/flights
@admin_required
def flights(): # <<< ĐỔI TÊN TỪ flights_management_page
    return render_template('admin/flights.html')

@admin_bp.route('/bookings') # Đường dẫn /admin/bookings
@admin_required
def quan_ly_dat_cho(): # <<< ĐỔI TÊN TỪ bookings_management_page
    return render_template('admin/quan_ly_dat_cho.html')

@admin_bp.route('/users') # Đường dẫn /admin/users
@admin_required
def quan_ly_nguoi_dung(): # <<< ĐỔI TÊN TỪ users_management_page
    return render_template('admin/quan_ly_nguoi_dung.html')

@admin_bp.route('/homepage-notifications') # Đường dẫn /admin/homepage-notifications
@admin_required
def quan_ly_thong_bao_trang_chu(): # <<< ĐỔI TÊN TỪ homepage_notifications_management_page
    return render_template('admin/quan_ly_thong_bao_trang_chu.html')

@admin_bp.route('/emenu') # Đường dẫn /admin/emenu
@admin_required
def quan_ly_e_menu(): # <<< ĐỔI TÊN TỪ emenu_management_page
    return render_template('admin/quan_ly_e_menu.html')

@admin_bp.route('/reports') # Đường dẫn /admin/reports
@admin_required
def bao_cao_thong_ke(): # <<< ĐỔI TÊN TỪ reports_statistics_page
    return render_template('admin/bao_cao_thong_ke.html')

# --- CÁC API CRUD CHO CHUYẾN BAY (ADMIN) ---
# Các hàm API (ví dụ: api_admin_get_all_flights, api_admin_create_flight, ...)
# không cần thay đổi tên vì chúng không thường được gọi trực tiếp bằng url_for trong template điều hướng.
# Tuy nhiên, nếu bạn muốn nhất quán, bạn cũng có thể đổi tên chúng.
# Hiện tại, tôi sẽ giữ nguyên tên các hàm API.

@admin_bp.route('/api/flights', methods=['GET'])
@admin_required
def api_admin_get_all_flights():
    # ... (code giữ nguyên như trước) ...
    try:
        flights_data = flight_model.get_all_flights_admin()
        return jsonify({"success": True, "flights": flights_data}), 200
    except Exception as e:
        current_app.logger.error(f"Admin API: Error fetching all flights: {e}")
        return jsonify({"success": False, "message": "Lỗi máy chủ khi lấy danh sách chuyến bay."}), 500


@admin_bp.route('/api/flights', methods=['POST'])
@admin_required
def api_admin_create_flight():
    data = request.get_json()
    # ... (validation data cơ bản) ...
    if not data: return jsonify({"success": False, "message": "Dữ liệu không hợp lệ."}), 400

    # Bỏ flightNumber khỏi required_fields vì nó tự động tạo
    required_fields = ['departureAirport', 'arrivalAirport', 
                       'departureDate', 'departureTime', 'arrivalDate', 'arrivalTime',
                       'basePrice', 'totalSeats']
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return jsonify({"success": False, "message": f"Thiếu các trường bắt buộc: {', '.join(missing_fields)}"}), 400
    
    # ... (validation ngày giờ và sân bay giữ nguyên) ...
    try:
        # ... (lấy departure_airport_id, arrival_airport_id) ...
        departure_airport_id = airport_model.get_airport_id_by_iata_code(data['departureAirport'].upper())
        arrival_airport_id = airport_model.get_airport_id_by_iata_code(data['arrivalAirport'].upper())

        if not departure_airport_id:
            return jsonify({"success": False, "message": f"Mã sân bay đi '{data['departureAirport']}' không hợp lệ."}), 400
        if not arrival_airport_id:
            return jsonify({"success": False, "message": f"Mã sân bay đến '{data['arrivalAirport']}' không hợp lệ."}), 400
        if departure_airport_id == arrival_airport_id:
             return jsonify({"success": False, "message": "Sân bay đi và đến không được trùng nhau."}), 400

        departure_date_str = data.get('departureDate')
        departure_time_str = data.get('departureTime')
        arrival_date_str = data.get('arrivalDate')
        arrival_time_str = data.get('arrivalTime')
        try:
            departure_dt_obj = datetime.strptime(f"{departure_date_str} {departure_time_str}", '%Y-%m-%d %H:%M')
            arrival_dt_obj = datetime.strptime(f"{arrival_date_str} {arrival_time_str}", '%Y-%m-%d %H:%M')
            if arrival_dt_obj <= departure_dt_obj:
                return jsonify({"success": False, "message": "Ngày giờ đến phải sau ngày giờ khởi hành."}), 400
        except ValueError:
             return jsonify({"success": False, "message": "Định dạng ngày hoặc giờ không hợp lệ."}), 400

        flight_data_for_model = {
            # Không cần 'flight_number' vì model sẽ tự tạo
            # Không cần 'aircraft_type' vì đã bỏ
            'departure_airport_id': departure_airport_id,
            'arrival_airport_id': arrival_airport_id,
            'departureDate': departure_date_str, 
            'departureTime': departure_time_str, 
            'arrivalDate': arrival_date_str,     
            'arrivalTime': arrival_time_str,       
            'basePrice': data['basePrice'], 
            'business_price': data.get('businessPrice', 0),
            'first_class_price': data.get('firstClassPrice', 0),
            'total_seats': data['totalSeats']
        }
        
        flight_id = flight_model.create_flight(flight_data_for_model)
        new_flight = flight_model.get_flight_by_id_admin(flight_id) # Lấy lại để có flight_number tự động
        return jsonify({"success": True, "message": "Tạo chuyến bay thành công! Số hiệu: " + new_flight.get('flight_number', 'N/A'), "flight": new_flight}), 201
    # ... (các khối except giữ nguyên, IntegrityError cho flight_number sẽ không còn nếu nó không UNIQUE nữa) ...
    except ValueError as ve: 
        return jsonify({"success": False, "message": str(ve)}), 400
    except sqlite3.IntegrityError as ie: 
         current_app.logger.warning(f"Admin create flight IntegrityError: {ie} - Data: {data}")
         # Lỗi này giờ chỉ có thể là do các UNIQUE constraint khác nếu còn, hoặc lỗi FK
         return jsonify({"success": False, "message": f"Lỗi ràng buộc cơ sở dữ liệu: {ie}"}), 400
    except sqlite3.Error as dbe: 
         current_app.logger.error(f"Admin create flight DB error: {dbe} - Data: {data}")
         return jsonify({"success": False, "message": "Lỗi cơ sở dữ liệu khi tạo chuyến bay."}), 500
    except Exception as e: 
        current_app.logger.error(f"API Create Flight - Unknown error: {e} - Data: {data}", exc_info=True)
        return jsonify({"success": False, "message": "Lỗi máy chủ không xác định."}), 500

@admin_bp.route('/api/flights/<int:flight_id>', methods=['GET'])
@admin_required
def api_admin_get_flight(flight_id):
    try:
        flight = flight_model.get_flight_by_id_admin(flight_id)
        if flight:
            return jsonify({"success": True, "flight": flight}), 200
        else:
            return jsonify({"success": False, "message": "Không tìm thấy chuyến bay."}), 404
    except Exception as e:
        current_app.logger.error(f"Admin API: Error fetching flight {flight_id}: {e}")
        return jsonify({"success": False, "message": "Lỗi máy chủ."}), 500


@admin_bp.route('/api/flights/<int:flight_id>', methods=['PUT'])
@admin_required
def api_admin_update_flight(flight_id):
    data_from_js = request.get_json() 
    if not data_from_js:
        return jsonify({"success": False, "message": "Dữ liệu không hợp lệ hoặc thiếu."}), 400

    existing_flight_dict = flight_model.get_flight_by_id_admin(flight_id)
    if not existing_flight_dict:
        return jsonify({"success": False, "message": "Không tìm thấy chuyến bay để cập nhật."}), 404

    flight_data_for_model = {} # Dữ liệu cuối cùng để gửi xuống model

    # 1. Xử lý và VALIDATE Sân bay
    # Lấy ID sân bay hiện tại từ CSDL
    final_departure_airport_id = existing_flight_dict['departure_airport_id']
    final_arrival_airport_id = existing_flight_dict['arrival_airport_id']

    if 'departureAirport' in data_from_js: # Nếu admin thay đổi sân bay đi
        dep_iata = data_from_js['departureAirport'].upper()
        dep_id = airport_model.get_airport_id_by_iata_code(dep_iata)
        if not dep_id: 
            return jsonify({"success": False, "message": f"Mã sân bay đi không hợp lệ: {dep_iata}"}), 400
        flight_data_for_model['departure_airport_id'] = dep_id
        final_departure_airport_id = dep_id # Cập nhật để validation
    
    if 'arrivalAirport' in data_from_js: # Nếu admin thay đổi sân bay đến
        arr_iata = data_from_js['arrivalAirport'].upper()
        arr_id = airport_model.get_airport_id_by_iata_code(arr_iata)
        if not arr_id: 
            return jsonify({"success": False, "message": f"Mã sân bay đến không hợp lệ: {arr_iata}"}), 400
        flight_data_for_model['arrival_airport_id'] = arr_id
        final_arrival_airport_id = arr_id # Cập nhật để validation

    if final_departure_airport_id == final_arrival_airport_id:
        return jsonify({"success": False, "message": "Sân bay đi và đến không được trùng nhau."}), 400

    # 2. Xử lý và VALIDATE Ngày Giờ
    # Lấy ngày giờ hiện tại từ CSDL (đã ở dạng ISO string)
    departure_dt_obj_for_validation = datetime.fromisoformat(existing_flight_dict['departure_time'])
    arrival_dt_obj_for_validation = datetime.fromisoformat(existing_flight_dict['arrival_time'])

    # Nếu admin thay đổi ngày/giờ đi
    if 'departureDate' in data_from_js and 'departureTime' in data_from_js:
        dep_date_str = data_from_js['departureDate']
        dep_time_str = data_from_js['departureTime']
        combined_dep_iso = combine_datetime_str(dep_date_str, dep_time_str)
        if not combined_dep_iso: return jsonify({"success": False, "message": "Định dạng ngày hoặc giờ đi cung cấp không hợp lệ."}), 400
        try:
            departure_dt_obj_for_validation = datetime.fromisoformat(combined_dep_iso)
        except ValueError:
             return jsonify({"success": False, "message": "Ngày giờ đi cung cấp không đúng định dạng ISO."}), 400
        flight_data_for_model['departureDate'] = dep_date_str
        flight_data_for_model['departureTime'] = dep_time_str
    # Nếu chỉ thay đổi một trong hai (ngày hoặc giờ) thì báo lỗi (trừ khi bạn muốn logic phức tạp hơn)
    elif 'departureDate' in data_from_js or 'departureTime' in data_from_js:
        return jsonify({"success": False, "message": "Cần cung cấp cả ngày và giờ đi nếu muốn thay đổi."}), 400
        
    # Nếu admin thay đổi ngày/giờ đến
    if 'arrivalDate' in data_from_js and 'arrivalTime' in data_from_js:
        arr_date_str = data_from_js['arrivalDate']
        arr_time_str = data_from_js['arrivalTime']
        combined_arr_iso = combine_datetime_str(arr_date_str, arr_time_str)
        if not combined_arr_iso: return jsonify({"success": False, "message": "Định dạng ngày hoặc giờ đến cung cấp không hợp lệ."}), 400
        try:
            arrival_dt_obj_for_validation = datetime.fromisoformat(combined_arr_iso)
        except ValueError:
             return jsonify({"success": False, "message": "Ngày giờ đến cung cấp không đúng định dạng ISO."}), 400
        flight_data_for_model['arrivalDate'] = arr_date_str
        flight_data_for_model['arrivalTime'] = arr_time_str
    elif 'arrivalDate' in data_from_js or 'arrivalTime' in data_from_js:
        return jsonify({"success": False, "message": "Cần cung cấp cả ngày và giờ đến nếu muốn thay đổi."}), 400

    if arrival_dt_obj_for_validation <= departure_dt_obj_for_validation:
        return jsonify({"success": False, "message": "Ngày giờ đến phải sau ngày giờ khởi hành."}), 400

    # 3. Map các trường thông tin khác
    field_mapping = {
        # flightNumber không cho sửa vì nó tự động tạo theo ID (và ID không đổi khi update)
        # aircraftType đã bỏ
        'basePrice': 'economy_price',
        'businessPrice': 'business_price',
        'firstClassPrice': 'first_class_price',
        'totalSeats': 'total_seats',
        'availableSeats': 'available_seats', # Admin có thể cần điều chỉnh số ghế trống
        'flightStatus': 'status'
    }
    for js_key, model_key in field_mapping.items():
        if js_key in data_from_js: # Chỉ thêm vào nếu có trong dữ liệu gửi lên
            value = data_from_js[js_key]
            try:
                if model_key in ['economy_price', 'business_price', 'first_class_price']:
                    flight_data_for_model[model_key] = float(value) if value is not None else None
                elif model_key in ['total_seats', 'available_seats']:
                    flight_data_for_model[model_key] = int(value) if value is not None else None
                else: # status
                    flight_data_for_model[model_key] = value
            except (ValueError, TypeError):
                return jsonify({"success": False, "message": f"Giá trị không hợp lệ cho trường '{js_key}'."}), 400
    
    current_app.logger.debug(f"API Update Flight - Data for model for flight_id {flight_id}: {flight_data_for_model}")

    if not flight_data_for_model: # Không có trường nào được gửi để cập nhật (ngoài sân bay hoặc ngày giờ đã xử lý)
        # Kiểm tra xem có thay đổi sân bay hoặc ngày giờ không
        if 'departure_airport_id' not in flight_data_for_model and \
           'arrival_airport_id' not in flight_data_for_model and \
           'departureDate' not in flight_data_for_model and \
           'arrivalDate' not in flight_data_for_model:
            return jsonify({"success": True, "message": "Không có thông tin nào được cung cấp để cập nhật.", "flight": existing_flight_dict}), 200

    try:
        success = flight_model.update_flight(flight_id, flight_data_for_model)
        if success:
            updated_flight = flight_model.get_flight_by_id_admin(flight_id)
            return jsonify({"success": True, "message": "Cập nhật chuyến bay thành công.", "flight": updated_flight}), 200
        else:
            return jsonify({"success": False, "message": "Không có thay đổi nào được thực hiện hoặc không thể cập nhật."}), 400
    except ValueError as ve: 
        return jsonify({"success": False, "message": str(ve)}), 400
    except sqlite3.Error as dbe:
         current_app.logger.error(f"Admin update flight DB error for ID {flight_id}: {dbe}")
         return jsonify({"success": False, "message": "Lỗi cơ sở dữ liệu khi cập nhật chuyến bay."}), 500
    except Exception as e:
        current_app.logger.error(f"Lỗi không xác định khi admin cập nhật chuyến bay {flight_id}: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Lỗi máy chủ không xác định."}), 500


@admin_bp.route('/api/flights/<int:flight_id>', methods=['DELETE'])
@admin_required
def api_admin_delete_flight(flight_id):
    current_app.logger.info(f"API: Request to delete flight ID: {flight_id}")
    try:
        success = flight_model.delete_flight(flight_id)
        if success:
            current_app.logger.info(f"API: Flight ID {flight_id} successfully deleted (model returned True).")
            return jsonify({"success": True, "message": "Xóa chuyến bay thành công."}), 200
        else:
            current_app.logger.warning(f"API: Model failed to delete flight ID {flight_id} (model returned False).")
            # Model trả về False có thể do flight_id không tồn tại ban đầu, hoặc lỗi CSDL không mong muốn.
            # Trả về 404 nếu có khả năng cao là không tìm thấy.
            return jsonify({"success": False, "message": "Không thể xóa chuyến bay. Chuyến bay có thể không tồn tại hoặc đã xảy ra lỗi trong quá trình xóa."}), 404 
    except Exception as e:
        current_app.logger.error(f"API: Unhandled exception during delete flight {flight_id}: {e}")
        return jsonify({"success": False, "message": "Lỗi máy chủ không xác định khi xóa chuyến bay."}), 500
    
@admin_bp.route('/api/users', methods=['GET'])
@admin_required
def api_admin_get_all_users():
    try:
        # Lấy các tham số query cho tìm kiếm và lọc
        search_term = request.args.get('search', None)
        status_filter = request.args.get('status', None)
        # role_filter = request.args.get('role', None) # Nếu bạn muốn lọc theo role

        # Gọi hàm model (đã được cập nhật ở bước trước)
        users = client_model.get_all_users_admin(
            search_term=search_term, 
            status_filter=status_filter
            # role_filter=role_filter
        )
        return jsonify({"success": True, "users": users}), 200
    except Exception as e:
        current_app.logger.error(f"Admin API: Error fetching all users: {e}")
        return jsonify({"success": False, "message": "Lỗi máy chủ khi lấy danh sách người dùng."}), 500

@admin_bp.route('/api/users/<int:user_id>', methods=['GET'])
@admin_required
def api_admin_get_user(user_id):
    try:
        user = client_model.get_user_by_id(user_id) # Dùng hàm get_user_by_id thông thường
        if user:
            # Chuyển sqlite3.Row thành dict để jsonify
            user_dict = dict(user)
            # Không trả về password_hash cho client, ngay cả admin
            user_dict.pop('password_hash', None) 
            return jsonify({"success": True, "user": user_dict}), 200
        else:
            return jsonify({"success": False, "message": "Không tìm thấy người dùng."}), 404
    except Exception as e:
        current_app.logger.error(f"Admin API: Error fetching user {user_id}: {e}")
        return jsonify({"success": False, "message": "Lỗi máy chủ."}), 500

@admin_bp.route('/api/users', methods=['POST'])
@admin_required
def api_admin_create_user():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Dữ liệu không hợp lệ."}), 400

    # Các trường bắt buộc khi admin tạo user (dựa trên form quan_ly_nguoi_dung.html)
    # Form có: userFullName, userEmail, userPhone, userStatus, userPassword
    full_name = data.get('userFullName')
    email = data.get('userEmail')
    password = data.get('userPassword') # Mật khẩu bắt buộc khi tạo mới

    if not all([full_name, email, password]):
        return jsonify({"success": False, "message": "Họ tên, email và mật khẩu là bắt buộc."}), 400
    if len(password) < 6:
         return jsonify({"success": False, "message": "Mật khẩu phải có ít nhất 6 ký tự."}), 400

    user_data_for_model = {
        'full_name': full_name,
        'email': email,
        'password': password,
        'phone_number': data.get('userPhone'),
        'role': data.get('userRole', 'client'), # Giả sử form có thể có trường userRole, nếu không mặc định client
        'status': data.get('userStatus', 'active') # Lấy từ form
    }

    try:
        user_id = client_model.create_user_by_admin(user_data_for_model)
        new_user = client_model.get_user_by_id(user_id)
        if new_user:
            user_dict = dict(new_user)
            user_dict.pop('password_hash', None)
            return jsonify({"success": True, "message": "Tạo người dùng thành công!", "user": user_dict}), 201
        else: # Trường hợp create_user_by_admin trả về None mà không ném lỗi (ít khả năng nếu đã raise)
             return jsonify({"success": False, "message": "Không thể tạo người dùng."}), 500
    except ValueError as ve: # Bắt lỗi từ model (ví dụ: email trùng, mật khẩu không hợp lệ)
        return jsonify({"success": False, "message": str(ve)}), 400
    except Exception as e:
        current_app.logger.error(f"Admin API: Error creating user: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Lỗi máy chủ khi tạo người dùng."}), 500


@admin_bp.route('/api/users/<int:user_id>', methods=['PUT'])
@admin_required
def api_admin_update_user(user_id):
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Dữ liệu không hợp lệ hoặc thiếu."}), 400

    # Kiểm tra xem user có tồn tại không
    if not client_model.get_user_by_id(user_id):
        return jsonify({"success": False, "message": "Không tìm thấy người dùng để cập nhật."}), 404

    # Dữ liệu mà script_quan_ly_nguoi_dung.js gửi lên có thể là:
    # fullName, email, phone, status, password (nếu có thay đổi)
    user_data_for_model = {}
    if 'userFullName' in data: user_data_for_model['full_name'] = data['userFullName']
    if 'userEmail' in data: user_data_for_model['email'] = data['userEmail']
    if 'userPhone' in data: user_data_for_model['phone_number'] = data['userPhone']
    if 'userStatus' in data: user_data_for_model['status'] = data['userStatus']
    if 'userRole' in data: user_data_for_model['role'] = data['userRole'] # Nếu admin có thể đổi role
    if 'userPassword' in data and data['userPassword']: # Chỉ cập nhật mật khẩu nếu được cung cấp và không rỗng
        user_data_for_model['password'] = data['userPassword']
    
    if not user_data_for_model:
         return jsonify({"success": True, "message": "Không có thông tin nào được cung cấp để cập nhật."}), 200


    try:
        success = client_model.update_user_by_admin(user_id, user_data_for_model)
        if success:
            updated_user = client_model.get_user_by_id(user_id)
            user_dict = dict(updated_user)
            user_dict.pop('password_hash', None)
            return jsonify({"success": True, "message": "Cập nhật thông tin người dùng thành công.", "user": user_dict}), 200
        else:
            # Điều này có thể xảy ra nếu model trả về False (ví dụ: email/phone trùng với người khác)
            # mà không ném ValueError/IntegrityError
            return jsonify({"success": False, "message": "Không thể cập nhật người dùng hoặc không có thay đổi."}), 400
    except ValueError as ve:
        return jsonify({"success": False, "message": str(ve)}), 400
    except Exception as e:
        current_app.logger.error(f"Admin API: Error updating user {user_id}: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Lỗi máy chủ khi cập nhật người dùng."}), 500


@admin_bp.route('/api/users/<int:user_id>', methods=['DELETE'])
@admin_required
def api_admin_delete_user(user_id):
    # Cẩn thận: Không cho phép admin tự xóa chính mình hoặc admin cuối cùng
    if 'user_id' in session and int(user_id) == session['user_id']:
        return jsonify({"success": False, "message": "Không thể tự xóa tài khoản đang đăng nhập."}), 403
    
    # (Có thể thêm logic kiểm tra nếu là admin cuối cùng thì không cho xóa)

    try:
        success = client_model.delete_user_by_admin(user_id)
        if success:
            return jsonify({"success": True, "message": "Xóa người dùng thành công."}), 200
        else:
            # Có thể user_id không tồn tại
            return jsonify({"success": False, "message": "Không thể xóa người dùng. Người dùng có thể không tồn tại."}), 404
    except ValueError as ve: # Bắt lỗi từ model nếu không xóa được do ràng buộc
        return jsonify({"success": False, "message": str(ve)}), 400
    except Exception as e:
        current_app.logger.error(f"Admin API: Error deleting user {user_id}: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Lỗi máy chủ khi xóa người dùng."}), 500