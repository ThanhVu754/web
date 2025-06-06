// app/static/js/admin/script_quan_ly_dat_cho.js
document.addEventListener('DOMContentLoaded', function() {
    console.log("Booking Management Script Loaded - API Integrated!");

    const bookingsTableBody = document.getElementById('bookingsTableBody');
    const bookingSearchInput = document.getElementById('bookingSearchInput');
    const bookingStatusFilter = document.getElementById('bookingStatusFilter');
    const flightDateFilter = document.getElementById('flightDateFilter');
    const applyBookingFilterBtn = document.getElementById('applyBookingFilterBtn');

    const bookingDetailModal = document.getElementById('bookingDetailModal');
    const closeBookingDetailModalBtn = document.getElementById('closeBookingDetailModalBtn');
    const bookingDetailModalTitleSpan = document.getElementById('detailPnr'); 
    const bookingDetailContent = document.getElementById('bookingDetailContent');
    const printBookingBtn = document.getElementById('printBookingBtn');
    const editBookingStatusBtn = document.getElementById('editBookingStatusBtn');

    const editBookingStatusModal = document.getElementById('editBookingStatusModal');
    const closeEditStatusModalBtn = document.getElementById('closeEditStatusModalBtn');
    const editStatusPnrDisplay = document.getElementById('editStatusPnr');
    const editBookingStatusForm = document.getElementById('editBookingStatusForm');
    const newBookingStatusSelect = document.getElementById('newBookingStatus');
    const adminNotesTextarea = document.getElementById('adminNotes');
    const cancelEditStatusBtn = document.getElementById('cancelEditStatusBtn');
    const hiddenEditBookingIdInput = document.getElementById('editBookingId');

    let allBookingsData = []; 

    const statusMapping = {
        "confirmed": { text: "Đã xác nhận", class: "status-confirmed" },
        "pending_payment": { text: "Chờ thanh toán", class: "status-pending_payment" },
        "payment_received": { text: "Đã thanh toán", class: "status-payment_received" },
        "cancelled_by_user": { text: "Khách hủy", class: "status-cancelled_by_user" },
        "cancelled_by_airline": { text: "Admin hủy", class: "status-cancelled_by_airline" },
        "completed": { text: "Đã hoàn thành", class: "status-completed" },
        "no_show": { text: "Khách không đến", class: "status-no_show" }
    };

    function formatCurrency(amount) {
        return (amount || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    }

    // --- FETCH BOOKINGS FROM API ---
    async function fetchBookings(searchTerm = '', statusTerm = '', dateTerm = '') {
        console.log(`Fetching bookings with: search='${searchTerm}', status='${statusTerm}', flightDate='${dateTerm}'`);
        let apiUrl = '/admin/api/bookings?';
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (statusTerm) params.append('status', statusTerm);
        if (dateTerm) params.append('flightDate', dateTerm);
        apiUrl += params.toString();

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            console.log("Response from fetchBookings API:", data);
            if (data.success && Array.isArray(data.bookings)) {
                allBookingsData = data.bookings;
                renderBookingsTable(allBookingsData);
            } else {
                if(bookingsTableBody) bookingsTableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">${data.message || 'Không tải được dữ liệu đặt chỗ.'}</td></tr>`;
                console.error("Failed to fetch bookings:", data.message);
            }
        } catch (error) {
            if(bookingsTableBody) bookingsTableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Lỗi kết nối máy chủ khi tải đặt chỗ.</td></tr>`;
            console.error("Error fetching bookings (catch block):", error);
        }
    }

    // --- RENDER BOOKINGS TABLE ---
    function renderBookingsTable(bookingsToRender) {
        if (!bookingsTableBody) return;
        bookingsTableBody.innerHTML = ''; 
        if (!bookingsToRender || bookingsToRender.length === 0) {
            bookingsTableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Không có đặt chỗ nào phù hợp với tiêu chí.</td></tr>';
            return;
        }

        bookingsToRender.forEach(booking => {
            const row = bookingsTableBody.insertRow();
            // API backend trả về booking.booking_status, booking.passenger_name, booking.email, 
            // booking.itinerary, booking.flight_date, booking.total_amount, booking.created_at_formatted
            // và booking.pnr (hoặc booking.booking_code), booking.booking_id
            const statusInfo = statusMapping[booking.booking_status] || { text: booking.booking_status || 'N/A', class: '' };
            const pnrDisplay = booking.pnr || booking.booking_code || 'N/A';
            const bookingId = booking.booking_id; // ID từ CSDL

            row.innerHTML = `
                <td>${pnrDisplay}</td>
                <td>${booking.passenger_name || 'N/A'}</td>
                <td>${booking.email || 'N/A'}</td>
                <td>${booking.itinerary || 'N/A'}</td>
                <td>${booking.flight_date || 'N/A'}</td>
                <td>${formatCurrency(booking.total_amount)}</td>
                <td><span class="status-booking ${statusInfo.class}">${statusInfo.text}</span></td>
                <td>${booking.created_at_formatted || booking.booking_time || 'N/A'}</td>
                <td class="btn-action-group">
                    <button class="btn btn-sm btn-view-detail" data-booking-id="${bookingId}"><i class="fas fa-eye"></i> Xem</button>
                    <button class="btn btn-sm btn-edit-booking-status" data-booking-id="${bookingId}" data-pnr="${pnrDisplay}" data-current-status="${booking.booking_status}"><i class="fas fa-edit"></i> Sửa TT</button>
                    </td>
            `;
        });
        attachActionListenersToBookingTable();
    }

    // --- ATTACH ACTION LISTENERS TO BOOKING TABLE ---
    function attachActionListenersToBookingTable() {
        if (!bookingsTableBody) return;
        bookingsTableBody.querySelectorAll('.btn-view-detail').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookingId = this.dataset.bookingId;
                console.log("View detail clicked for booking ID:", bookingId);
                openBookingDetailModal(bookingId);
            });
        });
        bookingsTableBody.querySelectorAll('.btn-edit-booking-status').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookingId = this.dataset.bookingId;
                const pnr = this.dataset.pnr;
                const currentStatus = this.dataset.currentStatus;
                console.log("Edit status clicked for booking ID:", bookingId, "PNR:", pnr, "Current Status:", currentStatus);
                openEditBookingStatusModal(bookingId, pnr, currentStatus);
            });
        });
    }

    // --- MODAL CHI TIẾT ĐẶT CHỖ ---
    async function openBookingDetailModal(bookingId) {
        if (!bookingDetailModal || !bookingDetailContent || !bookingDetailModalTitleSpan) return;
        
        bookingDetailContent.innerHTML = '<p>Đang tải chi tiết đặt chỗ...</p>';
        bookingDetailModal.style.display = 'flex';
        console.log("Fetching details for booking ID:", bookingId);

        try {
            const response = await fetch(`/admin/api/bookings/${bookingId}`);
            const result = await response.json();
            console.log("Booking Detail API response:", result);

            if (response.ok && result.success && result.booking) {
                const booking = result.booking; 
                bookingDetailModalTitleSpan.textContent = booking.pnr || booking.booking_code;
                
                let passengersHtml = '<li>Không có thông tin hành khách.</li>';
                if (booking.passengers && booking.passengers.length > 0) {
                    passengersHtml = booking.passengers.map(p => `<li>${p.full_name} (${p.passenger_type}) ${p.seat_assigned ? ' - Ghế: '+p.seat_assigned : ''}</li>`).join('');
                }

                let flightHtml = `
                    <p><strong>Chuyến bay:</strong> ${booking.flight_number || 'N/A'}</p>
                    <p><strong>Hành trình:</strong> ${booking.departure_city || booking.departure_iata} → ${booking.arrival_city || booking.arrival_iata}</p>
                    <p><strong>Khởi hành:</strong> ${booking.departure_datetime_formatted || booking.departure_time}</p>
                    <p><strong>Đến nơi:</strong> ${booking.arrival_datetime_formatted || booking.arrival_time}</p>
                    <p><strong>Hạng ghế:</strong> ${booking.seat_class_booked || 'N/A'}</p>
                `;

                bookingDetailContent.innerHTML = `
                    <h4>Thông tin Người đặt vé (nếu có)</h4>
                    <p><strong>Tên:</strong> ${booking.booker_full_name || 'N/A'}</p>
                    <p><strong>Email:</strong> ${booking.booker_email || 'N/A'}</p>
                    <p><strong>SĐT:</strong> ${booking.booker_phone || 'N/A'}</p>
                    <p><strong>Ngày tạo đặt chỗ:</strong> ${booking.created_at_formatted || booking.booking_time || 'N/A'}</p>
                    <hr>
                    <h4>Chi tiết chuyến bay</h4>
                    ${flightHtml}
                    <hr>
                    <h4>Danh sách hành khách</h4>
                    <ul>${passengersHtml}</ul>
                    <hr>
                    <h4>Thông tin thanh toán và giá vé</h4>
                    <p><strong>Giá vé cơ bản:</strong> ${formatCurrency(booking.base_fare)}</p>
                    <p><strong>Dịch vụ cộng thêm:</strong> ${formatCurrency(booking.ancillary_services_total)}</p>
                    <p><strong>Giảm giá:</strong> -${formatCurrency(booking.discount_applied)}</p>
                    <p><strong>Tổng tiền:</strong> ${formatCurrency(booking.total_amount)}</p>
                    <p><strong>Phương thức TT:</strong> ${booking.payment_method || 'N/A'}</p>
                    <p><strong>Trạng thái TT:</strong> ${booking.payment_status || 'N/A'}</p>
                    <p><strong>Trạng thái Đặt chỗ:</strong> ${(statusMapping[booking.status] || {text: booking.status}).text}</p>
                    ${booking.notes ? `<p><strong>Ghi chú của Admin:</strong> ${booking.notes}</p>` : ''}
                `;
                
                if (editBookingStatusBtn) editBookingStatusBtn.dataset.bookingId = booking.id; 
            } else {
                bookingDetailContent.innerHTML = `<p class="error-message">${result.message || "Không thể tải chi tiết đặt chỗ."}</p>`;
            }
        } catch (error) {
            console.error("Lỗi khi tải chi tiết đặt chỗ (catch):", error);
            bookingDetailContent.innerHTML = `<p class="error-message">Lỗi kết nối khi tải chi tiết.</p>`;
        }
    }


    // --- MODAL SỬA TRẠNG THÁI ĐẶT CHỖ ---
    function openEditBookingStatusModal(bookingId, pnr, currentStatus) {
        if (!editBookingStatusModal || !editStatusPnrDisplay || !hiddenEditBookingIdInput || !newBookingStatusSelect || !adminNotesTextarea) return;
        
        currentEditingBookingId = bookingId; 
        editStatusPnrDisplay.textContent = pnr || `ID: ${bookingId}`;
        hiddenEditBookingIdInput.value = bookingId;
        newBookingStatusSelect.value = currentStatus;
        adminNotesTextarea.value = ''; 
        editBookingStatusModal.style.display = 'flex';
    }

    function closeEditStatusModal() {
        if (editBookingStatusModal) { // Kiểm tra xem element có tồn tại không
            editBookingStatusModal.style.display = 'none';
            console.log("Edit Booking Status Modal closed."); // Để debug
        } else {
            console.error("Element editBookingStatusModal không tìm thấy để đóng!");
        }
    }

    if (closeEditStatusModalBtn) { // Nút 'X' trên modal sửa trạng thái
        closeEditStatusModalBtn.addEventListener('click', () => {
            console.log("Close Edit Status Modal Button (X) CLICKED!"); // DEBUG
            closeEditStatusModal(); // Gọi hàm đóng modal
        });
    } else {
        console.warn("Element 'closeEditStatusModalBtn' not found."); // Dùng warn nếu nút này có thể không bắt buộc
    }

    if (cancelEditStatusBtn) { // Nút 'Hủy' trong form của modal sửa trạng thái
        cancelEditStatusBtn.addEventListener('click', () => {
            console.log("Cancel Edit Status Button CLICKED!"); // DEBUG
            closeEditStatusModal(); // Gọi hàm đóng modal
        });
    } else {
        console.warn("Element 'cancelEditStatusBtn' not found.");
    }

    // Đóng modal khi click ra vùng xám bên ngoài (Cập nhật để bao gồm cả modal này)
    window.addEventListener('click', function(event) {
        if (event.target == bookingDetailModal) { // Modal chi tiết đặt chỗ
            if(bookingDetailModal) bookingDetailModal.style.display = "none";
        }
        if (event.target == editBookingStatusModal) { // Modal sửa trạng thái
            closeEditStatusModal(); // Gọi hàm đóng modal sửa trạng thái
        }
        // Thêm điều kiện cho các modal khác nếu bạn có
        // if (event.target == userFormModal) { closeUserModal(); }
        // if (event.target == flightFormModal) { closeFlightModal(); }
    });
    
    if (editBookingStatusBtn) { 
        editBookingStatusBtn.addEventListener('click', function() {
            const bookingIdFromDetail = this.dataset.bookingId; // Lấy ID từ nút trong modal chi tiết
            console.log("Edit status button in detail modal clicked for booking ID:", bookingIdFromDetail);
            // Cần tìm PNR và currentStatus từ allBookingsData hoặc gọi API lại nếu cần
            const bookingToEditStatus = allBookingsData.find(b => b.booking_id == bookingIdFromDetail);
            if (bookingToEditStatus) {
                if (bookingDetailModal) bookingDetailModal.style.display = 'none';
                openEditBookingStatusModal(bookingIdFromDetail, bookingToEditStatus.pnr || bookingToEditStatus.booking_code, bookingToEditStatus.booking_status);
            } else {
                alert(`Không tìm thấy thông tin đặt chỗ ID ${bookingIdFromDetail} để sửa trạng thái.`);
                console.warn("Could not find booking data in allBookingsData for ID:", bookingIdFromDetail);
            }
        });
    }

    // Xử lý Form Sửa Trạng Thái
    if (editBookingStatusForm) {
        editBookingStatusForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const bookingId = hiddenEditBookingIdInput.value; // Lấy từ hidden input
            const newStatus = newBookingStatusSelect.value;
            const notes = adminNotesTextarea.value.trim();

            if (!bookingId || !newStatus) {
                alert("Thiếu thông tin Booking ID hoặc Trạng thái mới.");
                return;
            }

            const payload = { newStatus: newStatus }; 
            if (notes) {
                payload.adminNotes = notes;
            }
            console.log("Updating booking status for ID:", bookingId, "Payload:", payload);

            try {
                const response = await fetch(`/admin/api/bookings/${bookingId}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                console.log("Update status API response:", result);

                if (response.ok && result.success) {
                    alert(result.message || `Đã cập nhật trạng thái cho đặt chỗ ID ${bookingId}.`);
                    // Tải lại danh sách booking với các filter hiện tại
                    fetchBookings(
                        bookingSearchInput ? bookingSearchInput.value.trim() : '', 
                        bookingStatusFilter ? bookingStatusFilter.value : '', 
                        flightDateFilter ? flightDateFilter.value : ''
                    );
                } else {
                    alert("Lỗi cập nhật trạng thái: " + (result.message || "Thao tác không thành công."));
                }
            } catch (error) {
                console.error("Lỗi khi cập nhật trạng thái đặt chỗ (catch):", error);
                alert("Lỗi kết nối khi cập nhật trạng thái.");
            }
            if(editBookingStatusModal) editBookingStatusModal.style.display = 'none';
        });
    }
    
    // Nút In vé (demo) - giữ nguyên
    if(printBookingBtn) { printBookingBtn.addEventListener('click', function() { alert("Chức năng In vé đang được phát triển!"); }); }

    // --- Lọc và Tìm kiếm ---
    function filterAndSearchBookings() {
        const searchTerm = bookingSearchInput ? bookingSearchInput.value.trim() : '';
        const statusTerm = bookingStatusFilter ? bookingStatusFilter.value : '';
        const dateTerm = flightDateFilter ? flightDateFilter.value : '';
        fetchBookings(searchTerm, statusTerm, dateTerm); 
    }

    if (applyBookingFilterBtn) applyBookingFilterBtn.addEventListener('click', filterAndSearchBookings);
    if (bookingSearchInput) {
        bookingSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') filterAndSearchBookings();
        });
    }
    if (bookingStatusFilter) bookingStatusFilter.addEventListener('change', filterAndSearchBookings);
    if (flightDateFilter) flightDateFilter.addEventListener('change', filterAndSearchBookings);

    // Đóng modal khi click bên ngoài (chung) - giữ nguyên
    window.addEventListener('click', function(event) { /* ... */ });

    // --- Khởi tạo ban đầu ---
    fetchBookings(); // Tải danh sách đặt chỗ khi trang được load
});