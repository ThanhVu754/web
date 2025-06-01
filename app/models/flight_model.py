# app/models/flight_model.py
import sqlite3
from flask import current_app
from datetime import datetime # Để xử lý ngày tháng

def _get_db_connection():
    """Hàm tiện ích nội bộ để lấy kết nối DB."""
    conn = sqlite3.connect(current_app.config['DATABASE_PATH'])
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def search_flights(origin_airport_id, destination_airport_id, departure_date_str, passengers=1, seat_class="Phổ thông"):
    """
    Tìm kiếm chuyến bay dựa trên điểm đi, điểm đến, ngày đi.
    departure_date_str: Chuỗi ngày dạng 'YYYY-MM-DD'
    passengers: Số lượng hành khách (để kiểm tra 'available_seats')
    seat_class: Hạng ghế (để lấy giá phù hợp)
    """
    conn = _get_db_connection()
    flights_result = []
    try:
        # Chuyển đổi chuỗi ngày thành đối tượng datetime để so sánh phần ngày
        # departure_date_obj = datetime.strptime(departure_date_str, '%Y-%m-%d').date()
        # Truy vấn sẽ so sánh phần ngày của departure_time với departure_date_str
        # SQLite: date(departure_time) = 'YYYY-MM-DD'

        query = """
            SELECT 
                f.id, f.flight_number, 
                f.departure_time, f.arrival_time,
                f.economy_price, f.business_price, f.first_class_price,
                f.available_seats,
                dep_airport.iata_code as origin_iata, dep_airport.city as origin_city,
                arr_airport.iata_code as destination_iata, arr_airport.city as destination_city
            FROM flights f
            JOIN airports dep_airport ON f.departure_airport_id = dep_airport.id
            JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.id
            WHERE f.departure_airport_id = ?
              AND f.arrival_airport_id = ?
              AND date(f.departure_time) = ? 
              AND f.available_seats >= ?
              AND f.status = 'scheduled' 
            ORDER BY f.departure_time ASC
        """
        
        cursor = conn.execute(query, (origin_airport_id, destination_airport_id, departure_date_str, passengers))
        raw_flights = cursor.fetchall()

        for row in raw_flights:
            flight_dict = dict(row)
            # Chọn giá dựa trên hạng ghế
            if seat_class == "Thương gia" and flight_dict.get('business_price') is not None:
                flight_dict['price'] = flight_dict['business_price']
            elif seat_class == "Hạng nhất" and flight_dict.get('first_class_price') is not None:
                flight_dict['price'] = flight_dict['first_class_price']
            else: # Mặc định hoặc Phổ thông
                flight_dict['price'] = flight_dict['economy_price']
            
            # Định dạng lại thời gian cho dễ hiển thị (tùy chọn, có thể làm ở frontend)
            try:
                dt_dep = datetime.fromisoformat(flight_dict['departure_time'])
                dt_arr = datetime.fromisoformat(flight_dict['arrival_time'])
                flight_dict['departure_time_formatted'] = dt_dep.strftime('%H:%M %d/%m/%Y')
                flight_dict['arrival_time_formatted'] = dt_arr.strftime('%H:%M %d/%m/%Y')
                
                duration = dt_arr - dt_dep
                hours = duration.seconds // 3600
                minutes = (duration.seconds % 3600) // 60
                flight_dict['duration_formatted'] = f"{hours} giờ {minutes} phút"

            except ValueError: # Xử lý nếu định dạng thời gian từ DB không phải ISO
                 flight_dict['departure_time_formatted'] = flight_dict['departure_time']
                 flight_dict['arrival_time_formatted'] = flight_dict['arrival_time']
                 flight_dict['duration_formatted'] = "N/A"


            flights_result.append(flight_dict)
            
        return flights_result
    except Exception as e:
        print(f"Error searching flights: {e}")
        # current_app.logger.error(f"Error searching flights: {e}")
        return []
    finally:
        if conn:
            conn.close()

# Bạn có thể thêm các hàm khác như get_flight_by_id(flight_id) ở đây sau
# Thêm hàm này vào app/models/flight_model.py

def get_flight_details_for_booking(flight_id):
    """
    Lấy chi tiết chuyến bay cần thiết cho việc tạo booking (giá, ghế trống).
    """
    conn = _get_db_connection() # Đảm bảo _get_db_connection đã được định nghĩa trong file này
    try:
        flight = conn.execute(
            "SELECT id, economy_price, business_price, first_class_price, available_seats FROM flights WHERE id = ?",
            (flight_id,)
        ).fetchone()
        return dict(flight) if flight else None
    except Exception as e:
        print(f"Error fetching flight details for booking (ID {flight_id}): {e}")
        # current_app.logger.error(f"Error fetching flight details for booking (ID {flight_id}): {e}")
        return None
    finally:
        if conn:
            conn.close()
            
# app/models/flight_model.py
import sqlite3
from flask import current_app
from datetime import datetime

def _get_db_connection():
    conn = sqlite3.connect(current_app.config['DATABASE_PATH'])
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

# --- search_flights và get_flight_details_for_booking giữ nguyên như trước ---
def search_flights(origin_airport_id, destination_airport_id, departure_date_str, passengers=1, seat_class="Phổ thông"):
    # ... (code đã có, không thay đổi)
    conn = _get_db_connection()
    flights_result = []
    try:
        query = """
            SELECT 
                f.id, f.flight_number, 
                f.departure_time, f.arrival_time,
                f.economy_price, f.business_price, f.first_class_price,
                f.available_seats,
                dep_airport.iata_code as origin_iata, dep_airport.city as origin_city,
                arr_airport.iata_code as destination_iata, arr_airport.city as destination_city
            FROM flights f
            JOIN airports dep_airport ON f.departure_airport_id = dep_airport.id
            JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.id
            WHERE f.departure_airport_id = ?
              AND f.arrival_airport_id = ?
              AND date(f.departure_time) = ? 
              AND f.available_seats >= ?
              AND f.status = 'scheduled' 
            ORDER BY f.departure_time ASC
        """
        cursor = conn.execute(query, (origin_airport_id, destination_airport_id, departure_date_str, passengers))
        raw_flights = cursor.fetchall()
        for row in raw_flights:
            flight_dict = dict(row)
            if seat_class == "Thương gia" and flight_dict.get('business_price') is not None:
                flight_dict['price'] = flight_dict['business_price']
            elif seat_class == "Hạng nhất" and flight_dict.get('first_class_price') is not None:
                flight_dict['price'] = flight_dict['first_class_price']
            else:
                flight_dict['price'] = flight_dict['economy_price']
            try:
                dt_dep = datetime.fromisoformat(flight_dict['departure_time'])
                dt_arr = datetime.fromisoformat(flight_dict['arrival_time'])
                flight_dict['departure_time_formatted'] = dt_dep.strftime('%H:%M %d/%m/%Y')
                flight_dict['arrival_time_formatted'] = dt_arr.strftime('%H:%M %d/%m/%Y')
                duration = dt_arr - dt_dep
                hours = duration.seconds // 3600
                minutes = (duration.seconds % 3600) // 60
                flight_dict['duration_formatted'] = f"{hours} giờ {minutes} phút"
            except ValueError:
                 flight_dict['departure_time_formatted'] = flight_dict['departure_time']
                 flight_dict['arrival_time_formatted'] = flight_dict['arrival_time']
                 flight_dict['duration_formatted'] = "N/A"
            flights_result.append(flight_dict)
        return flights_result
    except Exception as e:
        print(f"Error searching flights: {e}")
        return []
    finally:
        if conn: conn.close()

def get_flight_details_for_booking(flight_id):
    # ... (code đã có, không thay đổi) ...
    conn = _get_db_connection()
    try:
        flight = conn.execute(
            "SELECT id, economy_price, business_price, first_class_price, available_seats FROM flights WHERE id = ?",
            (flight_id,)
        ).fetchone()
        return dict(flight) if flight else None
    except Exception as e:
        print(f"Error fetching flight details for booking (ID {flight_id}): {e}")
        return None
    finally:
        if conn: conn.close()


# --- CÁC HÀM CHO ADMIN CRUD FLIGHTS (CẬP NHẬT VÀ MỚI) ---

def combine_datetime_str(date_str, time_str):
    """Kết hợp chuỗi ngày (YYYY-MM-DD) và chuỗi giờ (HH:MM) thành chuỗi ISO datetime."""
    if date_str and time_str:
        return f"{date_str} {time_str}:00" # Thêm giây để chuẩn ISO hơn cho SQLite
    return None

def create_flight(flight_data):
    conn = _get_db_connection()
    try:
        departure_datetime_iso = combine_datetime_str(flight_data.get('departureDate'), flight_data.get('departureTime'))
        arrival_datetime_iso = combine_datetime_str(flight_data.get('arrivalDate'), flight_data.get('arrivalTime'))

        if not all([departure_datetime_iso, arrival_datetime_iso]):
            raise ValueError("Ngày giờ đi hoặc đến không hợp lệ.")

        cursor = conn.execute(
            """
            INSERT INTO flights (flight_number, aircraft_type, departure_airport_id, arrival_airport_id, 
                                 departure_time, arrival_time, economy_price, business_price, 
                                 first_class_price, total_seats, available_seats, status, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """,
            (
                flight_data['flight_number'], flight_data.get('aircraft_type'), 
                flight_data['departure_airport_id'], flight_data['arrival_airport_id'],
                departure_datetime_iso, arrival_datetime_iso,
                float(flight_data.get('basePrice', 0)), # basePrice từ form admin là economy_price
                float(flight_data.get('business_price', 0)), # Giả sử có thể thêm sau hoặc mặc định là 0
                float(flight_data.get('first_class_price', 0)),# Giả sử có thể thêm sau hoặc mặc định là 0
                int(flight_data['total_seats']), int(flight_data['total_seats']), # available_seats = total_seats
                flight_data.get('status', 'scheduled')
            )
        )
        conn.commit()
        return cursor.lastrowid
    except sqlite3.Error as e:
        print(f"Database error creating flight: {e}")
        raise
    except ValueError as ve: # Bắt lỗi từ combine_datetime_str hoặc chuyển đổi kiểu
        print(f"Data error creating flight: {ve}")
        raise
    finally:
        if conn:
            conn.close()

def get_all_flights_admin():
    conn = _get_db_connection()
    try:
        query = """
            SELECT 
                f.id, f.flight_number, f.aircraft_type,
                f.departure_time, f.arrival_time,
                f.economy_price, f.business_price, f.first_class_price,
                f.total_seats, f.available_seats, f.status,
                dep.iata_code as departure_airport_iata, dep.city as departure_airport_city,
                arr.iata_code as arrival_airport_iata, arr.city as arrival_airport_city
            FROM flights f
            LEFT JOIN airports dep ON f.departure_airport_id = dep.id
            LEFT JOIN airports arr ON f.arrival_airport_id = arr.id
            ORDER BY f.departure_time DESC;
        """
        flights = conn.execute(query).fetchall()
        # Chuyển đổi datetime thành chuỗi YYYY-MM-DD và HH:MM riêng để dễ hiển thị trên form admin
        results = []
        for flight in flights:
            flight_dict = dict(flight)
            try:
                dt_dep = datetime.fromisoformat(flight_dict['departure_time'])
                dt_arr = datetime.fromisoformat(flight_dict['arrival_time'])
                flight_dict['departure_date_form'] = dt_dep.strftime('%Y-%m-%d')
                flight_dict['departure_time_form'] = dt_dep.strftime('%H:%M')
                flight_dict['arrival_date_form'] = dt_arr.strftime('%Y-%m-%d')
                flight_dict['arrival_time_form'] = dt_arr.strftime('%H:%M')
            except (TypeError, ValueError): # Xử lý nếu giá trị là None hoặc không đúng định dạng
                flight_dict['departure_date_form'] = None
                flight_dict['departure_time_form'] = None
                flight_dict['arrival_date_form'] = None
                flight_dict['arrival_time_form'] = None
            results.append(flight_dict)
        return results
    except Exception as e:
        print(f"Error fetching all flights for admin: {e}")
        return []
    finally:
        if conn:
            conn.close()

def get_flight_by_id_admin(flight_id):
    conn = _get_db_connection()
    try:
        flight = conn.execute(
            """
            SELECT 
                f.*, 
                dep.iata_code as departure_airport_iata,
                arr.iata_code as arrival_airport_iata
            FROM flights f
            LEFT JOIN airports dep ON f.departure_airport_id = dep.id
            LEFT JOIN airports arr ON f.arrival_airport_id = arr.id
            WHERE f.id = ?
            """, (flight_id,)).fetchone()
        
        if flight:
            flight_dict = dict(flight)
            try:
                dt_dep = datetime.fromisoformat(flight_dict['departure_time'])
                dt_arr = datetime.fromisoformat(flight_dict['arrival_time'])
                flight_dict['departureDate'] = dt_dep.strftime('%Y-%m-%d')
                flight_dict['departureTime'] = dt_dep.strftime('%H:%M')
                flight_dict['arrivalDate'] = dt_arr.strftime('%Y-%m-%d')
                flight_dict['arrivalTime'] = dt_arr.strftime('%H:%M')
            except (TypeError, ValueError):
                pass # Giữ nguyên nếu không parse được, hoặc gán None
            return flight_dict
        return None
    except Exception as e:
        print(f"Error fetching flight by ID {flight_id} for admin: {e}")
        return None
    finally:
        if conn:
            conn.close()

def update_flight(flight_id, flight_data):
    conn = _get_db_connection()
    try:
        departure_datetime_iso = combine_datetime_str(flight_data.get('departureDate'), flight_data.get('departureTime'))
        arrival_datetime_iso = combine_datetime_str(flight_data.get('arrivalDate'), flight_data.get('arrivalTime'))

        if not all([departure_datetime_iso, arrival_datetime_iso]):
            raise ValueError("Ngày giờ đi hoặc đến không hợp lệ cho việc cập nhật.")

        fields_to_update = []
        params = []
        
        # Các trường có thể được admin cập nhật từ form `flights.html`
        # Giá trị key trong flight_data phải khớp với tên id/name của input field trên form
        # Ví dụ: 'flightNumber', 'aircraftType', 'departureAirport' (IATA), 'arrivalAirport' (IATA),
        # 'departureDate', 'departureTime', 'arrivalDate', 'arrivalTime',
        # 'basePrice' (cho economy_price), 'totalSeats', 'flightStatus'
        
        if 'flight_number' in flight_data:
            fields_to_update.append("flight_number = ?")
            params.append(flight_data['flight_number'])
        if 'aircraft_type' in flight_data:
            fields_to_update.append("aircraft_type = ?")
            params.append(flight_data['aircraft_type'])
        if 'departure_airport_id' in flight_data: # API controller sẽ chuyển đổi IATA sang ID
            fields_to_update.append("departure_airport_id = ?")
            params.append(flight_data['departure_airport_id'])
        if 'arrival_airport_id' in flight_data: # API controller sẽ chuyển đổi IATA sang ID
            fields_to_update.append("arrival_airport_id = ?")
            params.append(flight_data['arrival_airport_id'])
        
        fields_to_update.append("departure_time = ?")
        params.append(departure_datetime_iso)
        fields_to_update.append("arrival_time = ?")
        params.append(arrival_datetime_iso)

        if 'basePrice' in flight_data: # basePrice từ form admin là economy_price
            fields_to_update.append("economy_price = ?")
            params.append(float(flight_data['basePrice']))
        # Giả sử business và first_class_price được cập nhật riêng hoặc không có trong form này
        # Nếu có trong form, bạn sẽ thêm tương tự:
        # if 'business_price' in flight_data:
        #     fields_to_update.append("business_price = ?")
        #     params.append(float(flight_data['business_price']))
        # if 'first_class_price' in flight_data:
        #     fields_to_update.append("first_class_price = ?")
        #     params.append(float(flight_data['first_class_price']))

        if 'total_seats' in flight_data:
            fields_to_update.append("total_seats = ?")
            params.append(int(flight_data['total_seats']))
            # Cần logic cập nhật available_seats nếu total_seats thay đổi và nhỏ hơn số vé đã bán
            # Tạm thời đơn giản: không tự động cập nhật available_seats dựa trên total_seats thay đổi ở đây.
            # Điều này nên được xử lý cẩn thận hơn trong thực tế.
        if 'available_seats' in flight_data: # Cho phép admin sửa trực tiếp (cẩn thận)
             fields_to_update.append("available_seats = ?")
             params.append(int(flight_data['available_seats']))
        if 'status' in flight_data:
            fields_to_update.append("status = ?")
            params.append(flight_data['status'])
        
        if not fields_to_update:
            return False

        params.append(datetime.now().isoformat()) # Cho updated_at
        params.append(flight_id)
        query = f"UPDATE flights SET {', '.join(fields_to_update)}, updated_at = ? WHERE id = ?"
        
        conn.execute(query, tuple(params))
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(f"Database error updating flight {flight_id}: {e}")
        raise
    except ValueError as ve:
        print(f"Data error updating flight {flight_id}: {ve}")
        raise
    finally:
        if conn:
            conn.close()

def delete_flight(flight_id):
    conn = _get_db_connection()
    try:
        # Kiểm tra xem có booking nào liên quan không trước khi xóa
        # Hoặc dựa vào ràng buộc khóa ngoại và bắt IntegrityError
        conn.execute("DELETE FROM flights WHERE id = ?", (flight_id,))
        conn.commit()
        # Kiểm tra xem có dòng nào thực sự bị xóa không
        return conn.changes() > 0 
    except sqlite3.IntegrityError:
        print(f"Cannot delete flight {flight_id}: it has associated bookings.")
        return False # Hoặc ném lỗi cụ thể hơn
    except Exception as e:
        print(f"Error deleting flight {flight_id}: {e}")
        return False
    finally:
        if conn:
            conn.close()