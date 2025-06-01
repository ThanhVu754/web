# app/models/booking_model.py
import sqlite3
from flask import current_app
from datetime import datetime
import random
import string
from app.models import flight_model # Cần để lấy thông tin chuyến bay và cập nhật ghế

def _get_db_connection():
    """Hàm tiện ích nội bộ để lấy kết nối DB."""
    conn = sqlite3.connect(current_app.config['DATABASE_PATH'])
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def generate_pnr(length=6):
    """Tạo mã đặt chỗ (PNR) ngẫu nhiên."""
    # Ví dụ: SA + 4 chữ số ngẫu nhiên + 2 chữ cái ngẫu nhiên
    # Cho demo, bạn có thể làm đơn giản hơn hoặc phức tạp hơn nếu muốn đảm bảo tính duy nhất cao
    # Cần kiểm tra tính duy nhất trong DB trong môi trường production
    prefix = "SA"
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    return prefix + random_part

def create_booking(user_id, flight_id, passengers_data, seat_class_booked, 
                   num_adults, num_children, num_infants, payment_method, 
                   promotion_id=None, discount_applied=0):
    """
    Tạo một đặt chỗ mới.
    passengers_data: list của các dict, mỗi dict chứa thông tin một hành khách 
                     (ví dụ: {'full_name': ..., 'email': ..., 'phone': ..., 'type': 'adult'})
    """
    conn = _get_db_connection()
    pnr = generate_pnr() # Tạo PNR

    # --- Bắt đầu Transaction ---
    try:
        conn.execute("BEGIN")

        # 1. Lấy thông tin chuyến bay và giá vé
        # Chúng ta cần một hàm trong flight_model để lấy chi tiết chuyến bay bằng ID
        # Giả sử flight_model.get_flight_details(flight_id) trả về đối tượng có các trường giá
        current_flight = flight_model.get_flight_details_for_booking(flight_id) # Cần tạo hàm này
        if not current_flight:
            raise ValueError("Không tìm thấy thông tin chuyến bay.")

        # 2. Kiểm tra số ghế trống
        total_passengers_count = num_adults + num_children # Em bé thường không chiếm ghế riêng
        if current_flight['available_seats'] < total_passengers_count:
            raise ValueError("Không đủ số ghế trống cho chuyến bay này.")

        # 3. Tính toán giá vé cơ bản (base_fare) và tổng tiền (total_amount)
        price_per_passenger = 0
        if seat_class_booked == "Thương gia" and current_flight.get('business_price') is not None:
            price_per_passenger = current_flight['business_price']
        elif seat_class_booked == "Hạng nhất" and current_flight.get('first_class_price') is not None:
            price_per_passenger = current_flight['first_class_price']
        else: # Mặc định hoặc Phổ thông
            price_per_passenger = current_flight['economy_price']
        
        if price_per_passenger is None or price_per_passenger < 0:
             raise ValueError("Hạng ghế không hợp lệ hoặc không có giá.")

        base_fare = price_per_passenger * total_passengers_count
        ancillary_services_total = 0 # Sẽ cập nhật nếu có dịch vụ cộng thêm ở bước này
        
        # total_amount = base_fare + ancillary_services_total - discount_applied (bỏ taxes_fees)
        total_amount = base_fare + ancillary_services_total - discount_applied


        # 4. Tạo bản ghi trong bảng 'bookings'
        booking_cursor = conn.execute(
            """
            INSERT INTO bookings (user_id, flight_id, booking_code, booking_time, 
                                  num_adults, num_children, num_infants, seat_class_booked,
                                  base_fare, ancillary_services_total, promotion_id, discount_applied, total_amount, 
                                  payment_method, payment_status, status, checkin_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, flight_id, pnr, datetime.now(),
             num_adults, num_children, num_infants, seat_class_booked,
             base_fare, ancillary_services_total, promotion_id, discount_applied, total_amount,
             payment_method, 'pending', 'pending_payment', 'not_checked_in')
        )
        booking_id = booking_cursor.lastrowid
        if not booking_id:
            raise sqlite3.Error("Không thể tạo đặt chỗ.")

        # 5. Thêm hành khách vào bảng 'passengers'
        for pax_data in passengers_data:
            # Cần tách họ và tên nếu schema.sql có first_name, last_name riêng
            # Giả sử pax_data có 'full_name', 'email', 'phone', 'type'
            conn.execute(
                """
                INSERT INTO passengers (booking_id, full_name, email, phone_number, passenger_type)
                VALUES (?, ?, ?, ?, ?)
                """,
                (booking_id, pax_data.get('full_name'), pax_data.get('email'), 
                 pax_data.get('phone_number'), pax_data.get('type', 'adult'))
            )
        
        # 6. Cập nhật số ghế trống trong bảng 'flights'
        new_available_seats = current_flight['available_seats'] - total_passengers_count
        conn.execute(
            "UPDATE flights SET available_seats = ? WHERE id = ?",
            (new_available_seats, flight_id)
        )

        # --- Kết thúc Transaction ---
        conn.commit()
        
        return {
            "booking_id": booking_id,
            "pnr": pnr,
            "total_amount": total_amount,
            "status": "pending_payment" # Hoặc 'confirmed' nếu thanh toán ngay
        }

    except ValueError as ve: # Lỗi do người dùng hoặc dữ liệu (ví dụ: hết vé)
        if conn:
            conn.rollback()
        print(f"ValueError during booking: {ve}")
        raise # Ném lại lỗi để controller có thể bắt và trả về thông báo phù hợp
    except sqlite3.Error as e: # Lỗi CSDL
        if conn:
            conn.rollback()
        print(f"Database error during booking: {e}")
        # current_app.logger.error(f"Database error during booking: {e}")
        raise # Ném lại lỗi để controller có thể bắt
    except Exception as e: # Các lỗi khác
        if conn:
            conn.rollback()
        print(f"Unexpected error during booking: {e}")
        # current_app.logger.error(f"Unexpected error during booking: {e}")
        raise # Ném lại lỗi
    finally:
        if conn:
            conn.close()
            
# app/models/booking_model.py
import sqlite3
from flask import current_app
from datetime import datetime
import random
import string
# Đảm bảo flight_model đã được import nếu bạn muốn dùng hàm từ đó
# from app.models import flight_model (flight_model không trực tiếp cần ở đây,
# nhưng các model khác có thể cần nó)

def _get_db_connection():
    """Hàm tiện ích nội bộ để lấy kết nối DB."""
    conn = sqlite3.connect(current_app.config['DATABASE_PATH'])
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

# ... (các hàm generate_pnr, create_booking giữ nguyên như trước) ...
def generate_pnr(length=6):
    prefix = "SA"
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    return prefix + random_part

def create_booking(user_id, flight_id, passengers_data, seat_class_booked, 
                   num_adults, num_children, num_infants, payment_method, 
                   promotion_id=None, discount_applied=0):
    conn = _get_db_connection()
    pnr = generate_pnr() 

    try:
        conn.execute("BEGIN")
        # Giả sử flight_model.get_flight_details_for_booking đã được import và hoạt động
        # hoặc bạn có thể query trực tiếp ở đây nếu không muốn phụ thuộc flight_model
        flight_details_query = """
            SELECT economy_price, business_price, first_class_price, available_seats 
            FROM flights 
            WHERE id = ?
        """
        current_flight = conn.execute(flight_details_query, (flight_id,)).fetchone()

        if not current_flight:
            raise ValueError("Không tìm thấy thông tin chuyến bay.")

        total_passengers_count = num_adults + num_children
        if current_flight['available_seats'] < total_passengers_count:
            raise ValueError("Không đủ số ghế trống cho chuyến bay này.")

        price_per_passenger = 0
        if seat_class_booked == "Thương gia" and current_flight.get('business_price') is not None:
            price_per_passenger = current_flight['business_price']
        elif seat_class_booked == "Hạng nhất" and current_flight.get('first_class_price') is not None:
            price_per_passenger = current_flight['first_class_price']
        else:
            price_per_passenger = current_flight['economy_price']
        
        if price_per_passenger is None or price_per_passenger < 0:
             raise ValueError("Hạng ghế không hợp lệ hoặc không có giá.")

        base_fare = price_per_passenger * total_passengers_count
        ancillary_services_total = 0
        total_amount = base_fare + ancillary_services_total - discount_applied

        booking_cursor = conn.execute(
            """
            INSERT INTO bookings (user_id, flight_id, booking_code, booking_time, 
                                  num_adults, num_children, num_infants, seat_class_booked,
                                  base_fare, ancillary_services_total, promotion_id, discount_applied, total_amount, 
                                  payment_method, payment_status, status, checkin_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, flight_id, pnr, datetime.now(),
             num_adults, num_children, num_infants, seat_class_booked,
             base_fare, ancillary_services_total, promotion_id, discount_applied, total_amount,
             payment_method, 'pending', 'pending_payment', 'not_checked_in')
        )
        booking_id = booking_cursor.lastrowid
        if not booking_id:
            raise sqlite3.Error("Không thể tạo đặt chỗ.")

        for pax_data in passengers_data:
            conn.execute(
                """
                INSERT INTO passengers (booking_id, full_name, email, phone_number, passenger_type)
                VALUES (?, ?, ?, ?, ?)
                """,
                (booking_id, pax_data.get('full_name'), pax_data.get('email'), 
                 pax_data.get('phone_number'), pax_data.get('type', 'adult'))
            )
        
        new_available_seats = current_flight['available_seats'] - total_passengers_count
        conn.execute(
            "UPDATE flights SET available_seats = ? WHERE id = ?",
            (new_available_seats, flight_id)
        )
        conn.commit()
        return { "booking_id": booking_id, "pnr": pnr, "total_amount": total_amount, "status": "pending_payment" }
    except ValueError as ve:
        if conn: conn.rollback()
        print(f"ValueError during booking: {ve}")
        raise
    except sqlite3.Error as e:
        if conn: conn.rollback()
        print(f"Database error during booking: {e}")
        raise
    except Exception as e:
        if conn: conn.rollback()
        print(f"Unexpected error during booking: {e}")
        raise
    finally:
        if conn: conn.close()


def get_bookings_by_user_id(user_id):
    """
    Lấy tất cả các đặt chỗ của một người dùng, bao gồm thông tin chuyến bay và sân bay.
    """
    conn = _get_db_connection()
    bookings_list = []
    try:
        query = """
            SELECT
                b.id as booking_id, b.booking_code as pnr, b.booking_time,
                b.num_adults, b.num_children, b.num_infants, b.seat_class_booked,
                b.base_fare, b.ancillary_services_total, b.discount_applied, b.total_amount,
                b.payment_method, b.payment_status, b.status as booking_status, b.checkin_status,
                f.flight_number, f.departure_time, f.arrival_time,
                dep_airport.name as departure_airport_name, dep_airport.city as departure_city, dep_airport.iata_code as departure_iata,
                arr_airport.name as arrival_airport_name, arr_airport.city as arrival_city, arr_airport.iata_code as arrival_iata,
                (SELECT GROUP_CONCAT(p.full_name || ' (' || p.passenger_type || ')', '; ') 
                 FROM passengers p WHERE p.booking_id = b.id) as passengers_list_str
            FROM bookings b
            JOIN flights f ON b.flight_id = f.id
            JOIN airports dep_airport ON f.departure_airport_id = dep_airport.id
            JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.id
            WHERE b.user_id = ?
            ORDER BY b.booking_time DESC;
        """
        cursor = conn.execute(query, (user_id,))
        raw_bookings = cursor.fetchall()

        for row in raw_bookings:
            booking_dict = dict(row) # Chuyển sqlite3.Row thành dict
            
            # Định dạng lại thời gian và tính toán thời gian bay cho dễ hiển thị
            try:
                dt_dep = datetime.fromisoformat(booking_dict['departure_time'])
                dt_arr = datetime.fromisoformat(booking_dict['arrival_time'])
                booking_dict['departure_datetime_formatted'] = dt_dep.strftime('%H:%M, %A, %d/%m/%Y') #Thêm thứ trong tuần
                booking_dict['arrival_datetime_formatted'] = dt_arr.strftime('%H:%M, %A, %d/%m/%Y')
                
                duration = dt_arr - dt_dep
                hours = duration.seconds // 3600
                minutes = (duration.seconds % 3600) // 60
                booking_dict['duration_formatted'] = f"{hours} giờ {minutes} phút"
                
                # Xử lý danh sách hành khách
                if booking_dict['passengers_list_str']:
                    booking_dict['passengers'] = [
                        {"name": name_type.split(' (')[0], "type": name_type.split(' (')[1][:-1]}
                        for name_type in booking_dict['passengers_list_str'].split('; ')
                    ]
                else:
                    booking_dict['passengers'] = []

            except (ValueError, TypeError) as e:
                 current_app.logger.error(f"Error formatting date/time for booking {booking_dict['pnr']}: {e}")
                 booking_dict['departure_datetime_formatted'] = booking_dict['departure_time']
                 booking_dict['arrival_datetime_formatted'] = booking_dict['arrival_time']
                 booking_dict['duration_formatted'] = "N/A"
                 booking_dict['passengers'] = []


            # Thêm các trường giả lập cho giống mock data của my_flights_script.js
            # Bạn có thể tùy chỉnh dựa trên dữ liệu thực tế và nhu cầu hiển thị
            booking_dict['statusClass'] = "status-confirmed-vj" if booking_dict['booking_status'] == 'confirmed' else ("status-cancelled-vj" if booking_dict['booking_status'] == 'cancelled_by_user' else "status-pending-vj")
            booking_dict['paymentStatusClass'] = "status-paid-vj" if booking_dict['payment_status'] == 'paid' else ""
            booking_dict['bookedServices'] = [] # Cần query từ bảng booking_ancillary_services và booking_menu_items
            booking_dict['currentSeat'] = None # Cần query từ bảng passengers hoặc booking_ancillary_services

            bookings_list.append(booking_dict)
            
        return bookings_list
    except Exception as e:
        print(f"Error fetching bookings for user {user_id}: {e}")
        # current_app.logger.error(f"Error fetching bookings for user {user_id}: {e}")
        return []
    finally:
        if conn:
            conn.close()