document.addEventListener('DOMContentLoaded', function() {
    console.log("Booking Management Script Loaded!");

    const bookingsTableBody = document.getElementById('bookingsTableBody');
    const bookingSearchInput = document.getElementById('bookingSearchInput');
    const bookingStatusFilter = document.getElementById('bookingStatusFilter');
    const flightDateFilter = document.getElementById('flightDateFilter');
    const applyBookingFilterBtn = document.getElementById('applyBookingFilterBtn');

    // Modal Chi tiết
    const bookingDetailModal = document.getElementById('bookingDetailModal');
    const closeBookingDetailModalBtn = document.getElementById('closeBookingDetailModalBtn');
    const bookingDetailModalTitle = document.getElementById('bookingDetailModalTitle');
    const bookingDetailContent = document.getElementById('bookingDetailContent');
    const printBookingBtn = document.getElementById('printBookingBtn');
    const editBookingStatusBtn = document.getElementById('editBookingStatusBtn'); // Nút mở modal sửa status

    // Modal Sửa Trạng Thái
    const editBookingStatusModal = document.getElementById('editBookingStatusModal');
    const closeEditStatusModalBtn = document.getElementById('closeEditStatusModalBtn');
    const editStatusPnrDisplay = document.getElementById('editStatusPnr');
    const editBookingStatusForm = document.getElementById('editBookingStatusForm');
    const newBookingStatusSelect = document.getElementById('newBookingStatus');
    const adminNotesTextarea = document.getElementById('adminNotes');
    const cancelEditStatusBtn = document.getElementById('cancelEditStatusBtn');
    const hiddenEditBookingId = document.getElementById('editBookingId');


    // --- Dữ liệu đặt chỗ mẫu (Mock Data) ---
    let mockBookings = [
        { 
            id: 'SANG1001', passengerName: 'Nguyễn Văn An', email: 'an.nv@example.com', 
            itinerary: 'SGN → HAN', flightDate: '2025-08-15', flightTime: '08:00', 
            totalAmount: 1500000, status: 'confirmed', createdAt: '2025-07-01',
            flightDetails: { number: 'SA201', departureTime: '08:00 15/08/2025', arrivalTime: '10:05 15/08/2025', class: 'Phổ thông'},
            passengers: [{name: 'NGUYEN VAN AN', type: 'Người lớn'}, {name: 'NGUYEN THI BINH', type: 'Trẻ em'}],
            services: ['20kg Hành lý', 'Suất ăn chay'],
            payment: {method: 'Credit Card', status: 'Đã thanh toán', transactionId: 'TX12345'}
        },
        { 
            id: 'SANG1002', passengerName: 'Trần Thị Bình', email: 'binh.tt@example.com', 
            itinerary: 'DAD → SGN', flightDate: '2025-08-20', flightTime: '14:30', 
            totalAmount: 950000, status: 'pending_payment', createdAt: '2025-07-05',
            flightDetails: { number: 'SA305', departureTime: '14:30 20/08/2025', arrivalTime: '15:45 20/08/2025', class: 'Phổ thông'},
            passengers: [{name: 'TRAN THI BINH', type: 'Người lớn'}],
            services: [],
            payment: {method: 'Chuyển khoản', status: 'Chờ xác nhận', transactionId: null}
        },
        { 
            id: 'SANG1003', passengerName: 'Lê Văn Cường', email: 'cuong.lv@example.com', 
            itinerary: 'HAN → DAD', flightDate: '2025-09-01', flightTime: '10:00', 
            totalAmount: 1200000, status: 'cancelled_by_user', createdAt: '2025-06-20',
            flightDetails: { number: 'SA402', departureTime: '10:00 01/09/2025', arrivalTime: '11:15 01/09/2025', class: 'Thương gia'},
            passengers: [{name: 'LE VAN CUONG', type: 'Người lớn'}],
            services: ['Chọn chỗ hàng đầu'],
            payment: {method: 'Credit Card', status: 'Đã hoàn tiền một phần', transactionId: 'TX67890'}
        },
    ];

    const statusMapping = {
        "confirmed": { text: "Đã xác nhận", class: "status-confirmed" },
        "pending_payment": { text: "Chờ thanh toán", class: "status-pending_payment" },
        "payment_received": { text: "Đã thanh toán", class: "status-payment_received" },
        "cancelled_by_user": { text: "Khách hủy", class: "status-cancelled_by_user" },
        "cancelled_by_admin": { text: "Admin hủy", class: "status-cancelled_by_admin" },
        "completed": { text: "Đã hoàn thành", class: "status-completed" },
        "no_show": { text: "Khách không đến", class: "status-no_show" }
    };

    // --- Hiển thị danh sách đặt chỗ ---
    function renderBookingsTable(bookingsToRender) {
        if (!bookingsTableBody) return;
        bookingsTableBody.innerHTML = ''; 
        if (!bookingsToRender || bookingsToRender.length === 0) {
            bookingsTableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Không có đặt chỗ nào.</td></tr>';
            return;
        }

        bookingsToRender.forEach(booking => {
            const row = bookingsTableBody.insertRow();
            const statusInfo = statusMapping[booking.status] || { text: booking.status, class: '' };
            row.innerHTML = `
                <td>${booking.id}</td>
                <td>${booking.passengerName}</td>
                <td>${booking.email}</td>
                <td>${booking.itinerary}</td>
                <td>${booking.flightDate}</td>
                <td>${booking.totalAmount.toLocaleString('vi-VN')} VNĐ</td>
                <td><span class="status-booking ${statusInfo.class}">${statusInfo.text}</span></td>
                <td>${booking.createdAt}</td>
                <td class="btn-action-group">
                    <button class="btn btn-sm btn-view-detail" data-booking-id="${booking.id}"><i class="fas fa-eye"></i> Xem</button>
                    <button class="btn btn-sm btn-edit-booking" data-booking-id="${booking.id}"><i class="fas fa-edit"></i> Sửa</button>
                    <button class="btn btn-sm btn-cancel-booking" data-booking-id="${booking.id}"><i class="fas fa-times-circle"></i> Hủy</button>
                </td>
            `;
        });
        attachActionListenersToBookingTable();
    }

    // --- Gắn Listener cho các nút trong bảng ---
    function attachActionListenersToBookingTable() {
        bookingsTableBody.querySelectorAll('.btn-view-detail').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookingId = this.dataset.bookingId;
                openBookingDetailModal(bookingId);
            });
        });
        bookingsTableBody.querySelectorAll('.btn-edit-booking').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookingId = this.dataset.bookingId;
                openEditBookingStatusModal(bookingId);
            });
        });
        bookingsTableBody.querySelectorAll('.btn-cancel-booking').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookingId = this.dataset.bookingId;
                if (confirm(`Bạn có chắc chắn muốn hủy đặt chỗ ${bookingId}? Thao tác này có thể không hoàn tác được.`)) {
                    // Mô phỏng hủy
                    const bookingIndex = mockBookings.findIndex(b => b.id === bookingId);
                    if (bookingIndex > -1) {
                        mockBookings[bookingIndex].status = 'cancelled_by_admin';
                        renderBookingsTable(mockBookings); // Vẽ lại bảng
                        alert(`Đặt chỗ ${bookingId} đã được hủy.`);
                    }
                }
            });
        });
    }

    // --- Mở/Đóng Modal Chi Tiết Đặt Chỗ ---
    function openBookingDetailModal(bookingId) {
        const booking = mockBookings.find(b => b.id === bookingId);
        if (!booking || !bookingDetailModal) return;

        if(bookingDetailModalTitle) bookingDetailModalTitle.querySelector('span').textContent = booking.id;
        
        let detailsHTML = `
            <h4>Thông tin Khách hàng</h4>
            <p><strong>Tên KH:</strong> ${booking.passengerName}</p>
            <p><strong>Email:</strong> ${booking.email}</p>
            <p><strong>Ngày tạo:</strong> ${booking.createdAt}</p>
            
            <h4>Chi tiết chuyến bay</h4>
            <p><strong>Hành trình:</strong> ${booking.itinerary}</p>
            <p><strong>Chuyến bay:</strong> ${booking.flightDetails.number}</p>
            <p><strong>Ngày giờ đi:</strong> ${booking.flightDetails.departureTime}</p>
            <p><strong>Ngày giờ đến:</strong> ${booking.flightDetails.arrivalTime}</p>
            <p><strong>Hạng ghế:</strong> ${booking.flightDetails.class}</p>

            <h4>Danh sách hành khách</h4>
            <ul>${booking.passengers.map(p => `<li>${p.name} (${p.type})</li>`).join('')}</ul>

            <h4>Dịch vụ đã mua</h4>
            <ul>${booking.services.length > 0 ? booking.services.map(s => `<li>${s}</li>`).join('') : '<li>Không có</li>'}</ul>

            <h4>Thông tin thanh toán</h4>
            <p><strong>Tổng tiền:</strong> ${booking.totalAmount.toLocaleString('vi-VN')} VNĐ</p>
            <p><strong>Phương thức:</strong> ${booking.payment.method}</p>
            <p><strong>Trạng thái TT:</strong> ${booking.payment.status}</p>
            ${booking.payment.transactionId ? `<p><strong>Mã GD:</strong> ${booking.payment.transactionId}</p>` : ''}
        `;
        if(bookingDetailContent) bookingDetailContent.innerHTML = detailsHTML;
        
        // Gán PNR cho nút sửa trạng thái từ modal chi tiết
        if (editBookingStatusBtn) editBookingStatusBtn.dataset.bookingId = booking.id;

        bookingDetailModal.style.display = 'flex';
    }
    if (closeBookingDetailModalBtn) closeBookingDetailModalBtn.addEventListener('click', () => {
        if(bookingDetailModal) bookingDetailModal.style.display = 'none';
    });


    // --- Mở/Đóng Modal Sửa Trạng Thái ---
    function openEditBookingStatusModal(bookingId) {
        const booking = mockBookings.find(b => b.id === bookingId);
        if (!booking || !editBookingStatusModal) return;

        if (editStatusPnrDisplay) editStatusPnrDisplay.textContent = booking.id;
        if (hiddenEditBookingId) hiddenEditBookingId.value = booking.id;
        if (newBookingStatusSelect) newBookingStatusSelect.value = booking.status;
        if (adminNotesTextarea) adminNotesTextarea.value = ''; // Xóa ghi chú cũ

        editBookingStatusModal.style.display = 'flex';
    }
    if (closeEditStatusModalBtn) closeEditStatusModalBtn.addEventListener('click', () => {
        if(editBookingStatusModal) editBookingStatusModal.style.display = 'none';
    });
    if (cancelEditStatusBtn) cancelEditStatusBtn.addEventListener('click', () => {
        if(editBookingStatusModal) editBookingStatusModal.style.display = 'none';
    });
    
    // Nút mở modal sửa status từ modal chi tiết
    if (editBookingStatusBtn) {
        editBookingStatusBtn.addEventListener('click', function() {
            const bookingId = this.dataset.bookingId;
            if (bookingDetailModal) bookingDetailModal.style.display = 'none'; // Đóng modal chi tiết
            openEditBookingStatusModal(bookingId);
        });
    }


    // Xử lý Form Sửa Trạng Thái
    if (editBookingStatusForm) {
        editBookingStatusForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const bookingId = hiddenEditBookingId.value;
            const newStatus = newBookingStatusSelect.value;
            const notes = adminNotesTextarea.value;

            const bookingIndex = mockBookings.findIndex(b => b.id === bookingId);
            if (bookingIndex > -1) {
                mockBookings[bookingIndex].status = newStatus;
                // Trong thực tế, bạn sẽ gửi notes lên server
                console.log(`Booking ${bookingId} status updated to ${newStatus}. Notes: ${notes}`);
                alert(`Đã cập nhật trạng thái cho đặt chỗ ${bookingId}.`);
                renderBookingsTable(mockBookings);
            }
            if(editBookingStatusModal) editBookingStatusModal.style.display = 'none';
        });
    }
    
    // Nút In vé (demo)
    if(printBookingBtn) {
        printBookingBtn.addEventListener('click', function() {
            alert("Chức năng In vé đang được phát triển!");
            // window.print(); // Có thể dùng cách này cho bản in đơn giản
        });
    }


    // --- Lọc và Tìm kiếm ---
    function filterAndSearchBookings() {
        const searchTerm = bookingSearchInput ? bookingSearchInput.value.toLowerCase() : '';
        const statusTerm = bookingStatusFilter ? bookingStatusFilter.value : '';
        const dateTerm = flightDateFilter ? flightDateFilter.value : '';

        const filteredBookings = mockBookings.filter(booking => {
            const matchesSearch = searchTerm === '' ||
                                  booking.id.toLowerCase().includes(searchTerm) ||
                                  booking.passengerName.toLowerCase().includes(searchTerm) ||
                                  booking.email.toLowerCase().includes(searchTerm);
            const matchesStatus = statusTerm === '' || booking.status === statusTerm;
            const matchesDate = dateTerm === '' || booking.flightDate === dateTerm;

            return matchesSearch && matchesStatus && matchesDate;
        });
        renderBookingsTable(filteredBookings);
    }

    if (applyBookingFilterBtn) applyBookingFilterBtn.addEventListener('click', filterAndSearchBookings);
    // Tùy chọn: tự động lọc khi thay đổi input
    // if (bookingSearchInput) bookingSearchInput.addEventListener('input', filterAndSearchBookings);
    // if (bookingStatusFilter) bookingStatusFilter.addEventListener('change', filterAndSearchBookings);
    // if (flightDateFilter) flightDateFilter.addEventListener('change', filterAndSearchBookings);


    // Đóng modal khi click bên ngoài
    window.addEventListener('click', function(event) {
        if (event.target == bookingDetailModal) {
            bookingDetailModal.style.display = "none";
        }
        if (event.target == editBookingStatusModal) {
            editBookingStatusModal.style.display = "none";
        }
    });

    // --- Khởi tạo ban đầu ---
    renderBookingsTable(mockBookings);

});