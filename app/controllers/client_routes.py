from flask import Blueprint, render_template, request, jsonify
from models.client_model import (
    create_booking, find_booking,
    search_flights, get_all_emenu_items
)


client_bp = Blueprint('client_bp', __name__)

from datetime import datetime

def format_time_string(dt_str):
    try:
        dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
        return dt.strftime("%d/%m/%Y - %H:%M")
    except:
        return dt_str  # fallback nếu sai định dạng

for flight in flights:
    flight['departure_time'] = format_time_string(flight['departure_time'])
    flight['arrival_time'] = format_time_string(flight['arrival_time'])


# ========== Trang giao diện ==========
@client_bp.route('/')
@client_bp.route('/home')
def home():
    return render_template('client/home.html')

@client_bp.route('/my_flights')
def my_flights():
    return render_template('client/my_flights.html')

@client_bp.route('/online_checkin')
def online_checkin():
    return render_template('client/online_checkin.html')

@client_bp.route('/e_menu')
def e_menu():
    return render_template('client/e_menu.html')

@client_bp.route('/flight_services')
def flight_services():
    return render_template('client/flight_services.html')

# ========== AJAX API xử lý ==========
@client_bp.route('/book', methods=['POST'])
def api_book():
    data = request.get_json()
    create_booking(data)
    return jsonify({'status': 'success', 'message': 'Đặt vé thành công'})

@client_bp.route('/flights', methods=['GET'])
def api_flights():
    dep = request.args.get('departure')
    dest = request.args.get('destination')
    flights = search_flights(dep, dest)
    return jsonify(flights)

@client_bp.route('/booking_lookup', methods=['POST'])
def api_booking_lookup():
    data = request.get_json()
    pnr = data['pnr']
    last_name = data['last_name']
    result = find_booking(pnr, last_name)
    if result:
        return jsonify(result)
    else:
        return jsonify({'status': 'error', 'message': 'Không tìm thấy'}), 404

@client_bp.route('/emenu', methods=['GET'])
def api_emenu():
    return jsonify(get_all_emenu_items())
