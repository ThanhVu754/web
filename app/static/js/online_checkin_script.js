document.addEventListener('DOMContentLoaded', function() {
    console.log("Online Check-in Script (Professional) Loaded!");

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


    let currentBookingData = null; // To store the fetched booking details
    let selectedPassengers = [];   // To store selected passenger IDs for check-in

    // Mock Data (Replace with actual API calls)
    const mockBookings = {
        "PNR123NGUYEN": {
            pnr: "PNR123", lastName: "NGUYEN",
            flights: [{ flightNumber: "SA201", origin: "TP. Hồ Chí Minh (SGN)", destination: "Hà Nội (HAN)", departureTime: "08:00, 15/08/2025", arrivalTime: "10:05, 15/08/2025", status: "Sẵn sàng làm thủ tục" }],
            passengers: [
                { id: "pax001", name: "NGUYEN VAN A", type: "Người lớn", seat: null, eligible: true, checkedIn: false },
                { id: "pax002", name: "NGUYEN THI B", type: "Trẻ em", seat: null, eligible: true, checkedIn: false },
                { id: "pax003", name: "NGUYEN VAN C (INF)", type: "Em bé", seat: null, eligible: false, checkedIn: false } // Em bé thường check-in cùng người lớn
            ]
        },
        "XYZ789LE": {
            pnr: "XYZ789", lastName: "LE",
            flights: [{ flightNumber: "SA305", origin: "Đà Nẵng (DAD)", destination: "TP. Hồ Chí Minh (SGN)", departureTime: "14:30, 20/08/2025", arrivalTime: "15:45, 20/08/2025", status: "Chuyến bay đã khởi hành" }],
            passengers: [{ id: "pax101", name: "LE THI D", type: "Người lớn", seat: "10A", eligible: false, checkedIn: true }]
        }
    };

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
        for (const key in steps) {
            if (steps[key]) steps[key].classList.remove('active');
        }
        if (steps[stepId]) {
            steps[stepId].classList.add('active');
            // Update progress bar based on stepId
            if (stepId === 'lookup') updateProgress(1);
            else if (stepId === 'flightsPassengers') updateProgress(2);
            else if (stepId === 'dangerousGoods') updateProgress(3);
            else if (stepId === 'seatSelection') updateProgress(4);
            else if (stepId === 'confirmation') updateProgress(5);
            
            steps[stepId].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
         if (staticInfoDiv) { // Ẩn thông tin tĩnh khi bắt đầu các bước check-in
            staticInfoDiv.style.display = (stepId === 'lookup') ? 'block' : 'none';
        }
    }

    // Step 1: Handle Lookup Form Submission
    if (lookupForm) {
        lookupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const pnr = bookingCodeInput.value.trim().toUpperCase();
            const lastName = lastNameInput.value.trim().toUpperCase();
            if(lookupErrorMsg) lookupErrorMsg.style.display = 'none';

            if (!pnr || !lastName) {
                if(lookupErrorMsg) {
                    lookupErrorMsg.textContent = "Vui lòng nhập đầy đủ thông tin.";
                    lookupErrorMsg.style.display = 'block';
                }
                return;
            }

            const bookingKey = pnr + lastName;
            currentBookingData = mockBookings[bookingKey];

            if (currentBookingData) {
                const eligibleFlight = currentBookingData.flights.find(f => f.status.toLowerCase().includes("sẵn sàng"));
                if(!eligibleFlight){
                    if(lookupErrorMsg){
                        lookupErrorMsg.textContent = "Không có chuyến bay nào trong đặt chỗ này đủ điều kiện làm thủ tục.";
                        lookupErrorMsg.style.display = 'block';
                    }
                    return;
                }
                populateFlightsAndPassengersStep();
                showStep('flightsPassengers');
            } else {
                if(lookupErrorMsg) {
                    lookupErrorMsg.textContent = "Không tìm thấy đặt chỗ hoặc thông tin không chính xác.";
                    lookupErrorMsg.style.display = 'block';
                }
            }
        });
    }

    // Step 2: Populate Flights and Passengers
    function populateFlightsAndPassengersStep() {
        if (!currentBookingData || !flightsListDiv || !passengersListDiv) return;
        flightsListDiv.innerHTML = '';
        currentBookingData.flights.forEach(flight => {
            if(flight.status.toLowerCase().includes("sẵn sàng")){
                 const flightDiv = document.createElement('div');
                flightDiv.className = 'flight-checkin-item-vj';
                flightDiv.innerHTML = `
                    <h3>Chuyến bay ${flight.flightNumber}: ${flight.origin} <i class="fas fa-long-arrow-alt-right"></i> ${flight.destination}</h3>
                    <p><i class="fas fa-calendar-alt"></i> Khởi hành: ${flight.departureTime} &nbsp;&nbsp; <i class="fas fa-clock"></i> Đến: ${flight.arrivalTime}</p>
                    <p>Trạng thái: <span class="status-tag-vj ${flight.status.toLowerCase().includes('sẵn sàng') ? 'status-ok-vj' : 'status-not-ok-vj'}">${flight.status}</span></p>
                `;
                flightsListDiv.appendChild(flightDiv);
            }
        });

        passengersListDiv.innerHTML = '';
        currentBookingData.passengers.forEach(pax => {
            const paxDiv = document.createElement('div');
            paxDiv.className = 'passenger-checkin-item-vj';
            const isDisabled = !pax.eligible || pax.checkedIn;
            const statusText = pax.checkedIn ? ' (Đã làm thủ tục)' : (!pax.eligible ? ' (Không đủ điều kiện)' : '');
            paxDiv.innerHTML = `
                <label class="${isDisabled ? 'disabled' : ''}">
                    <input type="checkbox" name="selected_passengers" value="${pax.id}" data-name="${pax.name}" ${isDisabled ? 'disabled' : ''}>
                    <span class="pax-name">${pax.name}</span> <span class="pax-type">(${pax.type})</span> <span class="pax-status">${statusText}</span>
                </label>
            `;
            passengersListDiv.appendChild(paxDiv);
        });
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
            checkedBoxes.forEach(cb => selectedPassengers.push({ id: cb.value, name: cb.dataset.name }));
            console.log("Hành khách đã chọn để check-in:", selectedPassengers);
            showStep('dangerousGoods');
        });
    }

    // Step 3: Handle Dangerous Goods Form
    if (dangerousGoodsForm) {
        dangerousGoodsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!confirmDGBCheckbox.checked) {
                if(dangerousGoodsError) dangerousGoodsError.style.display = 'block';
                return;
            }
            if(dangerousGoodsError) dangerousGoodsError.style.display = 'none';
            populateSeatSelectionDisplay();
            showStep('seatSelection');
        });
    }
    
    // Step 4: Populate Seat Selection Display
    function populateSeatSelectionDisplay() {
        if (!passengerSeatDisplayList || !currentBookingData) return;
        passengerSeatDisplayList.innerHTML = '';
        selectedPassengers.forEach(sp => {
            const paxData = currentBookingData.passengers.find(p => p.id === sp.id);
            const li = document.createElement('li');
            li.innerHTML = `<strong>${sp.name}:</strong> ${paxData.seat || "Sẽ được chỉ định tự động/tại sân bay"}`;
            passengerSeatDisplayList.appendChild(li);
        });
    }

    if (btnConfirmSeatsCheckin) {
        btnConfirmSeatsCheckin.addEventListener('click', function() {
            // Simulate successful check-in
            selectedPassengers.forEach(sp => {
                const paxInBooking = currentBookingData.passengers.find(p => p.id === sp.id);
                if (paxInBooking) {
                    paxInBooking.checkedIn = true;
                    paxInBooking.seat = paxInBooking.seat || "18B"; // Gán ghế mẫu nếu chưa có
                }
            });
            console.log("Đã check-in cho:", selectedPassengers, "Dữ liệu booking cập nhật:", currentBookingData);
            populateConfirmationStep();
            showStep('confirmation');
        });
    }
    
    // Step 5: Populate Confirmation Step
    function populateConfirmationStep() {
        if (!boardingPassSummaryList || !currentBookingData) return;
        boardingPassSummaryList.innerHTML = '';
        const flightInfo = currentBookingData.flights[0]; // Giả sử chỉ có 1 chuyến bay trong lần check-in này

        selectedPassengers.forEach(sp => {
            const paxData = currentBookingData.passengers.find(p => p.id === sp.id);
            if (!paxData || !paxData.checkedIn) return;

            const bpDiv = document.createElement('div');
            bpDiv.className = 'boarding-pass-summary-item';
            bpDiv.innerHTML = `
                <h4>${paxData.name.toUpperCase()}</h4>
                <p><strong>Chuyến bay:</strong> ${flightInfo.flightNumber}, ${flightInfo.origin} đến ${flightInfo.destination}</p>
                <p><strong>Ngày bay:</strong> ${flightInfo.departureTime.split(', ')[1]}</p>
                <p><strong>Giờ khởi hành:</strong> ${flightInfo.departureTime.split(', ')[0]}</p>
                <p><strong>Ghế:</strong> ${paxData.seat || "N/A"}</p>
                <p><strong>Cửa lên máy bay:</strong> (Sẽ hiển thị trên bảng thông tin tại sân bay)</p>
                <p><strong>Giờ lên máy bay:</strong> (Trước giờ khởi hành 45 phút)</p>
            `;
            boardingPassSummaryList.appendChild(bpDiv);
        });
    }


    // Navigation button listeners
    if(btnBackToLookup) btnBackToLookup.addEventListener('click', () => showStep('lookup'));
    if(btnBackToPassengers) btnBackToPassengers.addEventListener('click', () => showStep('flightsPassengers'));
    if(btnBackToDangerousGoods) btnBackToDangerousGoods.addEventListener('click', () => showStep('dangerousGoods'));

    // Initialize
    showStep('lookup'); // Hiển thị bước đầu tiên khi tải trang
});