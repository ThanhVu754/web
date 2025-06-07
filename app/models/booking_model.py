# app/models/booking_model.py
import sqlite3
from flask import current_app
from datetime import datetime
import random
import string
from app.models import flight_model
from datetime import datetime
import random

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
    pnr = generate_pnr() # Đảm bảo hàm generate_pnr() đã được định nghĩa

    try:
        conn.execute("BEGIN") # Bắt đầu transaction

        # Bước 1 & 2: Lấy chi tiết chuyến bay và kiểm tra ghế trống (giữ nguyên)
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
            raise ValueError(f"Không đủ số ghế trống. Chỉ còn {current_flight['available_seats']} ghế.")

        # Bước 3: Tính toán giá vé (giữ nguyên)
        price_per_passenger = 0
        if seat_class_booked == "Thương gia":
            if 'business_price' in current_flight.keys() and current_flight['business_price'] is not None and current_flight['business_price'] > 0:
                price_per_passenger = current_flight['business_price']
            else:
                price_per_passenger = current_flight['economy_price']
        elif seat_class_booked == "Hạng nhất":
            if 'first_class_price' in current_flight.keys() and current_flight['first_class_price'] is not None and current_flight['first_class_price'] > 0:
                price_per_passenger = current_flight['first_class_price']
            else:
                price_per_passenger = current_flight['economy_price']
        else: # Mặc định hoặc Phổ thông
            price_per_passenger = current_flight['economy_price']
        
        if price_per_passenger is None or price_per_passenger < 0:
             raise ValueError("Hạng ghế không hợp lệ hoặc không có giá cho chuyến bay này.")

        base_fare = price_per_passenger * total_passengers_count
        ancillary_services_total = 0 
        total_amount = base_fare + ancillary_services_total - discount_applied

        # Bước 4: Tạo bản ghi đặt chỗ với trạng thái ĐÃ THANH TOÁN và ĐÃ XÁC NHẬN
        # --- QUAY LẠI TRẠNG THÁI BAN ĐẦU KHI TẠO ---
        initial_booking_status = 'pending_payment' 
        initial_payment_status = 'pending'
        # ----------------------------------------------

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
             payment_method, initial_payment_status, initial_booking_status, 'not_checked_in')
        )
        booking_id = booking_cursor.lastrowid
        if not booking_id:
            raise sqlite3.Error("Không thể tạo bản ghi đặt chỗ.")

        # Bước 5: Thêm hành khách vào bảng 'passengers' (giữ nguyên)
        for pax_data in passengers_data:
            conn.execute(
                """
                INSERT INTO passengers (booking_id, full_name, passenger_type) 
                VALUES (?, ?, ?) 
                """,
                (booking_id, pax_data.get('full_name'), pax_data.get('type', 'adult'))
            )
        
        # Bước 6: Cập nhật số ghế trống (giữ nguyên)
        new_available_seats = current_flight['available_seats'] - total_passengers_count
        update_seats_cursor = conn.execute(
            "UPDATE flights SET available_seats = ? WHERE id = ?",
            (new_available_seats, flight_id)
        )
        if update_seats_cursor.rowcount == 0:
            raise sqlite3.Error("Không thể cập nhật số ghế trống cho chuyến bay.")

        conn.commit() # Commit toàn bộ transaction
        
        # Trả về thông tin với trạng thái đã được cập nhật
        return { 
            "booking_id": booking_id, 
            "pnr": pnr, 
            "total_amount": total_amount, 
            "status": initial_booking_status, 
            "payment_status": initial_payment_status 
        }
    except (ValueError, sqlite3.Error) as e:
        if conn: conn.rollback() # Hoàn tác nếu có lỗi
        current_app.logger.error(f"MODEL: Lỗi trong quá trình tạo booking: {e}", exc_info=True)
        raise # Ném lại lỗi để controller xử lý
    finally:
        if conn:
            conn.close()


def process_booking_payment(booking_id, user_id):
    """
    Mô phỏng việc xử lý thanh toán thành công.
    Cập nhật trạng thái booking thành 'confirmed' và payment_status thành 'paid'.
    """
    conn = _get_db_connection()
    try:
        # Kiểm tra xem booking có thuộc về user không và có đang ở trạng thái chờ không
        current_booking = conn.execute(
            "SELECT status FROM bookings WHERE id = ? AND user_id = ?", 
            (booking_id, user_id)
        ).fetchone()
        if not current_booking:
            raise ValueError("Không tìm thấy đặt chỗ hoặc bạn không có quyền thanh toán.")
        if current_booking['status'] != 'pending_payment':
            raise ValueError(f"Không thể thanh toán cho đặt chỗ đã ở trạng thái '{current_booking['status']}'.")

        # Cập nhật trạng thái
        cursor = conn.execute(
            "UPDATE bookings SET status = 'confirmed', payment_status = 'paid', updated_at = datetime('now', 'localtime') WHERE id = ?",
            (booking_id,)
        )
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error processing payment for booking {booking_id}: {e}", exc_info=True)
        raise
    finally:
        if conn: conn.close()


def get_bookings_by_user_id(user_id):
    """
    Lấy tất cả các đặt chỗ của một người dùng,
    LOẠI TRỪ những đặt chỗ đã bị chính người dùng hủy.
    """
    conn = _get_db_connection()
    try:
        query = """
            SELECT
                b.id as booking_id, b.booking_code as pnr, b.booking_time,
                b.seat_class_booked, b.base_fare, b.ancillary_services_total, 
                b.discount_applied, b.total_amount, b.payment_status, b.status as booking_status, b.checkin_status,
                f.flight_number, f.departure_time, f.arrival_time,
                dep_airport.city as departure_city, dep_airport.iata_code as departure_iata,
                arr_airport.city as arrival_city, arr_airport.iata_code as arrival_iata
            FROM bookings b
            JOIN flights f ON b.flight_id = f.id
            JOIN airports dep_airport ON f.departure_airport_id = dep_airport.id
            JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.id
            WHERE b.user_id = ? AND b.status != 'cancelled_by_user' -- <<< THÊM ĐIỀU KIỆN NÀY
            ORDER BY f.departure_time DESC;
        """
        raw_bookings = conn.execute(query, (user_id,)).fetchall()
        bookings_list = []
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
    """
    Lấy danh sách tất cả các đặt chỗ cho admin, có tìm kiếm, lọc.
    """
    conn = _get_db_connection()
    bookings_list = []
    try:
        query_params = []
        # Query này JOIN các bảng để lấy thông tin tóm tắt cần thiết cho bảng quản lý
        base_query = """
            SELECT
                b.id as booking_id, b.booking_code as pnr,
                COALESCE(u.full_name, (SELECT p_contact.full_name FROM passengers p_contact 
                                       WHERE p_contact.booking_id = b.id ORDER BY p_contact.id LIMIT 1)
                ) as passenger_name, -- Tên người đặt hoặc hành khách đầu tiên
                u.email as email, -- Chỉ lấy email từ bảng users (người đặt vé nếu có)
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

def get_booking_details_admin(booking_id):
    """
    Lấy chi tiết một đặt chỗ bằng ID cho admin.
    Hàm này cũng được dùng để lấy dữ liệu cho check-in.
    """
    conn = _get_db_connection()
    try:
        query = """
            SELECT
                b.id as booking_id, -- <<< ĐẢM BẢO CÓ DÒNG NÀY
                b.booking_code as pnr,
                b.status as booking_status,
                b.payment_status,
                b.checkin_status,
                b.seat_class_booked,
                f.flight_number, f.departure_time, f.arrival_time,
                dep_airport.city as departure_city, dep_airport.iata_code as departure_iata,
                arr_airport.city as arrival_city, arr_airport.iata_code as arrival_iata,
                u.full_name as booker_full_name, u.email as booker_email
                -- Thêm các cột khác từ bảng bookings và flights nếu cần
            FROM bookings b
            JOIN flights f ON b.flight_id = f.id
            JOIN airports dep_airport ON f.departure_airport_id = dep_airport.id
            JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.id
            LEFT JOIN users u ON b.user_id = u.id
            WHERE b.id = ?;
        """
        booking_row = conn.execute(query, (int(booking_id),)).fetchone()

        if not booking_row:
            return None

        booking_dict = dict(booking_row)

        # Lấy danh sách hành khách
        passengers_raw = conn.execute("SELECT * FROM passengers WHERE booking_id = ?", (booking_id,)).fetchall()
        booking_dict['passengers'] = [dict(pax) for pax in passengers_raw]
        
        # Xử lý định dạng thời gian và tính duration (tái sử dụng logic đã có)
        try:
            dt_dep = datetime.fromisoformat(booking_dict['departure_time'])
            dt_arr = datetime.fromisoformat(booking_dict['arrival_time'])
            booking_dict['departure_datetime_formatted'] = dt_dep.strftime('%H:%M, %A, %d/%m/%Y')
            booking_dict['arrival_datetime_formatted'] = dt_arr.strftime('%H:%M, %A, %d/%m/%Y')
            duration = dt_arr - dt_dep
            # ... (logic tính duration_formatted như cũ) ...
            total_seconds = duration.total_seconds()
            days = int(total_seconds // 86400); hours = int((total_seconds % 86400) // 3600); minutes = int((total_seconds % 3600) // 60)
            duration_parts = [];
            if days > 0: duration_parts.append(f"{days} ngày")
            if hours > 0: duration_parts.append(f"{hours} giờ")
            if minutes > 0 or (days == 0 and hours == 0): duration_parts.append(f"{minutes} phút")
            booking_dict['duration_formatted'] = " ".join(duration_parts) if duration_parts else "0 phút"
        except (ValueError, TypeError):
            booking_dict['duration_formatted'] = "N/A"

        return booking_dict
    except Exception as e:
        current_app.logger.error(f"Error fetching booking details for admin (ID {booking_id}): {e}", exc_info=True)
        return None
    finally:
        if conn:
            conn.close()

def update_booking_status_admin(booking_id, new_status, admin_notes=None):
    """
    Admin cập nhật trạng thái của một đặt chỗ.
    Thêm logic cộng trả lại ghế nếu hủy đặt chỗ.
    """
    conn = _get_db_connection()
    try:
        conn.execute("BEGIN") # Bắt đầu transaction

        # Lấy thông tin đặt chỗ hiện tại để kiểm tra
        current_booking = conn.execute("SELECT status, flight_id, num_adults, num_children FROM bookings WHERE id = ?", (booking_id,)).fetchone()
        if not current_booking:
            raise ValueError("Không tìm thấy đặt chỗ để cập nhật.")

        current_status = current_booking['status']
        
        # LOGIC CỘNG TRẢ GHẾ NẾU HỦY
        # Chỉ cộng trả ghế nếu trạng thái cũ không phải là đã hủy và trạng thái mới là đã hủy
        cancelled_statuses = ['cancelled_by_user', 'cancelled_by_airline']
        if current_status not in cancelled_statuses and new_status in cancelled_statuses:
            pax_count_to_refund = (current_booking['num_adults'] or 0) + (current_booking['num_children'] or 0)
            if pax_count_to_refund > 0:
                current_app.logger.info(f"Refunding {pax_count_to_refund} seat(s) for flight ID {current_booking['flight_id']} due to cancellation.")
                conn.execute(
                    "UPDATE flights SET available_seats = available_seats + ? WHERE id = ?",
                    (pax_count_to_refund, current_booking['flight_id'])
                )

        # Cập nhật trạng thái và ghi chú cho đặt chỗ
        query = "UPDATE bookings SET status = ?, updated_at = datetime('now', 'localtime')"
        params = [new_status]
        
        if admin_notes is not None:
            query += ", notes = ?"
            params.append(admin_notes)
        
        query += " WHERE id = ?"
        params.append(booking_id)

        cursor = conn.execute(query, tuple(params))
        
        conn.commit() # Commit transaction
        return cursor.rowcount > 0
    except Exception as e:
        if conn: conn.rollback() # Hoàn tác nếu có lỗi
        current_app.logger.error(f"Error updating booking status for ID {booking_id}: {e}", exc_info=True)
        raise
    finally:
        if conn:
            conn.close()
            

def cancel_booking_by_user(booking_id, user_id):
    """
    Người dùng tự hủy đặt chỗ của chính họ.
    Chỉ cho phép hủy nếu booking đó thuộc về user_id này.
    """
    conn = _get_db_connection()
    try:
        conn.execute("BEGIN") # Bắt đầu transaction

        # Lấy thông tin đặt chỗ hiện tại để kiểm tra chủ sở hữu và trạng thái
        query_check = "SELECT status, flight_id, num_adults, num_children FROM bookings WHERE id = ? AND user_id = ?"
        current_booking = conn.execute(query_check, (booking_id, user_id)).fetchone()
        
        if not current_booking:
            # Booking không tồn tại hoặc không thuộc về người dùng này
            raise ValueError("Không tìm thấy đặt chỗ hoặc bạn không có quyền hủy đặt chỗ này.")

        current_status = current_booking['status']
        cancellable_statuses = ['pending_payment', 'confirmed', 'payment_received']
        
        if current_status not in cancellable_statuses:
            raise ValueError(f"Không thể hủy đặt chỗ với trạng thái hiện tại là '{current_status}'.")

        # Cập nhật trạng thái booking thành 'cancelled_by_user'
        new_status = 'cancelled_by_user'
        conn.execute(
            "UPDATE bookings SET status = ?, updated_at = datetime('now', 'localtime') WHERE id = ?",
            (new_status, booking_id)
        )

        # Cộng trả lại ghế vào chuyến bay
        pax_count_to_refund = (current_booking['num_adults'] or 0) + (current_booking['num_children'] or 0)
        if pax_count_to_refund > 0:
            current_app.logger.info(f"Refunding {pax_count_to_refund} seat(s) for flight ID {current_booking['flight_id']} due to user cancellation.")
            conn.execute(
                "UPDATE flights SET available_seats = available_seats + ? WHERE id = ?",
                (pax_count_to_refund, current_booking['flight_id'])
            )

        conn.commit() # Commit transaction
        return True
    except (ValueError, sqlite3.Error) as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error cancelling booking ID {booking_id} by user ID {user_id}: {e}", exc_info=True)
        raise e # Ném lại lỗi để controller xử lý
    finally:
        if conn:
            conn.close()
            
            
def get_booking_for_checkin(pnr_code, last_name):
    """
    Lấy thông tin đặt chỗ để check-in.
    Kiểm tra các điều kiện và trả về thông báo lỗi cụ thể.
    """
    conn = _get_db_connection()
    try:
        # Bước 1: Tìm booking_id từ PNR và Họ của hành khách (giữ nguyên)
        pax_query = """
            SELECT b.id FROM bookings b
            JOIN passengers p ON b.id = p.booking_id
            WHERE b.booking_code = ? AND (p.full_name LIKE ? OR p.full_name LIKE ?)
            LIMIT 1
        """
        booking_id_row = conn.execute(pax_query, (pnr_code.upper(), f"{last_name.upper()}%", f"% {last_name.upper()}%")).fetchone()

        if not booking_id_row:
            raise ValueError("Không tìm thấy đặt chỗ phù hợp với thông tin cung cấp.")
        booking_id = booking_id_row['id']
        
        # Bước 2: Lấy chi tiết đặt chỗ
        booking_details = get_booking_details_admin(booking_id)

        if not booking_details:
            raise ValueError("Lỗi khi lấy chi tiết đặt chỗ.")

        # --- ĐẢO NGƯỢC THỨ TỰ KIỂM TRA ĐIỀU KIỆN ---
        
        # Ưu tiên 1: Kiểm tra các trạng thái không thể check-in (đã hủy, đã hoàn thành)
        if booking_details['booking_status'] == 'cancelled_by_airline':
            raise ValueError("Chuyến bay đã bị hủy bởi hãng hàng không.")
        if booking_details['booking_status'] == 'cancelled_by_user':
             raise ValueError("Đặt chỗ này đã được bạn hủy trước đó.")
        if booking_details['booking_status'] == 'completed':
            raise ValueError("Chuyến bay này đã hoàn thành.")
        if booking_details['booking_status'] == 'no_show':
            raise ValueError("Đặt chỗ của bạn được ghi nhận là không có mặt.")

        # Ưu tiên 2: Kiểm tra trạng thái thanh toán
        if booking_details['payment_status'] != 'paid':
            raise ValueError("Bạn vui lòng thanh toán để hoàn tất thủ tục.")

        # Ưu tiên 3: Kiểm tra xem có phải trạng thái 'confirmed' không
        if booking_details['booking_status'] != 'confirmed':
            # Các trạng thái khác như pending_payment sẽ bị bắt bởi kiểm tra payment_status ở trên
            raise ValueError(f"Đặt chỗ của bạn đang ở trạng thái không thể làm thủ tục: '{booking_details['booking_status']}'.")
        
        for pax in booking_details['passengers']:
            pax['checked_in'] = booking_details.get('checkin_status') == 'checked_in'
            pax['eligible'] = True 
        return booking_details
        
    except ValueError as ve:
        raise ve 
    except Exception as e:
        current_app.logger.error(f"Error getting booking for check-in (PNR {pnr_code}): {e}", exc_info=True)
        raise Exception("Lỗi hệ thống khi tra cứu đặt chỗ.")
    finally:
        if conn:
            conn.close()
            
# --- HÀM MỚI ĐỂ HOÀN TẤT CHECK-IN ---
def complete_checkin_for_passengers(booking_id, passenger_ids):
    """
    Hoàn tất check-in: Cập nhật trạng thái cho booking và gán ghế cho hành khách được chọn.
    """
    conn = _get_db_connection()
    try:
        if not passenger_ids:
            raise ValueError("Cần chọn ít nhất một hành khách để làm thủ tục.")

        conn.execute("BEGIN") # Bắt đầu transaction để đảm bảo an toàn dữ liệu

        # Cập nhật trạng thái chung của cả booking thành 'checked_in'
        update_booking_cursor = conn.execute(
            "UPDATE bookings SET checkin_status = 'checked_in', updated_at = datetime('now', 'localtime') WHERE id = ?",
            (booking_id,)
        )
        if update_booking_cursor.rowcount == 0:
            # Nếu không có dòng nào được cập nhật, nghĩa là booking_id không đúng
            raise ValueError("Không tìm thấy đặt chỗ để cập nhật trạng thái check-in.")

        # Gán ghế ngồi ngẫu nhiên cho các hành khách được check-in (logic mô phỏng)
        # Trong thực tế, đây sẽ là logic chọn ghế phức tạp hơn
        for pax_id in passenger_ids:
            seat_row = random.randint(10, 35) # Gán hàng ghế ngẫu nhiên từ 10-35
            seat_letter = random.choice(['A', 'B', 'C', 'D', 'E', 'F'])
            assigned_seat = f"{seat_row}{seat_letter}"
            
            pax_update_cursor = conn.execute(
                "UPDATE passengers SET seat_assigned = ? WHERE id = ? AND booking_id = ?",
                (assigned_seat, pax_id, booking_id)
            )
            # Có thể thêm kiểm tra pax_update_cursor.rowcount > 0 nếu muốn chặt chẽ hơn

        conn.commit() # Commit tất cả các thay đổi
        return True
    except Exception as e:
        if conn: conn.rollback() # Hoàn tác nếu có bất kỳ lỗi nào
        current_app.logger.error(f"Error completing check-in for booking ID {booking_id}: {e}", exc_info=True)
        raise # Ném lại lỗi để controller xử lý
    finally:
        if conn:
            conn.close()