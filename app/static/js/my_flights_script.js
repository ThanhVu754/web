document.addEventListener('DOMContentLoaded', function() {
    console.log("My Flights Client Script Loaded!");

    const lookupForm = document.getElementById('my-flights-lookup-form');
    const flightDetailsSection = document.getElementById('flight-details-section-vj');
    const lookupErrorMsg = document.getElementById('lookup-error-msg-vj');

    // Containers cho các form/modal khác
    const changeFlightFormContainer = document.getElementById('change-flight-form-container-vj');
    const serviceModal = document.getElementById('service-modal-vj');
    const closeServiceModalBtn = document.getElementById('close-service-modal-btn-vj');
    const addServiceForm = document.getElementById('add-service-form-vj');
    const cancelChangeFlightBtn = document.getElementById('cancel-change-flight-btn-vj');
    const changeFlightSubmitForm = document.getElementById('change-flight-submit-form-vj');

    let currentBookingData = null; // Để lưu trữ dữ liệu chuyến bay hiện tại đang xem

    // --- Mock Data (Thay thế bằng API call thực tế) ---
    const mockBookingsData = {
        "ABC123NGUYENVANA": {
            pnr: "ABC123",
            status: "Đã xác nhận", statusClass: "status-confirmed-vj",
            goFlightNo: "SA888", goOriginCity: "TP. Hồ Chí Minh", goOriginCode: "SGN",
            goDestinationCity: "Hà Nội", goDestinationCode: "HAN", goDuration: "2 giờ 05 phút",
            goDepartureDateTime: "08:00, Thứ Hai, 28/07/2025", goArrivalDateTime: "10:05, Thứ Hai, 28/07/2025",
            goSeatClass: "Phổ thông",
            passengers: [{ name: "NGUYEN VAN A", type: "Người lớn" }, { name: "NGUYEN THI B", type: "Trẻ em" }],
            bookedServices: [
                { name: "Hành lý ký gửi", detail: "25kg", currentOptionValue: "25kg", price: 280000 },
                { name: "Suất ăn", detail: "Cơm gà sốt tiêu", currentOptionValue: "meal_chicken_current", price: 120000 }
            ],
            currentSeat: { detail: "15B (Lối đi)", optionValue: "seat_15B_current", price: 50000 },
            baseFare: 1800000, taxesFees: 250000,
            paymentStatus: "Đã thanh toán (MoMo)", paymentStatusClass: "status-paid-vj"
        },
        "DEF456TRANVANB": {
            pnr: "DEF456",
            status: "Đã hủy", statusClass: "status-cancelled-vj",
            goFlightNo: "VJ160", goOriginCity: "Đà Nẵng", goOriginCode: "DAD",
            goDestinationCity: "Hải Phòng", goDestinationCode: "HPH", goDuration: "1 giờ 15 phút",
            goDepartureDateTime: "14:00, Thứ Tư, 30/07/2025", goArrivalDateTime: "15:15, Thứ Tư, 30/07/2025",
            goSeatClass: "Thương gia",
            passengers: [{ name: "TRAN VAN B", type: "Người lớn" }],
            bookedServices: [],
            currentSeat: null,
            baseFare: 2500000, taxesFees: 300000,
            paymentStatus: "Đã hoàn tiền", paymentStatusClass: ""
        }
    };

    function formatCurrency(amount) {
        return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    }

    function renderFlightCard(data) {
        if (!flightDetailsSection || !data) return;

        currentBookingData = data; // Lưu dữ liệu hiện tại

        let ancillaryFare = 0;
        data.bookedServices.forEach(s => ancillaryFare += (s.price || 0) );
        if (data.currentSeat && data.currentSeat.price) {
            ancillaryFare += data.currentSeat.price;
        }

        let passengerHTML = data.passengers.map(p => `<li>${p.name} (${p.type})</li>`).join('');
        let servicesHTML = data.bookedServices.map(s => `<li>${s.name}: ${s.detail}</li>`).join('');
        if (data.currentSeat && data.currentSeat.detail) {
            servicesHTML += `<li>Chỗ ngồi: ${data.currentSeat.detail}</li>`;
        }
        if (!servicesHTML) servicesHTML = "<li>Không có dịch vụ nào được đặt thêm.</li>";


        const cardHTML = `
        <div class="flight-card-vj" data-pnr="${data.pnr}">
            <div class="card-header-vj">
                <h2>Chuyến bay của bạn: <span>${data.pnr}</span></h2>
                <span class="status-vj ${data.statusClass}">${data.status}</span>
            </div>
            <div class="flight-segment-vj">
                <div class="segment-header-vj"><h4>Chặng đi</h4><div class="flight-number-vj">Số hiệu: <span>${data.goFlightNo}</span></div></div>
                <div class="flight-route-vj">
                    <div class="city-point-vj"><span class="city-name-vj">${data.goOriginCity}</span><span class="city-code-vj">${data.goOriginCode}</span></div>
                    <div class="flight-icon-container-vj"><span class="flight-icon-vj">✈</span><span class="flight-duration-vj">${data.goDuration}</span></div>
                    <div class="city-point-vj"><span class="city-name-vj">${data.goDestinationCity}</span><span class="city-code-vj">${data.goDestinationCode}</span></div>
                </div>
                <div class="flight-timings-vj"><p>Khởi hành: <strong>${data.goDepartureDateTime}</strong></p><p>Đến nơi: <strong>${data.goArrivalDateTime}</strong></p></div>
                <p>Hạng ghế: <span>${data.goSeatClass}</span></p>
            </div>
            <div class="passengers-info-vj"><h4>Thông tin hành khách</h4><ul>${passengerHTML}</ul></div>
            <div class="services-info-vj"><h4>Dịch vụ đã đặt</h4><ul>${servicesHTML}</ul></div>
            <div class="fare-details-vj">
                <h4>Chi tiết giá vé</h4>
                <div class="fare-row-vj"><span class="fare-label-vj">Giá vé cơ bản:</span> <span class="fare-value-vj">${formatCurrency(data.baseFare)}</span></div>
                <div class="fare-row-vj"><span class="fare-label-vj">Thuế & Phí:</span> <span class="fare-value-vj">${formatCurrency(data.taxesFees)}</span></div>
                <div class="fare-row-vj"><span class="fare-label-vj">Dịch vụ cộng thêm:</span> <span class="fare-value-vj">${formatCurrency(ancillaryFare)}</span></div>
                <hr class="fare-divider-vj">
                <div class="fare-row-vj total-fare-vj"><strong>Tổng cộng:</strong> <strong>${formatCurrency(data.baseFare + data.taxesFees + ancillaryFare)}</strong></div>
                <p class="payment-status-info-vj">Trạng thái thanh toán: <span class="${data.paymentStatusClass}">${data.paymentStatus}</span></p>
            </div>
            <div class="flight-actions-vj">
                <button class="action-btn-vj primary-btn-vj online-checkin-btn-vj"><i class="fas fa-check-circle"></i> Làm thủ tục</button>
                <button class="action-btn-vj change-flight-btn-show-vj"><i class="fas fa-exchange-alt"></i> Đổi chuyến bay</button>
                <button class="action-btn-vj add-service-btn-show-vj"><i class="fas fa-plus-circle"></i> Thêm dịch vụ</button>
                <button class="action-btn-vj view-ticket-btn-vj"><i class="fas fa-print"></i> Xem vé</button>
                <button class="action-btn-vj cancel-flight-btn-vj secondary-btn-vj"><i class="fas fa-times-circle"></i> Hủy chuyến</button>
            </div>
        </div>`;
        flightDetailsSection.innerHTML = cardHTML;
        flightDetailsSection.style.display = "block";
        attachActionListenersToCard(data.pnr); // Gắn listener cho các nút trong card mới
    }

    function attachActionListenersToCard(pnr) {
        const card = flightDetailsSection.querySelector(`.flight-card-vj[data-pnr="${pnr}"]`);
        if (!card) return;

        card.querySelector('.online-checkin-btn-vj')?.addEventListener('click', () => {
            const lastName = document.getElementById('lookup-last-name').value; // Lấy họ từ form tìm kiếm
            window.location.href = `online_checkin.html?pnr=${pnr}&lastName=${lastName}`;
        });
        card.querySelector('.change-flight-btn-show-vj')?.addEventListener('click', () => {
            if (changeFlightFormContainer && currentBookingData) {
                document.getElementById('current-flight-info-for-change-vj').textContent = 
                    `${currentBookingData.goOriginCode} → ${currentBookingData.goDestinationCode}, ${currentBookingData.goDepartureDateTime.split(', ')[0]}`;
                changeFlightFormContainer.style.display = 'block';
                changeFlightFormContainer.scrollIntoView({behavior: 'smooth'});
            }
        });
        card.querySelector('.add-service-btn-show-vj')?.addEventListener('click', () => {
            if (serviceModal && currentBookingData) {
                document.getElementById('modal-service-pnr-display-vj').textContent = currentBookingData.pnr;
                // Cập nhật thông tin dịch vụ hiện tại trong modal
                let currentBaggage = currentBookingData.bookedServices.find(s => s.name.toLowerCase().includes("hành lý"));
                document.getElementById('current-baggage-display-vj').textContent = currentBaggage ? currentBaggage.detail : "Không có";
                document.getElementById('modal-baggage-option-vj').value = currentBaggage ? currentBaggage.currentOptionValue : "none_bag";

                document.getElementById('current-seat-display-vj').textContent = currentBookingData.currentSeat ? currentBookingData.currentSeat.detail : "Chưa chọn";
                document.getElementById('modal-seat-preference-vj').value = currentBookingData.currentSeat ? currentBookingData.currentSeat.optionValue : "any_standard";
                
                let currentMeal = currentBookingData.bookedServices.find(s => s.name.toLowerCase().includes("suất ăn"));
                document.getElementById('current-meal-display-vj').textContent = currentMeal ? currentMeal.detail : "Không có";
                document.getElementById('modal-meal-option-vj').value = currentMeal ? currentMeal.currentOptionValue : "none_meal";

                updateModalServiceFees(); // Tính toán phí ban đầu
                serviceModal.style.display = 'flex';
            }
        });
        card.querySelector('.view-ticket-btn-vj')?.addEventListener('click', () => {
            alert(`Chức năng Xem vé cho mã đặt chỗ ${pnr} đang được phát triển.`);
        });
        card.querySelector('.cancel-flight-btn-vj')?.addEventListener('click', () => {
            if(confirm(`Bạn có chắc chắn muốn yêu cầu hủy chuyến bay ${pnr} không?`)) {
                alert(`Yêu cầu hủy chuyến bay ${pnr} đã được gửi (mô phỏng).`);
                // Trong ứng dụng thực tế, bạn sẽ gọi API và cập nhật trạng thái
                // Có thể cập nhật mockBookingsData và render lại card với trạng thái mới
                if (mockBookingsData[pnr.toUpperCase() + document.getElementById('lookup-last-name').value.toUpperCase()]) {
                    mockBookingsData[pnr.toUpperCase() + document.getElementById('lookup-last-name').value.toUpperCase()].status = "Đã hủy";
                    mockBookingsData[pnr.toUpperCase() + document.getElementById('lookup-last-name').value.toUpperCase()].statusClass = "status-cancelled-vj";
                    renderFlightCard(mockBookingsData[pnr.toUpperCase() + document.getElementById('lookup-last-name').value.toUpperCase()]);
                }
            }
        });
    }

    // --- Lookup Form Submission ---
    // static/js/client/my_flights_script.js

    document.addEventListener('DOMContentLoaded', function () {
        console.log("My Flights Script Loaded (AJAX Enabled)");

        const lookupForm = document.getElementById('my-flights-lookup-form');
        const flightDetailsSection = document.getElementById('flight-details-section-vj');
        const lookupErrorMsg = document.getElementById('lookup-error-msg-vj');

        // === XỬ LÝ AJAX TRA CỨU CHUYẾN BAY ===
        if (lookupForm) {
            lookupForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const pnr = document.getElementById('lookup-booking-code').value.trim().toUpperCase();
                const lastName = document.getElementById('lookup-last-name').value.trim().toUpperCase();

                lookupErrorMsg.style.display = 'none';
                flightDetailsSection.style.display = 'none';

                if (!pnr || !lastName) {
                    lookupErrorMsg.textContent = "Vui lòng nhập đầy đủ Mã đặt chỗ và Họ.";
                    lookupErrorMsg.style.display = 'block';
                    return;
                }

                try {
                    const res = await fetch('/api/bookings/lookup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pnr, lastName })
                    });
                    const data = await res.json();
                    if (data.success && data.booking) {
                        renderFlightCard(data.booking);
                    } else {
                        lookupErrorMsg.textContent = "Không tìm thấy thông tin đặt chỗ phù hợp.";
                        lookupErrorMsg.style.display = 'block';
                    }
                } catch (error) {
                    console.error(error);
                    lookupErrorMsg.textContent = "Đã xảy ra lỗi. Vui lòng thử lại.";
                    lookupErrorMsg.style.display = 'block';
                }
            });
        }

        // === HIỂN THỊ THÔNG TIN CHUYẾN BAY ===
        function renderFlightCard(data) {
            flightDetailsSection.innerHTML = `
                <div class="flight-card-vj">
                    <div class="card-header-vj">
                        <h2>Mã đặt chỗ: <span>${data.pnr}</span></h2>
                        <span class="status-vj ${data.status_class}">${data.status}</span>
                    </div>
                    <div class="flight-segment-vj">
                        <div><strong>Điểm đi:</strong> ${data.departure}</div>
                        <div><strong>Điểm đến:</strong> ${data.arrival}</div>
                        <div><strong>Ngày đi:</strong> ${data.departure_date} - ${data.departure_time}</div>
                        <div><strong>Hạng ghế:</strong> ${data.seat_class}</div>
                    </div>
                    <div class="passengers-info-vj">
                        <h4>Hành khách:</h4>
                        <ul>${data.passengers.map(p => `<li>${p.name} (${p.type})</li>`).join('')}</ul>
                    </div>
                    <div class="fare-details-vj">
                        <p><strong>Giá vé:</strong> ${data.base_price.toLocaleString()} VND</p>
                        <p><strong>Thuế phí:</strong> ${data.tax_fee.toLocaleString()} VND</p>
                    </div>
                </div>
            `;
            flightDetailsSection.style.display = 'block';
            }
        });


    // --- Change Flight Form Logic ---
    if (cancelChangeFlightBtn && changeFlightFormContainer && flightDetailsSection) {
        cancelChangeFlightBtn.addEventListener('click', function() {
            changeFlightFormContainer.style.display = 'none';
            if (currentBookingData) { // Hiển thị lại thẻ chi tiết chuyến bay nếu có
                flightDetailsSection.style.display = 'block';
                flightDetailsSection.scrollIntoView({behavior: 'smooth'});
            }
        });
    }
    if (changeFlightSubmitForm) {
        changeFlightSubmitForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert("Yêu cầu thay đổi chuyến bay của bạn đã được gửi (mô phỏng).");
            if(changeFlightFormContainer) changeFlightFormContainer.style.display = 'none';
            if (currentBookingData) {
                flightDetailsSection.style.display = 'block'; // Hiện lại thẻ
            }
        });
    }

    // --- Add Service Modal Logic ---
    if (closeServiceModalBtn && serviceModal) {
        closeServiceModalBtn.addEventListener('click', () => { serviceModal.style.display = 'none'; });
    }
    window.addEventListener('click', (event) => { // Đóng modal khi click bên ngoài
        if (event.target == serviceModal) {
            serviceModal.style.display = "none";
        }
    });

    const modalBaggageSelect = document.getElementById('modal-baggage-option-vj');
    const modalSeatSelect = document.getElementById('modal-seat-preference-vj');
    const modalMealSelect = document.getElementById('modal-meal-option-vj');
    const modalBaggageFeeDisplay = document.getElementById('modal-baggage-fee-display-vj');
    const modalSeatFeeDisplay = document.getElementById('modal-seat-fee-display-vj');
    const modalMealFeeDisplay = document.getElementById('modal-meal-fee-display-vj');
    const modalTotalFeeDisplay = document.getElementById('modal-total-service-cost-display-vj');

    function updateModalServiceFees() {
        if (!currentBookingData) return;
        let newBaggageCost = 0;
        let newSeatCost = 0;
        let newMealCost = 0;

        // Tính chi phí dựa trên lựa chọn MỚI, không phải giá trị hiện tại đã có trong vé
        if (modalBaggageSelect && modalBaggageSelect.value !== "current" && !modalBaggageSelect.selectedOptions[0].dataset.isRemoval) {
            newBaggageCost = parseFloat(modalBaggageSelect.selectedOptions[0].dataset.price) || 0;
        }
        if (modalSeatSelect && modalSeatSelect.value !== "current") {
            newSeatCost = parseFloat(modalSeatSelect.selectedOptions[0].dataset.price) || 0;
        }
        if (modalMealSelect && modalMealSelect.value !== "current" && !modalMealSelect.selectedOptions[0].dataset.isRemoval) {
            newMealCost = parseFloat(modalMealSelect.selectedOptions[0].dataset.price) || 0;
        }
        
        // Hiển thị chi phí cho từng dịch vụ (đây là chi phí *thêm* hoặc *thay đổi*)
        if(modalBaggageFeeDisplay) modalBaggageFeeDisplay.textContent = formatCurrency(newBaggageCost); // Cần logic phức tạp hơn để tính chênh lệch nếu thay đổi
        if(modalSeatFeeDisplay) modalSeatFeeDisplay.textContent = formatCurrency(newSeatCost);
        if(modalMealFeeDisplay) modalMealFeeDisplay.textContent = formatCurrency(newMealCost);
        if(modalTotalFeeDisplay) modalTotalFeeDisplay.textContent = formatCurrency(newBaggageCost + newSeatCost + newMealCost);
    }

    if (modalBaggageSelect) modalBaggageSelect.addEventListener('change', updateModalServiceFees);
    if (modalSeatSelect) modalSeatSelect.addEventListener('change', updateModalServiceFees);
    if (modalMealSelect) modalMealSelect.addEventListener('change', updateModalServiceFees);
    
    if (addServiceForm) {
        addServiceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const totalNewServiceCostText = modalTotalFeeDisplay ? modalTotalFeeDisplay.textContent : "0 VND";
            alert(`Yêu cầu thêm/thay đổi dịch vụ với tổng chi phí mới ${totalNewServiceCostText} đã được gửi (mô phỏng). Vui lòng hoàn tất thanh toán (nếu có).`);
            if(serviceModal) serviceModal.style.display = 'none';
            // TODO: Cập nhật mockBookingsData và render lại thẻ chuyến bay
        });
    }
});