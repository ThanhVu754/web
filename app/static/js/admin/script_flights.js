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
                    <button class="btn btn-sm btn-delete" 
                            data-flight-id="${flight.id}" 
                            data-flight-number="${flight.flight_number || 'N/A'}"><i class="fas fa-trash"></i> Xóa
                    </button>
                </td>
            `;
        });
        attachActionListenersToTable();
    }

    // --- MODAL HANDLING ---
    async function openFlightModal(title = "Thêm chuyến bay mới", flightIdToEdit = null) {
        if (!flightFormModal || !flightModalTitle || !flightForm) {
            console.error("Modal elements not found!");
            return;
        }
        
        flightModalTitle.textContent = title;
        flightForm.reset(); // Xóa dữ liệu form cũ
        editingFlightId = flightIdToEdit; // Gán ID đang sửa (sẽ là null nếu thêm mới)
        
        // Lấy thẻ div chứa trường select trạng thái chuyến bay
        const flightStatusGroup = document.getElementById('flightStatusGroup'); // Đảm bảo div này có ID là 'flightStatusGroup' trong HTML

        // Luôn tải/cập nhật danh sách sân bay khi mở modal
        // Hàm fetchAndPopulateAirports() cần được định nghĩa và hoạt động đúng
        await fetchAndPopulateAirports(); 

        if (flightIdToEdit) { 
            // --- CHẾ ĐỘ SỬA ---
            if (flightStatusGroup) {
                flightStatusGroup.style.display = 'block'; // Hoặc 'flex' tùy theo CSS display của .form-group
            }
            document.getElementById('flightId').value = flightIdToEdit; // Gán ID vào hidden field

            try {
                const response = await fetch(`/admin/api/flights/${flightIdToEdit}`);
                const data = await response.json();

                if (data.success && data.flight) {
                    const flightData = data.flight;
                    // Gán giá trị cho select sân bay SAU KHI chúng đã được điền bởi fetchAndPopulateAirports
                    // Đảm bảo flightData.departure_airport_iata và flightData.arrival_airport_iata là IATA code
                    if (departureAirportSelect) departureAirportSelect.value = flightData.departure_airport_iata; 
                    if (arrivalAirportSelect) arrivalAirportSelect.value = flightData.arrival_airport_iata;
                    
                    document.getElementById('departureDate').value = flightData.departureDate; // Backend trả về YYYY-MM-DD
                    document.getElementById('departureTime').value = flightData.departureTime; // Backend trả về HH:MM
                    document.getElementById('arrivalDate').value = flightData.arrivalDate;
                    document.getElementById('arrivalTime').value = flightData.arrivalTime;
                    document.getElementById('basePrice').value = flightData.economy_price; // Giả sử basePrice là economy_price
                    document.getElementById('totalSeats').value = flightData.total_seats;
                    
                    // Điền và hiển thị trạng thái chuyến bay
                    document.getElementById('flightStatus').value = flightData.status; 
                } else {
                    alert("Lỗi tải chi tiết chuyến bay: " + (data.message || "Không rõ lỗi"));
                    closeFlightModal(); // Đóng modal nếu không tải được dữ liệu
                    return; 
                }
            } catch (error) {
                console.error("Lỗi khi lấy chi tiết chuyến bay:", error);
                alert("Lỗi kết nối khi lấy chi tiết chuyến bay.");
                closeFlightModal();
                return;
            }
        } else { 
            // --- CHẾ ĐỘ THÊM MỚI ---
            if (flightStatusGroup) {
                flightStatusGroup.style.display = 'none'; // Ẩn trường trạng thái khi thêm mới
            }
            // Reset hidden flightId field (dù flightForm.reset() có thể đã làm)
            document.getElementById('flightId').value = ''; 
        }
        flightFormModal.style.display = 'block'; // Hiển thị modal
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
                departureAirport: formData.get('departureAirport'), // IATA code
                arrivalAirport: formData.get('arrivalAirport'),   // IATA code
                departureDate: formData.get('departureDate'),
                departureTime: formData.get('departureTime'),
                arrivalDate: formData.get('arrivalDate'),
                arrivalTime: formData.get('arrivalTime'),
                basePrice: parseInt(formData.get('basePrice')),
                totalSeats: parseInt(formData.get('totalSeats')),
            };
            if (editingFlightId) { // Nếu là sửa, thì mới lấy flightStatus từ form
                flightApiData.flightStatus = formData.get('flightStatus');
                // Nếu có trường availableSeats trong form sửa, cũng lấy ở đây
                if (formData.has('availableSeats')) { 
                    flightApiData.availableSeats = parseInt(formData.get('availableSeats'));
                }
            }

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
    // Trong app/static/js/admin/script_flights.js

    function attachActionListenersToTable() {
        if (!flightsTableBody) return;
        
        // Phần xử lý nút Sửa giữ nguyên
        flightsTableBody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const flightId = parseInt(this.dataset.flightId);
                openFlightModal("Chỉnh sửa thông tin chuyến bay", flightId);
            });
        });

        // Cập nhật phần xử lý nút Xóa
        flightsTableBody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async function() { 
                const flightId = parseInt(this.dataset.flightId);
                const flightNumber = this.dataset.flightNumber; // <<< LẤY SỐ HIỆU CHUYẾN BAY

                // Sử dụng flightNumber trong thông báo confirm
                if (confirm(`Bạn có chắc chắn muốn xóa chuyến bay có số hiệu ${flightNumber} không? Các đặt chỗ liên quan (nếu có) cũng sẽ bị xóa.`)) {
                    try {
                        const response = await fetch(`/admin/api/flights/${flightId}`, { method: 'DELETE' });
                        // Luôn cố gắng parse JSON, nhưng kiểm tra response.ok trước
                        if (response.ok) {
                            const result = await response.json(); 
                            if (result.success) {
                                alert(result.message || `Đã xóa chuyến bay số hiệu ${flightNumber}.`);
                                fetchFlights(); // Tải lại bảng
                            } else {
                                alert("Lỗi khi xóa: " + (result.message || "Thao tác không thành công từ server."));
                            }
                        } else {
                            let errorMsg = `Lỗi ${response.status}: ${response.statusText}.`;
                            try { 
                                const errorResult = await response.json();
                                errorMsg = errorResult.message || errorMsg;
                            } catch (e) { /* Bỏ qua nếu không parse được JSON lỗi */ }
                            alert("Lỗi khi xóa chuyến bay: " + errorMsg);
                        }
                    } catch (error) { 
                        console.error("Lỗi JavaScript khi xóa chuyến bay:", error);
                        alert("Lỗi kết nối hoặc lỗi xử lý phía client khi xóa chuyến bay.");
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