// app/static/js/admin/script_flights.js
document.addEventListener('DOMContentLoaded', function() {
    console.log("Flights Management Script Loaded - API Integrated and Corrected!");

    // DOM Elements
    const addFlightBtn = document.getElementById('addFlightBtn');
    const flightFormModal = document.getElementById('flightFormModal');
    const closeFlightModalBtn = document.getElementById('closeFlightModalBtn');
    const flightForm = document.getElementById('flightForm');
    const flightModalTitle = document.getElementById('flightModalTitle');
    const flightsTableBody = document.getElementById('flightsTableBody');
    // saveFlightBtn không thực sự cần nếu chúng ta lắng nghe sự kiện submit của form
    const cancelFlightFormBtn = document.getElementById('cancelFlightFormBtn');
    const flightSearchInput = document.getElementById('flightSearchInput');
    const departureAirportSelect = document.getElementById('departureAirport'); // ID của select sân bay đi
    const arrivalAirportSelect = document.getElementById('arrivalAirport');   // ID của select sân bay đến
    
    let editingFlightId = null;
    let allFlightsData = []; // Biến để lưu trữ tất cả chuyến bay từ API cho việc tìm kiếm/lọc phía client

    // Thông tin hiển thị (có thể giữ lại hoặc tùy chỉnh nếu backend trả về tên đầy đủ)
    const statusNames = {
        "scheduled": "Lên lịch", "on-time": "Đúng giờ", "delayed": "Trễ chuyến",
        "cancelled": "Đã hủy", "departed": "Đã cất cánh", "landed": "Đã đến" // Đã sửa 'arrived' thành 'landed'
    };
    const statusClasses = {
        "scheduled": "status-scheduled", "on-time": "status-on-time", "delayed": "status-delayed",
        "cancelled": "status-cancelled", "departed": "status-departed", "landed": "status-arrived" // Đã sửa 'arrived' thành 'landed'
    };

    // --- FETCH DATA FROM APIs ---
    async function fetchAndPopulateAirports() {
        if (!departureAirportSelect || !arrivalAirportSelect) {
            console.warn("Các thẻ select sân bay không được tìm thấy trong modal form chuyến bay.");
            return;
        }
        try {
            const response = await fetch('/api/airports'); // API này nằm trong client_routes.py
            const data = await response.json();
            if (data.success && data.airports) {
                // Lưu giá trị đang được chọn (nếu có) để thử khôi phục sau khi điền
                const currentDeparture = departureAirportSelect.value;
                const currentArrival = arrivalAirportSelect.value;

                departureAirportSelect.innerHTML = '<option value="">-- Chọn sân bay --</option>';
                arrivalAirportSelect.innerHTML = '<option value="">-- Chọn sân bay --</option>';
                
                data.airports.forEach(airport => {
                    const optionHtml = `<option value="${airport.iata_code}">${airport.city} (${airport.iata_code}) - ${airport.name}</option>`;
                    departureAirportSelect.innerHTML += optionHtml;
                    arrivalAirportSelect.innerHTML += optionHtml;
                });
                // Thử khôi phục lựa chọn trước đó
                if (currentDeparture) departureAirportSelect.value = currentDeparture;
                if (currentArrival) arrivalAirportSelect.value = currentArrival;

            } else {
                console.error("Không tải được danh sách sân bay cho form:", data.message);
            }
        } catch (error) {
            console.error("Lỗi khi gọi API sân bay:", error);
        }
    }

    async function fetchFlights() {
        try {
            const response = await fetch('/admin/api/flights'); // API của admin
            const data = await response.json();
            if (data.success && data.flights) {
                allFlightsData = data.flights;
                renderFlightsTable(allFlightsData);
            } else {
                if(flightsTableBody) flightsTableBody.innerHTML = `<tr><td colspan="11" style="text-align:center;">${data.message || 'Không tải được dữ liệu chuyến bay.'}</td></tr>`;
                console.error("Không tải được danh sách chuyến bay:", data.message);
            }
        } catch (error) {
            if(flightsTableBody) flightsTableBody.innerHTML = `<tr><td colspan="11" style="text-align:center;">Lỗi kết nối máy chủ khi tải chuyến bay.</td></tr>`;
            console.error("Lỗi khi gọi API lấy chuyến bay:", error);
        }
    }

    // --- RENDER TABLE ---
    function renderFlightsTable(flightsToRender) {
        if (!flightsTableBody) return;
        flightsTableBody.innerHTML = ''; 
        if (!flightsToRender || flightsToRender.length === 0) {
            flightsTableBody.innerHTML = '<tr><td colspan="11" style="text-align:center;">Không có chuyến bay nào.</td></tr>';
            return;
        }

        flightsToRender.forEach(flight => {
            const row = flightsTableBody.insertRow();
            const economyPrice = (flight.economy_price !== null && flight.economy_price !== undefined) ? flight.economy_price.toLocaleString('vi-VN') : 'N/A';
            
            // Backend trả về các trường _form cho ngày giờ đã định dạng và iata_code cho sân bay
            row.innerHTML = `
                <td>${flight.flight_number || 'N/A'}</td>
                <td>${flight.departure_airport_city || flight.departure_airport_iata} (${flight.departure_airport_iata || 'N/A'})</td>
                <td>${flight.arrival_airport_city || flight.arrival_airport_iata} (${flight.arrival_airport_iata || 'N/A'})</td>
                <td>${flight.departure_date_form || 'N/A'}</td>
                <td>${flight.departure_time_form || 'N/A'}</td>
                <td>${flight.arrival_date_form || 'N/A'}</td>
                <td>${flight.arrival_time_form || 'N/A'}</td>
                <td>${economyPrice}</td>
                <td>${flight.total_seats !== null ? flight.total_seats : 'N/A'}</td>
                <td><span class="status ${statusClasses[flight.status] || ''}">${statusNames[flight.status] || flight.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-edit" data-flight-id="${flight.id}"><i class="fas fa-edit"></i> Sửa</button>
                    <button class="btn btn-sm btn-delete" data-flight-id="${flight.id}"><i class="fas fa-trash"></i> Xóa</button>
                </td>
            `;
        });
        attachActionListenersToTable();
    }

    // --- MODAL HANDLING ---
    async function openFlightModal(title = "Thêm chuyến bay mới", flightIdToEdit = null) {
        if (!flightFormModal || !flightModalTitle || !flightForm) return;
        
        flightModalTitle.textContent = title;
        flightForm.reset();
        editingFlightId = flightIdToEdit;
        document.getElementById('flightId').value = ''; 

        // Luôn tải/cập nhật danh sách sân bay khi mở modal
        await fetchAndPopulateAirports(); // Quan trọng: await để đảm bảo dropdown được điền trước khi gán giá trị

        if (flightIdToEdit) {
            document.getElementById('flightId').value = flightIdToEdit;
            try {
                const response = await fetch(`/admin/api/flights/${flightIdToEdit}`);
                const data = await response.json();
                if (data.success && data.flight) {
                    const flightData = data.flight;
                    document.getElementById('flightNumber').value = flightData.flight_number;
                    document.getElementById('aircraftType').value = flightData.aircraft_type || '';
                    
                    // Gán giá trị cho select SAU KHI chúng đã được điền bởi fetchAndPopulateAirports
                    if (departureAirportSelect) departureAirportSelect.value = flightData.departure_airport_iata; 
                    if (arrivalAirportSelect) arrivalAirportSelect.value = flightData.arrival_airport_iata;
                    
                    document.getElementById('departureDate').value = flightData.departureDate; // Backend trả về YYYY-MM-DD
                    document.getElementById('departureTime').value = flightData.departureTime; // Backend trả về HH:MM
                    document.getElementById('arrivalDate').value = flightData.arrivalDate;
                    document.getElementById('arrivalTime').value = flightData.arrivalTime;
                    document.getElementById('basePrice').value = flightData.economy_price;
                    document.getElementById('totalSeats').value = flightData.total_seats;
                    document.getElementById('flightStatus').value = flightData.status;
                } else {
                    alert("Lỗi tải chi tiết chuyến bay: " + (data.message || "Không rõ lỗi"));
                    return;
                }
            } catch (error) {
                console.error("Lỗi khi lấy chi tiết chuyến bay:", error);
                alert("Lỗi kết nối khi lấy chi tiết chuyến bay.");
                return;
            }
        }
        flightFormModal.style.display = 'block';
    }

    function closeFlightModal() {
        if (flightFormModal) flightFormModal.style.display = 'none';
    }

    if (addFlightBtn) addFlightBtn.addEventListener('click', () => openFlightModal("Thêm chuyến bay mới"));
    if (closeFlightModalBtn) closeFlightModalBtn.addEventListener('click', closeFlightModal);
    if (cancelFlightFormBtn) cancelFlightFormBtn.addEventListener('click', closeFlightModal);
    window.addEventListener('click', (event) => {
        if (event.target == flightFormModal) closeFlightModal();
    });

    // --- FORM SUBMISSION (CREATE/UPDATE FLIGHT) ---
    if (flightForm) {
        flightForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const formData = new FormData(flightForm);
            const flightApiData = {
                flightNumber: formData.get('flightNumber'),
                aircraftType: formData.get('aircraftType'),
                departureAirport: formData.get('departureAirport'), // IATA code
                arrivalAirport: formData.get('arrivalAirport'),   // IATA code
                departureDate: formData.get('departureDate'),
                departureTime: formData.get('departureTime'),
                arrivalDate: formData.get('arrivalDate'),
                arrivalTime: formData.get('arrivalTime'),
                basePrice: parseInt(formData.get('basePrice')),
                totalSeats: parseInt(formData.get('totalSeats')),
                flightStatus: formData.get('flightStatus')
            };
            
            // Nếu là sửa, có thể gửi thêm availableSeats nếu form có trường này và muốn admin sửa trực tiếp
            // Ví dụ: if (editingFlightId && formData.get('availableSeats')) {
            //     flightApiData.availableSeats = parseInt(formData.get('availableSeats'));
            // }

            let url = '/admin/api/flights';
            let method = 'POST';

            if (editingFlightId) {
                url = `/admin/api/flights/${editingFlightId}`;
                method = 'PUT';
            }

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(flightApiData)
                });
                const result = await response.json();

                if (result.success) {
                    alert(result.message || (editingFlightId ? "Cập nhật chuyến bay thành công!" : "Thêm chuyến bay thành công!"));
                    fetchFlights(); 
                    closeFlightModal();
                } else {
                    alert("Lỗi: " + (result.message || "Thao tác không thành công."));
                }
            } catch (error) {
                console.error("Lỗi khi lưu chuyến bay:", error);
                alert("Lỗi kết nối máy chủ khi lưu chuyến bay.");
            }
        });
    }

    // --- ATTACH ACTION LISTENERS TO TABLE (EDIT/DELETE) ---
    function attachActionListenersToTable() {
        if (!flightsTableBody) return;
        flightsTableBody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const flightId = parseInt(this.dataset.flightId);
                openFlightModal("Chỉnh sửa thông tin chuyến bay", flightId);
            });
        });

        flightsTableBody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async function() {
                const flightId = parseInt(this.dataset.flightId);
                if (confirm(`Bạn có chắc chắn muốn xóa chuyến bay có ID ${flightId} không?`)) {
                    try {
                        const response = await fetch(`/admin/api/flights/${flightId}`, { method: 'DELETE' });
                        const result = await response.json();
                        if (result.success) {
                            alert(result.message || `Đã xóa chuyến bay ID ${flightId}.`);
                            fetchFlights(); 
                        } else {
                            alert("Lỗi khi xóa: " + (result.message || "Không thể xóa chuyến bay."));
                        }
                    } catch (error) {
                        console.error("Lỗi khi xóa chuyến bay:", error);
                        alert("Lỗi kết nối máy chủ khi xóa chuyến bay.");
                    }
                }
            });
        });
    }
    
    // --- SEARCH FLIGHTS (CLIENT-SIDE SEARCH ON LOADED DATA) ---
    if (flightSearchInput) {
        flightSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            if (!allFlightsData || allFlightsData.length === 0) return;

            const filteredFlights = allFlightsData.filter(flight => {
                return (flight.flight_number && flight.flight_number.toLowerCase().includes(searchTerm)) ||
                       (flight.departure_airport_city && flight.departure_airport_city.toLowerCase().includes(searchTerm)) ||
                       (flight.departure_airport_iata && flight.departure_airport_iata.toLowerCase().includes(searchTerm)) ||
                       (flight.arrival_airport_city && flight.arrival_airport_city.toLowerCase().includes(searchTerm)) ||
                       (flight.arrival_airport_iata && flight.arrival_airport_iata.toLowerCase().includes(searchTerm)) ||
                       (flight.departure_date_form && flight.departure_date_form.includes(searchTerm));
            });
            renderFlightsTable(filteredFlights);
        });
    }

    // --- INITIALIZATION ---
    fetchFlights(); // Tải danh sách chuyến bay ban đầu từ API khi trang được load
    // fetchAndPopulateAirports(); // Bạn có thể gọi ở đây một lần, hoặc gọi mỗi khi mở modal như hiện tại
});