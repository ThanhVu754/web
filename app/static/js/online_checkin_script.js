// app/static/js/online_checkin_script.js
document.addEventListener('DOMContentLoaded', function() {
    console.log("Online Check-in Script Loaded - API Integrated!");

    // DOM Elements for Steps
    const steps = {
        lookup: document.getElementById('checkin-step-lookup'),
        flightsPassengers: document.getElementById('checkin-step-flights-passengers'),
        dangerousGoods: document.getElementById('checkin-step-dangerous-goods'),
        seatSelection: document.getElementById('checkin-step-seat-selection'),
        confirmation: document.getElementById('checkin-step-confirmation')
    };
    const progressSteps = document.querySelectorAll('.checkin-progress-bar-vj .progress-step-vj');
    const staticInfoDiv = document.querySelector(".checkin-static-info-vj");

    // DOM Elements for Step 1: Lookup
    const lookupForm = document.getElementById('checkin-lookup-form');
    const bookingCodeInput = document.getElementById('checkin-booking-code');
    const lastNameInput = document.getElementById('checkin-last-name');
    const lookupErrorMsg = document.getElementById('lookup-error-message');

    // DOM Elements for Step 2: Flights & Passengers
    const flightsListDiv = document.getElementById('flights-for-checkin-list');
    const passengersListDiv = document.getElementById('passengers-for-checkin-list');
    const passengersSelectionForm = document.getElementById('passengers-selection-form');
    const passengerSelectionError = document.getElementById('passenger-selection-error');

    // DOM Elements for Step 3: Dangerous Goods
    const dangerousGoodsForm = document.getElementById('dangerous-goods-form');
    const confirmDGBCheckbox = document.getElementById('confirm-dangerous-goods');
    const dangerousGoodsError = document.getElementById('dangerous-goods-error');
    
    // DOM Elements for Step 4: Seat Selection
    const passengerSeatDisplayList = document.getElementById('passenger-seat-display-list');

    // DOM Elements for Step 5: Confirmation
    const boardingPassSummaryList = document.getElementById('boarding-pass-summary-list');

    // Navigation Buttons
    const btnBackToLookup = document.getElementById('btn-back-to-lookup');
    const btnBackToPassengers = document.getElementById('btn-back-to-passengers');
    const btnBackToDangerousGoods = document.getElementById('btn-back-to-dangerous-goods');
    const btnConfirmSeatsCheckin = document.getElementById('btn-confirm-seats-checkin');

    let currentBookingData = null; // Để lưu trữ chi tiết đặt chỗ từ API
    let selectedPassengers = [];   // Để lưu ID và tên của hành khách được chọn

    // --- Step Navigation Functions ---
    function updateProgress(currentStepNumber) {
        progressSteps.forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.remove('active', 'completed');
            if (stepNum < currentStepNumber) {
                step.classList.add('completed');
            } else if (stepNum === currentStepNumber) {
                step.classList.add('active');
            }
        });
    }

    function showStep(stepId) {
        console.log(`showStep được gọi với stepId: '${stepId}'`); // DEBUG
        if (steps[stepId]) {
            steps[stepId].classList.add('active');
            // ... (phần cập nhật progress bar giữ nguyên) ...
        } else {
            console.error(`Không tìm thấy element cho bước: '${stepId}'`); // DEBUG
        }
        for (const key in steps) {
            if (steps[key]) steps[key].classList.remove('active');
        }
        if (steps[stepId]) {
            steps[stepId].classList.add('active');
            const stepNumber = parseInt(document.querySelector(`.progress-step-vj[data-step-name="${stepId}"]`)?.dataset.step || '1');
            updateProgress(stepNumber);
            steps[stepId].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (staticInfoDiv) {
            staticInfoDiv.style.display = (stepId === 'lookup') ? 'block' : 'none';
        }
    }

    // Step 1: Handle Lookup Form Submission
     if (lookupForm) {
        lookupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const pnr = bookingCodeInput.value.trim().toUpperCase();
            const lastName = lastNameInput.value.trim();
            if(lookupErrorMsg) lookupErrorMsg.style.display = 'none';

            if (!pnr || !lastName) {
                if(lookupErrorMsg) { /* ... hiển thị lỗi ... */ }
                return;
            }
            
            console.log("Bắt đầu tra cứu check-in cho PNR:", pnr); // DEBUG

            try {
                const response = await fetch('/api/checkin/lookup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pnr: pnr, lastName: lastName })
                });
                
                // Luôn cố gắng parse JSON, ngay cả khi là lỗi 400 hoặc 500
                const result = await response.json();
                console.log("Kết quả API tra cứu check-in:", result); // DEBUG: XEM KẾT QUẢ API

                if (response.ok && result.success && result.booking) {
                    console.log("Tra cứu thành công. Dữ liệu booking nhận được:", result.booking); // DEBUG
                    currentBookingData = result.booking;
                    
                    console.log("Đang gọi populateFlightsAndPassengersStep()..."); // DEBUG
                    populateFlightsAndPassengersStep();
                    
                    console.log("Đang gọi showStep('flightsPassengers')..."); // DEBUG
                    showStep('flightsPassengers');
                    if (!currentBookingData.booking_id) {
                        console.error("LỖI: Dữ liệu booking trả về từ API không chứa 'booking_id'.", currentBookingData);
                        alert("Lỗi dữ liệu từ server, không thể tiếp tục.");
                        return;
                    }

                    console.log("Tra cứu thành công, currentBookingData đã được gán:", currentBookingData);
                    populateFlightsAndPassengersStep();
                    showStep('flightsPassengers');

                } else {
                    console.error("API tra cứu không thành công hoặc không có dữ liệu booking."); // DEBUG
                    if(lookupErrorMsg) {
                        lookupErrorMsg.textContent = result.message || "Không tìm thấy đặt chỗ hoặc thông tin không chính xác.";
                        lookupErrorMsg.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error("Lỗi trong khối catch khi tra cứu đặt chỗ:", error);
                if(lookupErrorMsg) {
                    lookupErrorMsg.textContent = "Đã xảy ra lỗi kết nối. Vui lòng thử lại.";
                    lookupErrorMsg.style.display = 'block';
                }
            }
        });
    }

    // Step 2: Populate Flights and Passengers
    function populateFlightsAndPassengersStep() {
        if (!currentBookingData) {
            console.error("populateFlightsAndPassengersStep: currentBookingData là null!");
            return;
        }
        if (!flightsListDiv || !passengersListDiv) {
            console.error("populateFlightsAndPassengersStep: Không tìm thấy flightsListDiv hoặc passengersListDiv!");
            return;
        }
        console.log("Bắt đầu điền dữ liệu vào Bước 2 với dữ liệu:", currentBookingData);

        // --- Điền thông tin chuyến bay ---
        flightsListDiv.innerHTML = '';
        const flight = currentBookingData; // API trả về booking object đã join với flight và airport
        const flightDiv = document.createElement('div');
        flightDiv.className = 'flight-checkin-item-vj';
        flightDiv.innerHTML = `
            <h3>Chuyến bay ${flight.flight_number}: ${flight.departure_city} <i class="fas fa-long-arrow-alt-right"></i> ${flight.arrival_city}</h3>
            <p><i class="fas fa-calendar-alt"></i> Khởi hành: ${flight.departure_datetime_formatted || flight.departure_time}</p>
            <p>Trạng thái: <span class="status-tag-vj status-ok-vj">Sẵn sàng làm thủ tục</span></p>
        `;
        flightsListDiv.appendChild(flightDiv);
        console.log("Đã điền HTML cho chuyến bay.");

        // --- Điền danh sách hành khách ---
        passengersListDiv.innerHTML = '';
        if (flight.passengers && Array.isArray(flight.passengers)) {
            flight.passengers.forEach(pax => {
                const paxDiv = document.createElement('div');
                paxDiv.className = 'passenger-checkin-item-vj';
                
                const isDisabled = !pax.eligible || pax.checked_in;
                const statusText = pax.checked_in ? ' (Đã làm thủ tục)' : (!pax.eligible ? ' (Không đủ điều kiện)' : '');
                
                paxDiv.innerHTML = `
                    <label class="${isDisabled ? 'disabled' : ''}">
                        <input type="checkbox" name="selected_passengers" value="${pax.id}" data-name="${pax.full_name}" ${isDisabled ? 'disabled' : ''} ${!isDisabled ? 'checked' : ''}>
                        <span class="pax-name">${pax.full_name}</span> 
                        <span class="pax-type">(${pax.passenger_type})</span> 
                        <span class="pax-status">${statusText}</span>
                    </label>
                `;
                passengersListDiv.appendChild(paxDiv);
            });
            console.log(`Đã điền HTML cho ${flight.passengers.length} hành khách.`);
        } else {
            console.error("Dữ liệu hành khách (passengers) không phải là mảng hoặc không tồn tại trong currentBookingData.");
            passengersListDiv.innerHTML = "<p>Lỗi: Không có thông tin hành khách.</p>";
        }
    }

    if (passengersSelectionForm) {
        passengersSelectionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            selectedPassengers = [];
            const checkedBoxes = passengersListDiv.querySelectorAll('input[name="selected_passengers"]:checked');
            if (checkedBoxes.length === 0) {
                if(passengerSelectionError) passengerSelectionError.style.display = 'block';
                return;
            }
            if(passengerSelectionError) passengerSelectionError.style.display = 'none';
            checkedBoxes.forEach(cb => selectedPassengers.push({ id: parseInt(cb.value), name: cb.dataset.name }));
            console.log("Hành khách đã chọn để check-in:", selectedPassengers);
            
            // Chuyển sang Bước 3
            showStep('dangerousGoods');
        });
    }

    // --- CẬP NHẬT: Xử lý submit của form hàng hóa nguy hiểm (Bước 3) ---
    if (dangerousGoodsForm) {
        dangerousGoodsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!confirmDGBCheckbox.checked) {
                if(dangerousGoodsError) dangerousGoodsError.style.display = 'block';
                return;
            }
            if(dangerousGoodsError) dangerousGoodsError.style.display = 'none';
            
            // Gọi hàm điền dữ liệu cho Bước 4
            populateSeatSelectionDisplay(); 
            
            // Chuyển sang Bước 4
            showStep('seatSelection'); 
        });
    }
    
    // Step 4: Populate Seat Selection Display
     function populateSeatSelectionDisplay() {
        if (!passengerSeatDisplayList || !currentBookingData || selectedPassengers.length === 0) {
            console.error("Không thể hiển thị thông tin chọn ghế.");
            return;
        }
        passengerSeatDisplayList.innerHTML = '';
        selectedPassengers.forEach(sp => {
            // Tìm thông tin chi tiết của hành khách trong currentBookingData
            const paxData = currentBookingData.passengers.find(p => p.id === sp.id);
            const li = document.createElement('li');
            // Hiển thị ghế đã có (nếu có) hoặc thông báo sẽ được gán ngẫu nhiên
            li.innerHTML = `<strong>${sp.name}:</strong> ${paxData && paxData.seat_assigned ? paxData.seat_assigned : "Sẽ được chỉ định tự động khi hoàn tất."}`;
            passengerSeatDisplayList.appendChild(li);
        });
    }

     // --- Bước 5: Xử lý Hoàn tất Check-in (CẬP NHẬT) ---
    if (btnConfirmSeatsCheckin) {
        btnConfirmSeatsCheckin.addEventListener('click', async function() {
            // Kiểm tra xem các biến cần thiết có tồn tại không
             if (!currentBookingData || !currentBookingData.booking_id) {
                alert("Lỗi: Không có thông tin đặt chỗ hợp lệ để check-in. Vui lòng thử lại từ đầu.");
                return;
            }

            console.log("Hoàn tất thủ tục cho:", selectedPassengers);
            
            const passengerIds = selectedPassengers.map(p => p.id);
            
            // LẤY booking_id TỪ BIẾN currentBookingData ĐÃ LƯU Ở BƯỚC 1
            const checkinData = {
                booking_id: currentBookingData.booking_id,
                passenger_ids: passengerIds
            };
            
            // DEBUG: In ra dữ liệu sẽ gửi đi
            console.log("Đang gửi dữ liệu check-in cuối cùng:", checkinData);

            // Kiểm tra lại lần nữa trước khi gửi
            if (!checkinData.booking_id || !checkinData.passenger_ids || checkinData.passenger_ids.length === 0) {
                alert("Lỗi nghiêm trọng: Không thể xác định mã đặt chỗ hoặc danh sách hành khách. Vui lòng thử lại từ đầu.");
                return;
            }

            try {
                const response = await fetch('/api/checkin/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(checkinData)
                });
                const result = await response.json();

                if (response.ok && result.success && result.booking) {
                    currentBookingData = result.booking;
                    populateConfirmationStep();
                    showStep('confirmation');
                } else {
                    alert("Lỗi khi hoàn tất thủ tục: " + (result.message || "Lỗi không xác định."));
                }
            } catch(error) {
                console.error("Lỗi khi hoàn tất thủ tục:", error);
                alert("Đã có lỗi kết nối xảy ra. Vui lòng thử lại.");
            }
        });
    }
    

     // --- HÀM ĐIỀN DỮ LIỆU BƯỚC 5 (Hoàn tất) ---
    function populateConfirmationStep() {
        if (!boardingPassSummaryList || !currentBookingData) return;
        boardingPassSummaryList.innerHTML = '';
        const flightInfo = currentBookingData; 

        // Chỉ hiển thị thẻ cho các hành khách đã được chọn ở Bước 2
        selectedPassengers.forEach(sp => {
            // Tìm dữ liệu mới nhất của hành khách (bao gồm cả số ghế đã được gán)
            const paxData = currentBookingData.passengers.find(p => p.id === sp.id);
            if (!paxData) return;

            const bpDiv = document.createElement('div');
            bpDiv.className = 'boarding-pass-summary-item';
            bpDiv.innerHTML = `
                <h4>${paxData.full_name.toUpperCase()}</h4>
                <p><strong>Chuyến bay:</strong> ${flightInfo.flight_number}, ${flightInfo.departure_city} đến ${flightInfo.arrival_city}</p>
                <p><strong>Ngày bay:</strong> ${flightInfo.departure_datetime_formatted.split(', ')[2]}</p>
                <p><strong>Giờ khởi hành:</strong> ${flightInfo.departure_datetime_formatted.split(', ')[0]}</p>
                <p><strong>Ghế:</strong> ${paxData.seat_assigned || "N/A"}</p>
                <p><strong>Cửa lên máy bay:</strong> (Sẽ hiển thị trên bảng thông tin tại sân bay)</p>
                <p><strong>Giờ lên máy bay:</strong> (Trước giờ khởi hành 45 phút)</p>
            `;
            boardingPassSummaryList.appendChild(bpDiv);
        });
    }

    // --- Navigation button listeners ---
    if(btnBackToLookup) btnBackToLookup.addEventListener('click', () => showStep('lookup'));
    if(btnBackToPassengers) btnBackToPassengers.addEventListener('click', () => showStep('flightsPassengers'));
    if(btnBackToDangerousGoods) btnBackToDangerousGoods.addEventListener('click', () => showStep('dangerousGoods'));

    // Khởi tạo
    showStep('lookup'); 
});