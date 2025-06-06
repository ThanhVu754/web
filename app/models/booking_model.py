# app/models/booking_model.py
import sqlite3
from flask import current_app
from datetime import datetime
import random
import string
from app.models import flight_model
# Đảm bảo flight_model đã được import nếu bạn muốn dùng hàm từ đó
# from app.models import flight_model (flight_model không trực tiếp cần ở đây,
# nhưng các model khác có thể cần nó)

def _get_db_connection():
    """Hàm tiện ích nội bộ để lấy kết nối DB."""
    conn = sqlite3.connect(current_app.config['DATABASE_PATH'])
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


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

        flight_details_query = """
            SELECT economy_price, business_price, first_class_price, available_seats 
            FROM flights 
            WHERE id = ?
        """
        current_flight = conn.execute(flight_details_query, (flight_id,)).fetchone()

        if not current_flight:
            conn.rollback() # Hoàn tác transaction
            raise ValueError("Không tìm thấy thông tin chuyến bay.")

        total_passengers_count = num_adults + num_children
        if current_flight['available_seats'] < total_passengers_count:
            conn.rollback()
            raise ValueError("Không đủ số ghế trống cho chuyến bay này.")

        price_per_passenger = 0
        # --- SỬA ĐỔI CÁCH TRUY CẬP GIÁ ---
        if seat_class_booked == "Thương gia":
            # Kiểm tra xem cột có tồn tại và giá trị có phải là None không
            if 'business_price' in current_flight.keys() and current_flight['business_price'] is not None:
                price_per_passenger = current_flight['business_price']
            else: # Nếu không có giá thương gia, có thể mặc định về phổ thông hoặc báo lỗi
                price_per_passenger = current_flight['economy_price'] 
                # current_app.logger.warning(f"Business price not found for flight {flight_id}, using economy.")
        elif seat_class_booked == "Hạng nhất":
            if 'first_class_price' in current_flight.keys() and current_flight['first_class_price'] is not None and current_flight['first_class_price'] > 0: # Hạng nhất thường có giá > 0
                price_per_passenger = current_flight['first_class_price']
            else: # Nếu không có giá hạng nhất hoặc giá là 0, mặc định về phổ thông hoặc báo lỗi
                price_per_passenger = current_flight['economy_price']
                # current_app.logger.warning(f"First class price not found/invalid for flight {flight_id}, using economy.")
        else: # Mặc định hoặc Phổ thông
            price_per_passenger = current_flight['economy_price']
        
        if price_per_passenger is None or price_per_passenger < 0: # Giá không thể âm
             conn.rollback()
             raise ValueError("Hạng ghế không hợp lệ hoặc không có giá cho chuyến bay này.")
        # --- KẾT THÚC SỬA ĐỔI CÁCH TRUY CẬP GIÁ ---

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
            conn.rollback()
            raise sqlite3.Error("Không thể tạo bản ghi đặt chỗ.")

        for pax_data in passengers_data:
            conn.execute(
                """
                INSERT INTO passengers (booking_id, full_name, passenger_type) 
                VALUES (?, ?, ?) 
                """,
                (booking_id, pax_data.get('full_name'), pax_data.get('type', 'adult'))
            )
        
        new_available_seats = current_flight['available_seats'] - total_passengers_count
        update_seats_cursor = conn.execute(
            "UPDATE flights SET available_seats = ? WHERE id = ?",
            (new_available_seats, flight_id)
        )
        if update_seats_cursor.rowcount == 0: # Không có dòng nào được cập nhật
            conn.rollback()
            raise sqlite3.Error("Không thể cập nhật số ghế trống cho chuyến bay.")


        conn.commit()
        return { "booking_id": booking_id, "pnr": pnr, "total_amount": total_amount, "status": "pending_payment" }
    except ValueError as ve:
        if conn: conn.rollback()
        current_app.logger.error(f"MODEL: ValueError during booking creation: {ve}")
        raise 
    except sqlite3.Error as e:
        if conn: conn.rollback()
        current_app.logger.error(f"MODEL: Database error during booking creation: {e}")
        raise
    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"MODEL: Unexpected error during booking creation: {e}", exc_info=True)
        raise
    finally:
        if conn:
            conn.close()


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
                dt_dep = datetime.fromisoformat(booking_dict['departure_time']) # Đảm bảo datetime đã import
                dt_arr = datetime.fromisoformat(booking_dict['arrival_time'])
                booking_dict['departure_datetime_formatted'] = dt_dep.strftime('%H:%M, %A, %d/%m/%Y')
                booking_dict['arrival_datetime_formatted'] = dt_arr.strftime('%H:%M, %A, %d/%m/%Y')
                
                duration = dt_arr - dt_dep
                total_seconds = duration.total_seconds()
                days = int(total_seconds // (24 * 3600))
                remaining_seconds_after_days = total_seconds % (24 * 3600)
                hours = int(remaining_seconds_after_days // 3600)
                remaining_seconds_after_hours = remaining_seconds_after_days % 3600
                minutes = int(remaining_seconds_after_hours // 60)

                duration_parts = []
                if days > 0:
                    duration_parts.append(f"{days} ngày")
                if hours > 0:
                    duration_parts.append(f"{hours} giờ")
                if minutes > 0 or (days == 0 and hours == 0):
                    duration_parts.append(f"{minutes} phút")
                
                booking_dict['duration_formatted'] = " ".join(duration_parts) if duration_parts else "0 phút"

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
            
            
def get_booking_by_pnr_and_lastname(pnr_code, last_name):
    """
    Lấy thông tin đặt chỗ dựa trên PNR và Họ của một hành khách trong đặt chỗ đó.
    """
    conn = _get_db_connection()
    try:
        # Bước 1: Tìm booking dựa trên PNR
        booking_query = """
            SELECT
                b.id as booking_id, b.booking_code as pnr, b.booking_time,
                b.num_adults, b.num_children, b.num_infants, b.seat_class_booked,
                b.base_fare, b.ancillary_services_total, b.discount_applied, b.total_amount,
                b.payment_method, b.payment_status, b.status as booking_status, b.checkin_status,
                f.flight_number, f.departure_time, f.arrival_time,
                dep_airport.name as departure_airport_name, dep_airport.city as departure_city, dep_airport.iata_code as departure_iata,
                arr_airport.name as arrival_airport_name, arr_airport.city as arrival_city, arr_airport.iata_code as arrival_iata,
                u.full_name as booker_full_name, u.email as booker_email -- Lấy thêm thông tin người đặt vé
            FROM bookings b
            JOIN flights f ON b.flight_id = f.id
            JOIN airports dep_airport ON f.departure_airport_id = dep_airport.id
            JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.id
            LEFT JOIN users u ON b.user_id = u.id -- LEFT JOIN để vẫn lấy được booking nếu user_id là NULL
            WHERE b.booking_code = ?;
        """
        booking_row = conn.execute(booking_query, (pnr_code.upper(),)).fetchone()

        if not booking_row:
            return None # Không tìm thấy booking với PNR này

        booking_dict = dict(booking_row)

        # Bước 2: Kiểm tra xem có hành khách nào trong booking này có Họ khớp không
        # (So sánh không phân biệt chữ hoa/thường)
        passenger_check_query = """
            SELECT 1 FROM passengers 
            WHERE booking_id = ? AND UPPER(last_name) = ? 
            LIMIT 1; 
        """
        # Giả sử bạn đã có cột last_name trong bảng passengers. 
        # Nếu chỉ có full_name, bạn cần dùng LIKE: UPPER(full_name) LIKE '%' || ? || '%' (kém chính xác hơn)
        # Hoặc frontend gửi full_name và backend tách họ để so sánh.
        # Tạm thời giả định có cột last_name.
        passenger_exists = conn.execute(passenger_check_query, (booking_dict['booking_id'], last_name.upper())).fetchone()

        if not passenger_exists:
            current_app.logger.info(f"Booking {pnr_code} found, but no passenger with last name '{last_name}'.")
            return None # Tìm thấy booking nhưng không có hành khách nào khớp họ

        # Bước 3: Lấy danh sách hành khách cho booking này
        passengers_query = "SELECT full_name, passenger_type FROM passengers WHERE booking_id = ?"
        passengers_raw = conn.execute(passengers_query, (booking_dict['booking_id'],)).fetchall()
        booking_dict['passengers'] = [dict(p) for p in passengers_raw]
        
        # Bước 4: Định dạng thời gian và tính duration (tương tự như get_bookings_by_user_id)
        try:
            dt_dep = datetime.fromisoformat(booking_dict['departure_time']) # Đảm bảo datetime được import
            dt_arr = datetime.fromisoformat(booking_dict['arrival_time'])
            booking_dict['departure_datetime_formatted'] = dt_dep.strftime('%H:%M, %A, %d/%m/%Y')
            booking_dict['arrival_datetime_formatted'] = dt_arr.strftime('%H:%M, %A, %d/%m/%Y')
            duration = dt_arr - dt_dep
            total_seconds = duration.total_seconds()
            days = int(total_seconds // (24 * 3600))
            # ... (phần tính hours, minutes và duration_formatted như trong get_bookings_by_user_id)
            hours = int((total_seconds % (24 * 3600)) // 3600)
            minutes = int((total_seconds % 3600) // 60)
            duration_parts = []
            if days > 0: duration_parts.append(f"{days} ngày")
            if hours > 0: duration_parts.append(f"{hours} giờ")
            if minutes > 0 or (days == 0 and hours == 0): duration_parts.append(f"{minutes} phút")
            booking_dict['duration_formatted'] = " ".join(duration_parts) if duration_parts else "0 phút"

        except (ValueError, TypeError) as e:
             current_app.logger.error(f"Error formatting date/time for booking PNR {pnr_code}: {e}")
             booking_dict['duration_formatted'] = "N/A"
        
        # Thêm các trường giả lập khác nếu cần để khớp với renderFlightCard
        booking_dict['statusClass'] = "status-confirmed-vj" if booking_dict['booking_status'] == 'confirmed' else ("status-cancelled-vj" if booking_dict['booking_status'] == 'cancelled_by_user' else "status-pending-vj")
        booking_dict['paymentStatusClass'] = "status-paid-vj" if booking_dict['payment_status'] == 'paid' else ""
        booking_dict['bookedServices'] = [] # Cần query từ bảng booking_ancillary_services
        booking_dict['currentSeat'] = None # Cần query từ bảng passengers hoặc booking_ancillary_services

        return booking_dict

    except Exception as e:
        current_app.logger.error(f"Error fetching booking by PNR {pnr_code} and lastname {last_name}: {e}", exc_info=True)
        return None
    finally:
        if conn:
            conn.close()
            
            
def get_all_bookings_admin(search_term=None, status_filter=None, flight_date_filter=None):
    conn = _get_db_connection()
    bookings_list = []
    try:
        query_params = []
        # Sửa lại phần SELECT email và phần search liên quan đến email hành khách
        base_query = """
            SELECT
                b.id as booking_id, b.booking_code as pnr,
                COALESCE(u.full_name, 
                    (SELECT p_main.full_name FROM passengers p_main WHERE p_main.booking_id = b.id ORDER BY p_main.id LIMIT 1)
                ) as passenger_name, -- Lấy tên người đặt hoặc tên hành khách đầu tiên
                u.email as email, -- Chỉ lấy email từ bảng users (người đặt vé nếu có user_id)
                f.flight_number, 
                dep_airport.iata_code || ' → ' || arr_airport.iata_code as itinerary,
                strftime('%Y-%m-%d', f.departure_time) as flight_date,
                b.total_amount, b.status as booking_status, 
                strftime('%Y-%m-%d %H:%M', b.booking_time) as created_at_formatted
            FROM bookings b
            JOIN flights f ON b.flight_id = f.id
            JOIN airports dep_airport ON f.departure_airport_id = dep_airport.id
            JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.id
            LEFT JOIN users u ON b.user_id = u.id
        """
        conditions = []

        if search_term:
            like_term = f"%{search_term}%"
            # Bỏ phần tìm kiếm email trong bảng passengers
            conditions.append("(b.booking_code LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)")
            query_params.extend([like_term, like_term, like_term])
        
        if status_filter:
            conditions.append("b.status = ?")
            query_params.append(status_filter)
        
        if flight_date_filter:
            conditions.append("date(f.departure_time) = ?")
            query_params.append(flight_date_filter)

        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)
        
        base_query += " ORDER BY b.booking_time DESC"
        
        current_app.logger.info(f"Admin fetching all bookings. Query: {base_query}, Params: {query_params}")
        cursor = conn.execute(base_query, tuple(query_params))
        raw_bookings = cursor.fetchall()
        for row in raw_bookings:
            bookings_list.append(dict(row))
        return bookings_list
    except Exception as e:
        current_app.logger.error(f"Error fetching all bookings for admin: {e}", exc_info=True)
        return []
    finally:
        if conn:
            conn.close()

def get_booking_details_admin(booking_id_or_pnr):
    """
    Lấy chi tiết một đặt chỗ bằng ID hoặc PNR cho admin.
    Hàm này có thể giống với get_booking_by_pnr_and_lastname nhưng không cần last_name.
    Hoặc có thể lấy thêm thông tin admin cần.
    """
    conn = _get_db_connection()
    try:
        booking_id = int(booking_id_or_pnr) 

        query = """
            SELECT
                b.*, 
                f.flight_number, f.departure_time, f.arrival_time,
                dep_airport.name as departure_airport_name, dep_airport.city as departure_city, dep_airport.iata_code as departure_iata,
                arr_airport.name as arrival_airport_name, arr_airport.city as arrival_city, arr_airport.iata_code as arrival_iata,
                u.full_name as booker_full_name, u.email as booker_email, u.phone_number as booker_phone
            FROM bookings b
            JOIN flights f ON b.flight_id = f.id
            JOIN airports dep_airport ON f.departure_airport_id = dep_airport.id
            JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.id
            LEFT JOIN users u ON b.user_id = u.id
            WHERE b.id = ?;
        """
        booking_row = conn.execute(query, (booking_id,)).fetchone()

        if not booking_row:
            return None
        booking_dict = dict(booking_row)

        passengers_query = "SELECT id, full_name, passenger_type, seat_assigned FROM passengers WHERE booking_id = ?" # Bỏ email, phone_number
        passengers_raw = conn.execute(passengers_query, (booking_id,)).fetchall()
        booking_dict['passengers'] = [dict(p) for p in passengers_raw]

        # (Tùy chọn) Lấy danh sách dịch vụ đã đặt (ancillary_services, menu_items)
        # booking_dict['ancillary_services_booked'] = ...
        # booking_dict['menu_items_booked'] = ...
        
        # Định dạng lại thời gian nếu cần
        try:
            dt_dep = datetime.fromisoformat(booking_dict['departure_time'])
            dt_arr = datetime.fromisoformat(booking_dict['arrival_time'])
            booking_dict['departure_datetime_formatted'] = dt_dep.strftime('%H:%M, %A, %d/%m/%Y')
            booking_dict['arrival_datetime_formatted'] = dt_arr.strftime('%H:%M, %A, %d/%m/%Y')
            duration = dt_arr - dt_arr # Lỗi typo ở đây, phải là dt_arr - dt_dep
            duration = dt_arr - dt_dep # Sửa lại
            total_seconds = duration.total_seconds()
            days = int(total_seconds // (24 * 3600))
            hours = int((total_seconds % (24 * 3600)) // 3600)
            minutes = int((total_seconds % 3600) // 60)
            duration_parts = []
            if days > 0: duration_parts.append(f"{days} ngày")
            if hours > 0: duration_parts.append(f"{hours} giờ")
            if minutes > 0 or (days == 0 and hours == 0): duration_parts.append(f"{minutes} phút")
            booking_dict['duration_formatted'] = " ".join(duration_parts) if duration_parts else "0 phút"
        except (ValueError, TypeError):
            pass

        return booking_dict
    except Exception as e:
        current_app.logger.error(f"Error fetching booking details for admin (ID/PNR {booking_id_or_pnr}): {e}", exc_info=True)
        return None
    finally:
        if conn:
            conn.close()

def update_booking_status_admin(booking_id, new_status, admin_notes=None):
    """
    Admin cập nhật trạng thái của một đặt chỗ.
    Lưu ý: Cần kiểm tra xem new_status có hợp lệ không (trong CHECK constraint của bảng bookings).
    """
    conn = _get_db_connection()
    # Các trạng thái hợp lệ từ schema
    valid_statuses = ['pending_payment', 'confirmed', 'cancelled_by_user', 
                      'cancelled_by_airline', 'completed', 'payment_received', 'no_show'] 
    if new_status not in valid_statuses:
        raise ValueError(f"Trạng thái '{new_status}' không hợp lệ.")

    try:
        # Có thể thêm logic ghi log vào một bảng khác về việc ai đã thay đổi trạng thái và ghi chú
        # Hiện tại, bảng bookings có cột 'notes', có thể dùng để lưu admin_notes
        
        # Kiểm tra xem có cần cập nhật available_seats không
        # Ví dụ: nếu chuyển từ 'confirmed' sang 'cancelled_by_user' hoặc 'cancelled_by_airline',
        # thì cần tăng lại available_seats của chuyến bay.
        # Logic này có thể phức tạp và cần cẩn thận. Tạm thời bỏ qua việc tự động cập nhật ghế khi chỉ đổi status.

        query = "UPDATE bookings SET status = ?, updated_at = datetime('now', 'localtime')"
        params = [new_status]
        
        if admin_notes is not None: # Chỉ cập nhật notes nếu được cung cấp
            query += ", notes = ?"
            params.append(admin_notes)
        
        query += " WHERE id = ?"
        params.append(booking_id)

        cursor = conn.execute(query, tuple(params))
        conn.commit()
        return cursor.rowcount > 0 # True nếu có dòng được cập nhật
    except sqlite3.Error as e:
        current_app.logger.error(f"DB Error updating booking status for ID {booking_id} to {new_status}: {e}", exc_info=True)
        if conn: conn.rollback()
        raise # Ném lại để controller xử lý
    except Exception as e:
        current_app.logger.error(f"Error updating booking status for ID {booking_id}: {e}", exc_info=True)
        if conn: conn.rollback()
        raise
    finally:
        if conn:
            conn.close()