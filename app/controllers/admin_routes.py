# app/controllers/admin_routes.py
from flask import Blueprint, render_template, session, redirect, url_for, current_app, request, jsonify # Đảm bảo request, jsonify đã được import
from functools import wraps
# Import các model cần thiết
from app.models import flight_model, airport_model 

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

# ... (các hàm api_admin_create_flight, api_admin_get_flight, 
#      api_admin_update_flight, api_admin_delete_flight giữ nguyên như trước) ...
@admin_bp.route('/api/flights', methods=['POST'])
@admin_required
def api_admin_create_flight():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Dữ liệu không hợp lệ."}), 400

    required_fields = ['flightNumber', 'departureAirport', 'arrivalAirport', 
                       'departureDate', 'departureTime', 'arrivalDate', 'arrivalTime',
                       'basePrice', 'totalSeats']
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return jsonify({"success": False, "message": f"Thiếu các trường bắt buộc: {', '.join(missing_fields)}"}), 400

    try:
        departure_airport_id = airport_model.get_airport_id_by_iata_code(data['departureAirport'].upper())
        arrival_airport_id = airport_model.get_airport_id_by_iata_code(data['arrivalAirport'].upper())

        if not departure_airport_id:
            return jsonify({"success": False, "message": f"Mã sân bay đi không hợp lệ: {data['departureAirport']}"}), 400
        if not arrival_airport_id:
            return jsonify({"success": False, "message": f"Mã sân bay đến không hợp lệ: {data['arrivalAirport']}"}), 400
        if departure_airport_id == arrival_airport_id:
             return jsonify({"success": False, "message": "Sân bay đi và đến không được trùng nhau."}), 400

        flight_data_for_model = {
            'flight_number': data['flightNumber'],
            'aircraft_type': data.get('aircraftType'),
            'departure_airport_id': departure_airport_id,
            'arrival_airport_id': arrival_airport_id,
            'departureDate': data['departureDate'], 
            'departureTime': data['departureTime'], 
            'arrivalDate': data['arrivalDate'],     
            'arrivalTime': data['arrivalTime'],       
            'basePrice': data['basePrice'], 
            'business_price': data.get('businessPrice', 0),
            'first_class_price': data.get('firstClassPrice', 0),
            'total_seats': data['totalSeats'],
            'status': data.get('flightStatus', 'scheduled')
        }
        
        flight_id = flight_model.create_flight(flight_data_for_model)
        new_flight = flight_model.get_flight_by_id_admin(flight_id)
        return jsonify({"success": True, "message": "Tạo chuyến bay thành công!", "flight": new_flight}), 201

    except ValueError as ve:
        return jsonify({"success": False, "message": str(ve)}), 400
    except sqlite3.Error as dbe: # Đảm bảo sqlite3 được import nếu bạn dùng
         current_app.logger.error(f"Admin create flight DB error: {dbe}")
         return jsonify({"success": False, "message": "Lỗi cơ sở dữ liệu khi tạo chuyến bay."}), 500
    except Exception as e:
        current_app.logger.error(f"Lỗi không xác định khi admin tạo chuyến bay: {e}")
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
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Dữ liệu không hợp lệ."}), 400

    if not flight_model.get_flight_by_id_admin(flight_id):
        return jsonify({"success": False, "message": "Không tìm thấy chuyến bay để cập nhật."}), 404

    try:
        flight_data_for_model = {}
        if data.get('departureAirport'):
            dep_id = airport_model.get_airport_id_by_iata_code(data['departureAirport'].upper())
            if not dep_id: return jsonify({"success": False, "message": f"Mã sân bay đi không hợp lệ: {data['departureAirport']}"}), 400
            flight_data_for_model['departure_airport_id'] = dep_id
        
        if data.get('arrivalAirport'):
            arr_id = airport_model.get_airport_id_by_iata_code(data['arrivalAirport'].upper())
            if not arr_id: return jsonify({"success": False, "message": f"Mã sân bay đến không hợp lệ: {data['arrivalAirport']}"}), 400
            flight_data_for_model['arrival_airport_id'] = arr_id
        
        for field_form_name, model_field_name_map in {
            'flightNumber': 'flight_number', 'aircraftType': 'aircraft_type',
            'departureDate': 'departureDate', 'departureTime': 'departureTime',
            'arrivalDate': 'arrivalDate', 'arrivalTime': 'arrivalTime',
            'basePrice': 'basePrice', 'businessPrice': 'business_price', 
            'firstClassPrice': 'first_class_price', 'totalSeats': 'total_seats',
            'availableSeats': 'available_seats', 'flightStatus': 'status'
        }.items():
            if field_form_name in data:
                flight_data_for_model[model_field_name_map] = data[field_form_name]

        success = flight_model.update_flight(flight_id, flight_data_for_model)
        if success:
            updated_flight = flight_model.get_flight_by_id_admin(flight_id)
            return jsonify({"success": True, "message": "Cập nhật chuyến bay thành công.", "flight": updated_flight}), 200
        else:
            return jsonify({"success": False, "message": "Không thể cập nhật chuyến bay hoặc không có thay đổi."}), 400 
    except ValueError as ve:
        return jsonify({"success": False, "message": str(ve)}), 400
    except sqlite3.Error as dbe:
         current_app.logger.error(f"Admin update flight DB error for ID {flight_id}: {dbe}")
         return jsonify({"success": False, "message": "Lỗi cơ sở dữ liệu khi cập nhật chuyến bay."}), 500
    except Exception as e:
        current_app.logger.error(f"Lỗi không xác định khi admin cập nhật chuyến bay {flight_id}: {e}")
        return jsonify({"success": False, "message": "Lỗi máy chủ không xác định."}), 500

@admin_bp.route('/api/flights/<int:flight_id>', methods=['DELETE'])
@admin_required
def api_admin_delete_flight(flight_id):
    try:
        success = flight_model.delete_flight(flight_id)
        if success:
            return jsonify({"success": True, "message": "Xóa chuyến bay thành công."}), 200
        else:
            return jsonify({"success": False, "message": "Không thể xóa chuyến bay. Chuyến bay có thể không tồn tại hoặc có các đặt chỗ liên quan."}), 400
    except Exception as e:
        current_app.logger.error(f"Admin API: Error deleting flight {flight_id}: {e}")
        return jsonify({"success": False, "message": "Lỗi máy chủ khi xóa chuyến bay."}), 500