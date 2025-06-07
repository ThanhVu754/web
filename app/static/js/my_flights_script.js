// app/static/js/my_flights_script.js
document.addEventListener('DOMContentLoaded', function() {
    console.log("My Flights Client Script Loaded - API Integrated!");

    const lookupForm = document.getElementById('my-flights-lookup-form');
    const flightDetailsSection = document.getElementById('flight-details-section-vj');
    const lookupErrorMsg = document.getElementById('lookup-error-msg-vj');
    
    // Thêm một container mới trong my_flights.html để chứa danh sách tóm tắt các booking
    // Ví dụ: <div id="my-bookings-list-container-vj" class="my-bookings-list-container-vj" style="display: none; margin-top:20px;"></div>
    // Đặt nó phía trên flightDetailsSection hoặc ở vị trí phù hợp.
    const myBookingsListContainer = document.getElementById('my-bookings-list-container-vj'); 

    const changeFlightFormContainer = document.getElementById('change-flight-form-container-vj');
    const serviceModal = document.getElementById('service-modal-vj');
    const closeServiceModalBtn = document.getElementById('close-service-modal-btn-vj');
    const addServiceForm = document.getElementById('add-service-form-vj');
    const cancelChangeFlightBtn = document.getElementById('cancel-change-flight-btn-vj');
    const changeFlightSubmitForm = document.getElementById('change-flight-submit-form-vj');

    let currentBookingDataForCard = null; 
    let allUserBookings = []; // Lưu trữ tất cả booking của người dùng đã đăng nhập

    const statusMapping = {
        "confirmed": { text: "Đã xác nhận", class: "status-confirmed-vj" },
        "pending_payment": { text: "Chờ thanh toán", class: "status-pending-vj" },
        "payment_received": { text: "Đã thanh toán", class: "status-paid-vj" },
        "cancelled_by_user": { text: "Đã hủy bởi bạn", class: "status-cancelled-vj" },
        "cancelled_by_airline": { text: "Chuyến bay bị hủy", class: "status-cancelled-vj" }, // <<< VĂN BẢN THÂN THIỆN HƠN
        "completed": { text: "Đã hoàn thành", class: "status-completed-vj" },
        "no_show": { text: "Không có mặt", class: "status-no-show-vj" }
    };

    function formatCurrency(amount) {
        return (amount || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    }

     function renderFlightCard(booking) {
        if (!flightDetailsSection || !booking) {
            console.error("renderFlightCard: flightDetailsSection không tìm thấy hoặc thiếu dữ liệu booking.");
            return;
        }
        currentBookingDataForCard = booking; 

        let passengerHTML = '';
        if (booking.passengers && booking.passengers.length > 0) {
             passengerHTML = booking.passengers.map(p => `<li>${p.full_name} (${p.passenger_type || p.type})</li>`).join('');
        } else if (booking.passengers_list_str) { 
             passengerHTML = booking.passengers_list_str.split('; ').map(p_str => `<li>${p_str}</li>`).join('');
        } else {
            passengerHTML = '<li>Không có thông tin hành khách.</li>';
        }

        let ancillaryFare = booking.ancillary_services_total || 0;
        let servicesHTML = "<li>Chưa có dịch vụ đặt thêm.</li>";
        // Phần này cần API trả về bookedServices và currentSeat nếu muốn hiển thị chi tiết
        // if (booking.bookedServices && booking.bookedServices.length > 0) {
        //    servicesHTML = booking.bookedServices.map(s => `<li>${s.name}: ${s.detail}</li>`).join('');
        // }
        // if (booking.currentSeat && booking.currentSeat.detail) {
        //    servicesHTML += `<li>Chỗ ngồi: ${booking.currentSeat.detail}</li>`;
        // }

        // Cập nhật các key cho phù hợp với dữ liệu trả về từ API get_bookings_by_user_id / get_booking_by_pnr_and_lastname
         // Sử dụng statusMapping để lấy text và class
        const statusInfo = statusMapping[booking.booking_status] || { text: booking.booking_status || 'N/A', class: 'status-pending-vj' };
        const paymentStatusClass = booking.payment_status === 'paid' ? 'status-paid-vj' : '';
        const cancellableStatuses = ['pending_payment', 'confirmed', 'payment_received'];
           
        const isActionable = ['pending_payment', 'confirmed', 'payment_received'].includes(booking.booking_status);

        const isCancellable = cancellableStatuses.includes(booking.booking_status);
        const isCheckinEligible = booking.booking_status === 'confirmed' && booking.checkin_status !== 'checked_in';
        const cardHTML = `
        <div class="flight-card-vj" data-pnr="${booking.pnr}">
            <div class="card-header-vj">
                <h2>Mã đặt chỗ: <span>${booking.pnr}</span></h2>
                <span class="status-vj ${statusInfo.class}">${statusInfo.text}</span> </div>
            <div class="flight-segment-vj">
                <div class="segment-header-vj"><h4>Chuyến bay</h4><div class="flight-number-vj">Số hiệu: <span>${booking.flight_number || 'N/A'}</span></div></div>
                <div class="flight-route-vj">
                    <div class="city-point-vj"><span class="city-name-vj">${booking.departure_city || 'N/A'}</span><span class="city-code-vj">${booking.departure_iata || ''}</span></div>
                    <div class="flight-icon-container-vj"><span class="flight-icon-vj">✈</span><span class="flight-duration-vj">${booking.duration_formatted || 'N/A'}</span></div>
                    <div class="city-point-vj"><span class="city-name-vj">${booking.arrival_city || 'N/A'}</span><span class="city-code-vj">${booking.arrival_iata || ''}</span></div>
                </div>
                <div class="flight-timings-vj"><p>Khởi hành: <strong>${booking.departure_datetime_formatted || 'N/A'}</strong></p><p>Đến nơi: <strong>${booking.arrival_datetime_formatted || 'N/A'}</strong></p></div>
                <p>Hạng ghế: <span>${booking.seat_class_booked || 'N/A'}</span></p>
            </div>
            <div class="passengers-info-vj"><h4>Thông tin hành khách</h4><ul>${passengerHTML}</ul></div>
            <div class="fare-details-vj">
                <h4>Chi tiết giá vé</h4>
                <div class="fare-row-vj">
                    <span class="fare-label-vj">Giá vé cơ bản:</span> 
                    <span class="fare-value-vj">${formatCurrency(booking.base_fare)}</span>
                </div>
                <div class="fare-row-vj">
                    <span class="fare-label-vj">Dịch vụ cộng thêm:</span> 
                    <span class="fare-value-vj">${formatCurrency(booking.ancillary_services_total)}</span>
                </div>
                <div class="fare-row-vj">
                    <span class="fare-label-vj">Giảm giá:</span> 
                    <span class="fare-value-vj">-${formatCurrency(booking.discount_applied)}</span>
                </div>
                <hr class="fare-divider-vj">
                <div class="fare-row-vj total-fare-vj">
                    <strong>Tổng cộng:</strong> 
                    <strong>${formatCurrency(booking.total_amount)}</strong>
                </div>
                <p class="payment-status-info-vj">
                    Trạng thái thanh toán: <span class="${booking.payment_status === 'paid' ? 'status-paid-vj' : ''}">${booking.payment_status || 'N/A'}</span>
                </p>
            </div>
            <div class="flight-actions-vj">
                <button class="action-btn-vj primary-btn-vj online-checkin-btn-vj" 
                        ${!isCheckinEligible ? 'disabled' : ''}>
                    <i class="fas fa-check-circle"></i> Làm thủ tục
                </button>
                
                <button class="action-btn-vj cancel-booking-btn-vj secondary-btn-vj" 
                        data-booking-id="${booking.booking_id}" 
                        data-pnr="${booking.pnr}" 
                        ${!isActionable ? 'disabled' : ''}>
                    <i class="fas fa-times-circle"></i> Hủy chuyến bay
                </button>

                <button class="action-btn-vj add-service-btn-show-vj" 
                        ${!isActionable ? 'disabled' : ''}>
                    <i class="fas fa-plus-circle"></i> Thêm dịch vụ
                </button>
                
                <button class="action-btn-vj view-ticket-btn-vj"><i class="fas fa-print"></i> Xem vé</button>
            </div>
        </div>
        <button id="back-to-list-btn" class="action-btn-vj secondary-btn-vj" style="margin-top: 15px;"><i class="fas fa-arrow-left"></i> Quay lại danh sách</button>
        `;
        flightDetailsSection.innerHTML = cardHTML;
        flightDetailsSection.style.display = "block";
        if (myBookingsListContainer) myBookingsListContainer.style.display = "none";
        attachActionListenersToCard(booking);
    }
    
    function renderMyBookingsList(bookings) {
        if (!myBookingsListContainer) return;
        myBookingsListContainer.innerHTML = ''; 
        if(flightDetailsSection) flightDetailsSection.style.display = "none";

        if (!bookings || bookings.length === 0) {
            myBookingsListContainer.innerHTML = "<p>Bạn chưa có đặt chỗ nào.</p>";
        } else {
            const listTitle = document.createElement('h2');
            listTitle.textContent = "Lịch sử đặt chỗ của bạn";
            listTitle.className = "my-bookings-list-title-vj";
            myBookingsListContainer.appendChild(listTitle);

            bookings.forEach(booking => {
                const bookingSummaryDiv = document.createElement('div');
                bookingSummaryDiv.className = 'booking-summary-item-vj';
                
                // Sử dụng statusMapping để lấy text
                const statusInfo = statusMapping[booking.booking_status] || { text: booking.booking_status || 'N/A' };
                const displayDate = booking.departure_datetime_formatted ? booking.departure_datetime_formatted.split(', ')[2] : (booking.departure_time ? booking.departure_time.substring(0,10) : 'N/A');
                
                bookingSummaryDiv.innerHTML = `
                    <h4>Mã đặt chỗ: ${booking.pnr}</h4>
                    <p>Hành trình: ${booking.departure_city} → ${booking.arrival_city}</p>
                    <p>Ngày bay: ${displayDate}</p>
                    <p>Trạng thái: ${statusInfo.text}</p> <button class="btn btn-sm btn-view-booking-detail" data-booking-pnr="${booking.pnr}">Xem chi tiết</button>
                `;
                bookingSummaryDiv.querySelector('.btn-view-booking-detail').addEventListener('click', function(){
                    const pnrToView = this.dataset.bookingPnr;
                    const detailData = allUserBookings.find(b => b.pnr === pnrToView);
                    if(detailData) renderFlightCard(detailData);
                });
                myBookingsListContainer.appendChild(bookingSummaryDiv);
            });
        }
        myBookingsListContainer.style.display = "block";
    }

    if (lookupForm) {
        lookupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const pnr = document.getElementById('lookup-booking-code').value.trim().toUpperCase();
            const lastName = document.getElementById('lookup-last-name').value.trim(); // Để backend xử lý case-insensitivity cho họ
            // const firstName = document.getElementById('lookup-first-name').value.trim(); // Nếu API cần

            if(lookupErrorMsg) lookupErrorMsg.style.display = 'none';
            if(flightDetailsSection) flightDetailsSection.style.display = 'none';
            if(myBookingsListContainer) myBookingsListContainer.style.display = "none"; // Ẩn danh sách khi tra cứu

            if (!pnr || !lastName) {
                if(lookupErrorMsg) {
                    lookupErrorMsg.textContent = "Vui lòng nhập đầy đủ Mã đặt chỗ và Họ.";
                    lookupErrorMsg.style.display = 'block';
                }
                return;
            }

            console.log("Tra cứu PNR:", pnr, "Họ:", lastName);
            try {
                const response = await fetch('/api/bookings/lookup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pnr: pnr, lastName: lastName }) // lastName gửi đi, backend sẽ UPPERCASE khi query
                });
                const result = await response.json();
                console.log("Kết quả tra cứu PNR:", result);

                if (response.ok && result.success && result.booking) {
                    renderFlightCard(result.booking); 
                } else {
                    if(lookupErrorMsg) {
                        lookupErrorMsg.textContent = result.message || "Không tìm thấy thông tin đặt chỗ phù hợp.";
                        lookupErrorMsg.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error("Lỗi khi tra cứu đặt chỗ:", error);
                if(lookupErrorMsg) {
                    lookupErrorMsg.textContent = "Đã xảy ra lỗi kết nối. Vui lòng thử lại.";
                    lookupErrorMsg.style.display = 'block';
                }
            }
        });
    }

    async function fetchMyBookingsOnLoad() {
        console.log("Kiểm tra trạng thái đăng nhập để tải 'Chuyến bay của tôi'...");
        try {
            const authResponse = await fetch('/api/auth/status'); // API kiểm tra đăng nhập
            const authData = await authResponse.json();
            console.log("Auth status for my bookings:", authData);

            if (authData.logged_in) {
                console.log("Đã đăng nhập, đang tải danh sách đặt chỗ...");
                const bookingsResponse = await fetch('/api/my-bookings'); // API lấy booking của user
                const bookingsData = await bookingsResponse.json();
                console.log("Bookings data:", bookingsData);

                if (bookingsResponse.ok && bookingsData.success && bookingsData.bookings) {
                    allUserBookings = bookingsData.bookings; // Lưu lại để dùng cho nút "Xem chi tiết"
                    renderMyBookingsList(allUserBookings);
                    if (lookupForm && allUserBookings.length > 0) {
                        // Có thể ẩn form tra cứu nếu đã có danh sách, hoặc tùy UX bạn muốn
                        // lookupForm.style.display = 'none'; 
                        // Hoặc chỉ thông báo:
                        if(lookupErrorMsg && !lookupErrorMsg.textContent) { // Chỉ hiện nếu chưa có lỗi nào từ tra cứu
                            lookupErrorMsg.textContent = "Danh sách đặt chỗ của bạn đã được hiển thị bên dưới.";
                            lookupErrorMsg.style.display = 'block';
                            lookupErrorMsg.className = 'info-message-vj'; // Đổi class để có style khác lỗi
                        }
                    }
                } else {
                    if (myBookingsListContainer) myBookingsListContainer.innerHTML = `<p>${bookingsData.message || 'Không tải được danh sách chuyến bay của bạn.'}</p>`;
                    if (myBookingsListContainer) myBookingsListContainer.style.display = "block";
                }
            } else {
                console.log("Chưa đăng nhập, sẽ không tự động tải 'Chuyến bay của tôi'.");
                if (myBookingsListContainer) myBookingsListContainer.innerHTML = "<p>Vui lòng đăng nhập để xem chuyến bay của bạn, hoặc sử dụng form tra cứu nếu có mã đặt chỗ.</p>";
                if (myBookingsListContainer) myBookingsListContainer.style.display = "block";
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách chuyến bay của tôi (catch):", error);
            if (myBookingsListContainer) myBookingsListContainer.innerHTML = "<p>Lỗi kết nối khi tải chuyến bay của bạn.</p>";
            if (myBookingsListContainer) myBookingsListContainer.style.display = "block";
        }
    }

    // --- CÁC HÀM VÀ EVENT LISTENER CHO CÁC NÚT TRONG CARD (Đổi vé, Thêm DV, Hủy) ---
    // (Giữ nguyên logic alert mô phỏng của bạn, hoặc chúng ta sẽ kết nối API cho chúng sau)
    // --- CẬP NHẬT HÀM GẮN EVENT LISTENER CHO CÁC NÚT TRONG CARD ---
    function attachActionListenersToCard(booking) { // <<< Sửa tham số: nhận cả object booking
        const pnr = booking.pnr;
        const bookingId = booking.booking_id; // Lấy booking_id từ object
        const currentStatus = booking.booking_status;

        const cardContainer = document.getElementById('flight-details-section-vj');
        if (!cardContainer) {
            console.error("Không tìm thấy khu vực #flight-details-section-vj");
            return;
        }

        const card = cardContainer.querySelector(`.flight-card-vj[data-pnr="${pnr}"]`);
        // Log cảnh báo nếu không tìm thấy card, nhưng không return để vẫn gắn được listener cho nút "Quay lại"
        if (!card) {
            console.warn(`Không tìm thấy card với PNR ${pnr}. Các nút action bên trong card sẽ không hoạt động.`);
        }

        // Listener cho nút "Quay lại danh sách" (đã hoạt động)
        const backToListBtn = cardContainer.querySelector('#back-to-list-btn');
        if (backToListBtn) {
            backToListBtn.removeEventListener('click', handleBackToListClick);
            backToListBtn.addEventListener('click', handleBackToListClick);
        }
        
        if (!card) return; // Nếu không có card, dừng ở đây

         // Cập nhật listener cho nút Hủy chuyến bay
        const cancelBtn = card.querySelector('.cancel-booking-btn-vj');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', async function() {
                // Kiểm tra trạng thái trước khi làm bất cứ điều gì
                if (currentStatus === 'cancelled_by_airline') {
                    alert("Chuyến bay đã bị hủy bởi hãng hàng không.");
                    return;
                }
                if (currentStatus === 'cancelled_by_user') {
                    alert("Bạn đã hủy đặt chỗ này rồi.");
                    return;
                }
                if (this.disabled) { // Kiểm tra nếu nút bị disabled
                    alert("Không thể hủy đặt chỗ ở trạng thái hiện tại.");
                    return;
                }

                if (confirm(`Bạn có chắc chắn muốn hủy đặt chỗ ${pnr} không? Thao tác này không thể hoàn tác.`)) {
                    try {
                        const response = await fetch(`/api/my-bookings/${bookingId}/cancel`, { method: 'POST' });
                        const result = await response.json();
                        
                        if (response.ok && result.success) {
                            alert(result.message || "Đã hủy đặt chỗ thành công!");
                            
                            // Cập nhật lại danh sách booking chung
                            const index = allUserBookings.findIndex(b => b.booking_id == bookingId);
                            if (index > -1) {
                                allUserBookings.splice(index, 1); // Xóa booking đã hủy khỏi danh sách hiển thị
                            }
                            
                            // Quay về trang danh sách đã được cập nhật
                            renderMyBookingsList(allUserBookings);
                        } else {
                            alert("Lỗi khi hủy đặt chỗ: " + (result.message || "Không thể thực hiện."));
                        }
                    } catch (error) { 
                        console.error("Lỗi khi hủy đặt chỗ:", error);
                        alert("Lỗi kết nối khi cố gắng hủy đặt chỗ.");
                    }
                }
            });
        }

        card.querySelector('.add-service-btn-show-vj')?.addEventListener('click', () => {
             if (serviceModal && currentBookingDataForCard) {
                document.getElementById('modal-service-pnr-display-vj').textContent = currentBookingDataForCard.pnr;
                document.getElementById('service-booking-pnr').value = currentBookingDataForCard.pnr; // Sửa ID này nếu cần

                // Cập nhật thông tin dịch vụ hiện tại trong modal (cần API backend để lấy thông tin này)
                // Tạm thời để trống hoặc lấy từ mock/dữ liệu client-side nếu có
                document.getElementById('current-baggage-display-vj').textContent = "Chưa có"; // Ví dụ
                document.getElementById('modal-baggage-option-vj').value = "none_bag";

                document.getElementById('current-seat-display-vj').textContent = "Chưa chọn"; // Ví dụ
                document.getElementById('modal-seat-preference-vj').value = "any_standard";
                
                document.getElementById('current-meal-display-vj').textContent = "Không có"; // Ví dụ
                document.getElementById('modal-meal-option-vj').value = "none_meal";

                // updateModalServiceFees(); // Hàm này cần được định nghĩa hoặc giữ lại từ mock script của bạn
                serviceModal.style.display = 'flex';
            } else { console.warn("serviceModal or currentBookingDataForCard not found");}
        });
        card.querySelector('.view-ticket-btn-vj')?.addEventListener('click', () => {
            alert(`Chức năng Xem vé cho mã đặt chỗ ${pnr} đang được phát triển.`);
        });
        
        // Bỏ nút xóa user ở đây vì đây là trang của client
        // card.querySelector('.cancel-flight-btn-vj')?.addEventListener('click', () => { ... });
    }
    
    function handleBackToListClick() {
        console.log("Nút 'Quay lại danh sách' được nhấn.");
        // Gọi lại hàm render danh sách với dữ liệu đã tải trước đó
        // (biến allUserBookings đã lưu danh sách này)
        renderMyBookingsList(allUserBookings); 
    }

    // Xử lý modal thêm dịch vụ (giữ lại các phần DOM và logic cơ bản từ file gốc của bạn)
    if (closeServiceModalBtn && serviceModal) {
        closeServiceModalBtn.addEventListener('click', () => { serviceModal.style.display = 'none'; });
    }
    // ... (các listener khác cho serviceModal, addServiceForm, changeFlightSubmitForm)
    // ... (hàm updateModalServiceFees nếu bạn giữ lại)

    // --- Khởi tạo ---
    fetchMyBookingsOnLoad(); // Gọi để tải danh sách chuyến bay của tôi khi trang được load
});