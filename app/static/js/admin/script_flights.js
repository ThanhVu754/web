document.addEventListener('DOMContentLoaded', function() {
    console.log("Flights Management Script Loaded!");

    const addFlightBtn = document.getElementById('addFlightBtn');
    const flightFormModal = document.getElementById('flightFormModal');
    const closeFlightModalBtn = document.getElementById('closeFlightModalBtn');
    const flightForm = document.getElementById('flightForm');
    const flightModalTitle = document.getElementById('flightModalTitle');
    const flightsTableBody = document.getElementById('flightsTableBody');
    const saveFlightBtn = document.getElementById('saveFlightBtn');
    const cancelFlightFormBtn = document.getElementById('cancelFlightFormBtn');
    const flightSearchInput = document.getElementById('flightSearchInput');
    
    let editingFlightId = null; // Để lưu ID chuyến bay đang sửa

    // --- Dữ liệu chuyến bay mẫu (Mock Data) ---
    let mockFlights = [
        { id: 1, flightNumber: 'SA101', aircraftType: 'Airbus A320', departureAirport: 'HAN', arrivalAirport: 'SGN', departureDate: '2025-07-15', departureTime: '08:00', arrivalDate: '2025-07-15', arrivalTime: '10:05', basePrice: 1200000, totalSeats: 150, flightStatus: 'scheduled' },
        { id: 2, flightNumber: 'SA202', aircraftType: 'Boeing 787', departureAirport: 'SGN', arrivalAirport: 'DAD', departureDate: '2025-07-16', departureTime: '10:30', arrivalDate: '2025-07-16', arrivalTime: '11:45', basePrice: 950000, totalSeats: 180, flightStatus: 'on-time' },
        { id: 3, flightNumber: 'SA303', aircraftType: 'Airbus A321', departureAirport: 'DAD', arrivalAirport: 'HAN', departureDate: '2025-07-17', departureTime: '14:00', arrivalDate: '2025-07-17', arrivalTime: '15:10', basePrice: 800000, totalSeats: 160, flightStatus: 'delayed' },
    ];

    const airportNames = {
        "HAN": "Hà Nội (HAN)",
        "SGN": "TP. Hồ Chí Minh (SGN)",
        "DAD": "Đà Nẵng (DAD)"
    };
    const statusNames = {
        "scheduled": "Lên lịch", "on-time": "Đúng giờ", "delayed": "Trễ chuyến",
        "cancelled": "Đã hủy", "departed": "Đã cất cánh", "arrived": "Đã đến"
    };
    const statusClasses = {
        "scheduled": "status-scheduled", "on-time": "status-on-time", "delayed": "status-delayed",
        "cancelled": "status-cancelled", "departed": "status-departed", "arrived": "status-arrived"
    };


    // --- Hiển thị danh sách chuyến bay ---
    function renderFlightsTable(flightsToRender) {
        if (!flightsTableBody) return;
        flightsTableBody.innerHTML = ''; // Xóa các dòng cũ
        if (!flightsToRender || flightsToRender.length === 0) {
            flightsTableBody.innerHTML = '<tr><td colspan="11" style="text-align:center;">Không có chuyến bay nào.</td></tr>';
            return;
        }

        flightsToRender.forEach(flight => {
            const row = flightsTableBody.insertRow();
            row.innerHTML = `
                <td>${flight.flightNumber}</td>
                <td>${airportNames[flight.departureAirport] || flight.departureAirport}</td>
                <td>${airportNames[flight.arrivalAirport] || flight.arrivalAirport}</td>
                <td>${flight.departureDate}</td>
                <td>${flight.departureTime}</td>
                <td>${flight.arrivalDate}</td>
                <td>${flight.arrivalTime}</td>
                <td>${flight.basePrice.toLocaleString('vi-VN')}</td>
                <td>${flight.totalSeats}</td>
                <td><span class="status ${statusClasses[flight.flightStatus] || ''}">${statusNames[flight.flightStatus] || flight.flightStatus}</span></td>
                <td>
                    <button class="btn btn-sm btn-edit" data-flight-id="${flight.id}"><i class="fas fa-edit"></i> Sửa</button>
                    <button class="btn btn-sm btn-delete" data-flight-id="${flight.id}"><i class="fas fa-trash"></i> Xóa</button>
                </td>
            `;
        });
        attachActionListenersToTable(); // Gắn lại listener cho các nút Sửa/Xóa
    }

    // --- Mở/Đóng Modal ---
    function openFlightModal(title = "Thêm chuyến bay mới", flightData = null) {
        if (!flightFormModal || !flightModalTitle || !flightForm) return;
        flightModalTitle.textContent = title;
        flightForm.reset(); // Xóa dữ liệu form cũ
        editingFlightId = null; // Reset ID đang sửa

        if (flightData) { // Nếu là sửa, điền dữ liệu vào form
            editingFlightId = flightData.id;
            document.getElementById('flightId').value = flightData.id;
            document.getElementById('flightNumber').value = flightData.flightNumber;
            document.getElementById('aircraftType').value = flightData.aircraftType || '';
            document.getElementById('departureAirport').value = flightData.departureAirport;
            document.getElementById('arrivalAirport').value = flightData.arrivalAirport;
            document.getElementById('departureDate').value = flightData.departureDate;
            document.getElementById('departureTime').value = flightData.departureTime;
            document.getElementById('arrivalDate').value = flightData.arrivalDate;
            document.getElementById('arrivalTime').value = flightData.arrivalTime;
            document.getElementById('basePrice').value = flightData.basePrice;
            document.getElementById('totalSeats').value = flightData.totalSeats;
            document.getElementById('flightStatus').value = flightData.flightStatus;
        }
        flightFormModal.style.display = 'block';
    }

    function closeFlightModal() {
        if (flightFormModal) flightFormModal.style.display = 'none';
    }

    if (addFlightBtn) {
        addFlightBtn.addEventListener('click', () => openFlightModal("Thêm chuyến bay mới"));
    }
    if (closeFlightModalBtn) {
        closeFlightModalBtn.addEventListener('click', closeFlightModal);
    }
    if (cancelFlightFormBtn) {
        cancelFlightFormBtn.addEventListener('click', closeFlightModal);
    }
    // Đóng modal khi click bên ngoài
    window.addEventListener('click', function(event) {
        if (event.target == flightFormModal) {
            closeFlightModal();
        }
    });


    // --- Xử lý Form Thêm/Sửa Chuyến Bay ---
    if (flightForm) {
        flightForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = new FormData(flightForm);
            const flightData = Object.fromEntries(formData.entries());
            
            // Chuyển đổi kiểu dữ liệu nếu cần
            flightData.basePrice = parseInt(flightData.basePrice);
            flightData.totalSeats = parseInt(flightData.totalSeats);
            flightData.id = editingFlightId ? parseInt(editingFlightId) : null; // Giữ ID nếu là sửa


            console.log("Dữ liệu chuyến bay:", flightData);

            if (editingFlightId) { // Chế độ sửa
                const index = mockFlights.findIndex(f => f.id === editingFlightId);
                if (index !== -1) {
                    mockFlights[index] = { ...mockFlights[index], ...flightData }; // Cập nhật
                    alert("Đã cập nhật thông tin chuyến bay!");
                }
            } else { // Chế độ thêm mới
                flightData.id = mockFlights.length > 0 ? Math.max(...mockFlights.map(f => f.id)) + 1 : 1; // Tạo ID mới
                mockFlights.push(flightData);
                alert("Đã thêm chuyến bay mới thành công!");
            }
            
            renderFlightsTable(mockFlights); // Vẽ lại bảng
            closeFlightModal();
        });
    }

    // --- Xử lý nút Sửa/Xóa trong bảng ---
    function attachActionListenersToTable() {
        const editButtons = flightsTableBody.querySelectorAll('.btn-edit');
        const deleteButtons = flightsTableBody.querySelectorAll('.btn-delete');

        editButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const flightId = parseInt(this.dataset.flightId);
                const flightToEdit = mockFlights.find(f => f.id === flightId);
                if (flightToEdit) {
                    openFlightModal("Chỉnh sửa thông tin chuyến bay", flightToEdit);
                }
            });
        });

        deleteButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const flightId = parseInt(this.dataset.flightId);
                if (confirm(`Bạn có chắc chắn muốn xóa chuyến bay có ID ${flightId} không?`)) {
                    mockFlights = mockFlights.filter(f => f.id !== flightId);
                    alert(`Đã xóa chuyến bay ID ${flightId}`);
                    renderFlightsTable(mockFlights); // Vẽ lại bảng
                }
            });
        });
    }
    
    // --- Tìm kiếm chuyến bay ---
    if (flightSearchInput) {
        flightSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const filteredFlights = mockFlights.filter(flight => {
                return flight.flightNumber.toLowerCase().includes(searchTerm) ||
                       (airportNames[flight.departureAirport] || flight.departureAirport).toLowerCase().includes(searchTerm) ||
                       (airportNames[flight.arrivalAirport] || flight.arrivalAirport).toLowerCase().includes(searchTerm) ||
                       flight.departureDate.includes(searchTerm);
            });
            renderFlightsTable(filteredFlights);
        });
    }


    // --- Khởi tạo ban đầu ---
    renderFlightsTable(mockFlights); // Hiển thị danh sách chuyến bay ban đầu

});