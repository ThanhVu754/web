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