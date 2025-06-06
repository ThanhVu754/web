// app/static/js/home_script.js
document.addEventListener('DOMContentLoaded', function() {
    console.log("home_script.js loaded and DOMContentLoaded - Full API Integration!");

    // === DOM Elements ===
    const noticeMainTitleElement = document.getElementById('notice-main-title');
    const noticePlaneImageElement = document.getElementById('notice-plane-image');
    const dynamicNoticeContainer = document.getElementById('dynamic-notice-items-container');
    const LOCAL_STORAGE_KEY_NOTICES = 'sangAirHomepageNotices';

    const tabs = document.querySelectorAll(".booking-section .tabs .tab");
    const tabContents = document.querySelectorAll(".booking-section .tab-content");

    const tripRadios = document.querySelectorAll('input[name="trip"]');
    const returnDateGroup = document.getElementById("return-date-group");
    const bookingForm = document.getElementById("booking-form");
    const flightResultsSection = document.getElementById("flight-results");
    const flightOptionsContainer = document.getElementById("flight-options-container");

    const bookingModal = document.getElementById("booking-modal");
    
    const adultInput = document.getElementById("adult-count");
    const childInput = document.getElementById("child-count");
    const totalPassengersInput = document.getElementById("total-passengers");
    const departureSelect = document.getElementById("departure");
    const destinationSelect = document.getElementById("destination");
    const departureDateInput = document.getElementById("departure-date");
    const returnDateInput = document.getElementById("return-date"); // Cho ngày về
    const seatClassSelect = document.getElementById("seat-class");

    // Elements từ modal đặt vé
    const passengerNameInput = document.getElementById("passenger-name");
    const passengerEmailInput = document.getElementById("passenger-email");
    const passengerPhoneInput = document.getElementById("passenger-phone");
    const paymentMethodSelect = document.getElementById("payment-method");
    const hiddenSeatClassInput = document.getElementById("hidden-seat-class");
    const hiddenTotalPassengersInput = document.getElementById("hidden-total-passengers");

    // Elements cho tab hành lý (nếu bạn giữ lại logic này)
    const baggageOption = document.getElementById("baggage-option");
    const seatPreference = document.getElementById("seat-preference");
    const seatExtraLegroom = document.getElementById("seat-extra-legroom");
    const baggageFeeDisplay = document.getElementById("baggage-fee-display");
    const seatFeeDisplay = document.getElementById("seat-fee-display");
    const totalAncillaryCostDisplay = document.getElementById("total-ancillary-cost-display");
    const confirmAncillaryBtn = document.getElementById("confirm-ancillary-btn");

    // --- HÀM TIỆN ÍCH LẤY NGÀY HIỆN TẠI ---
    // (Nếu bạn chưa có hàm này, hãy thêm nó vào. Nếu đã có từ script_flights.js, bạn có thể dùng chung
    //  hoặc định nghĩa lại ở đây nếu muốn home_script.js độc lập)
    function getTodayDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Tháng (0-11) + 1
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // --- THIẾT LẬP BAN ĐẦU VÀ EVENT LISTENER CHO CÁC TRƯỜNG NGÀY ---
    if (departureDateInput) {
        const todayString = getTodayDateString();
        departureDateInput.min = todayString; // Ngày đi không được trước ngày hôm nay

        departureDateInput.addEventListener('change', function() {
            const selectedDepartureDate = this.value;
            if (returnDateInput) { // Nếu có trường ngày về
                if (selectedDepartureDate) {
                    // Ngày về không được trước ngày đi đã chọn
                    returnDateInput.min = selectedDepartureDate;
                    // Nếu ngày về hiện tại sớm hơn ngày đi mới, xóa giá trị ngày về
                    if (returnDateInput.value && returnDateInput.value < selectedDepartureDate) {
                        returnDateInput.value = selectedDepartureDate; // Hoặc gán rỗng: returnDateInput.value = '';
                    }
                } else {
                    // Nếu ngày đi bị xóa, reset min của ngày về về ngày hôm nay
                    returnDateInput.min = todayString;
                }
            }
        });
    }

    // Xử lý min cho ngày về ban đầu (nếu ngày đi đã có giá trị khi tải trang, ít khả năng xảy ra)
    if (returnDateInput) {
        if (departureDateInput && departureDateInput.value) {
            returnDateInput.min = departureDateInput.value;
        } else {
            returnDateInput.min = getTodayDateString();
        }
    }

    // --- LOGIC HIỂN THỊ THÔNG BÁO TỪ LOCALSTORAGE (Giữ nguyên) ---
    function loadHomepageNotices() {
        if (!dynamicNoticeContainer) {
            console.warn("Không tìm thấy 'dynamic-notice-items-container' trên trang chủ.");
            return;
        }
        const storedNoticesData = localStorage.getItem(LOCAL_STORAGE_KEY_NOTICES);
        if (storedNoticesData) {
            try {
                const noticesData = JSON.parse(storedNoticesData);
                if (noticeMainTitleElement && noticesData.title) noticeMainTitleElement.textContent = noticesData.title;
                if (noticePlaneImageElement && noticesData.planeImageURL) {
                    noticePlaneImageElement.src = noticesData.planeImageURL;
                    noticePlaneImageElement.onerror = function() { this.src = 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png'; } // Ảnh mặc định
                }
                dynamicNoticeContainer.innerHTML = noticesData.items && noticesData.items.length > 0 ? 
                                                 noticesData.items.map(item => `<p>${item.content}</p>`).join('') : 
                                                 "<p>Hiện chưa có thông báo nào.</p>";
            } catch (e) {
                dynamicNoticeContainer.innerHTML = "<p>Có lỗi khi tải thông báo.</p>";
            }
        } else {
             dynamicNoticeContainer.innerHTML = "<p>Chào mừng bạn đến với SangAir! Kiểm tra các ưu đãi mới nhất.</p>";
        }
    }
    loadHomepageNotices();

    // --- LOGIC CHUYỂN TAB (Giữ nguyên) ---
    if (tabs.length > 0 && tabContents.length > 0) {
        tabs.forEach(tab => {
          tab.addEventListener("click", function () {
            tabs.forEach(item => item.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));
            this.classList.add("active");
            const tabContentElement = document.getElementById(this.dataset.tab);
            if (tabContentElement) tabContentElement.classList.add("active");
          });
        });
    }

    // --- LOGIC ẨN/HIỆN NGÀY VỀ VÀ TÍNH TỔNG HÀNH KHÁCH (Giữ nguyên) ---
    // --- LOGIC ẨN/HIỆN NGÀY VỀ (Giữ nguyên hoặc cập nhật nếu cần) ---
    function updateReturnDateVisibility() {
      const selectedTripType = document.querySelector('input[name="trip"]:checked');
      if (returnDateGroup && selectedTripType && selectedTripType.value === "oneway") {
        returnDateGroup.style.display = "none";
        if(returnDateInput) {
            returnDateInput.value = ""; 
            returnDateInput.removeAttribute('required');
            returnDateInput.min = getTodayDateString(); // Reset min khi ẩn đi
        }
      } else if (returnDateGroup) {
        returnDateGroup.style.display = "block";
        if(returnDateInput) {
            returnDateInput.setAttribute('required', 'required');
            // Đặt min cho ngày về dựa trên ngày đi (nếu có) hoặc ngày hiện tại
            if (departureDateInput && departureDateInput.value) {
                returnDateInput.min = departureDateInput.value;
            } else {
                returnDateInput.min = getTodayDateString();
            }
        }
      }
    }
    // Gọi lại hàm này khi trip type thay đổi
    if (tripRadios.length > 0) {
        tripRadios.forEach(radio => radio.addEventListener("change", updateReturnDateVisibility));
        // Gọi một lần khi tải trang để đảm bảo trạng thái ban đầu đúng
        updateReturnDateVisibility(); 
    }

    function updateTotalPassengers() {
      const adults = parseInt(adultInput.value) || 0;
      const children = parseInt(childInput.value) || 0;
      if (totalPassengersInput) {
        totalPassengersInput.value = adults + children;
      }
    }
    if (adultInput && childInput && totalPassengersInput) {
        adultInput.addEventListener("input", updateTotalPassengers);
        childInput.addEventListener("input", updateTotalPassengers);
        updateTotalPassengers(); 
    }

    // --- XỬ LÝ FORM TÌM KIẾM CHUYẾN BAY (#booking-form) ---
    if (bookingForm) {
        bookingForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            
            const originIata = departureSelect.value;
            const destinationIata = destinationSelect.value;
            const departureDate = departureDateInput.value;
            const passengers = parseInt(totalPassengersInput.value) || 1;
            const seatClass = seatClassSelect.value;
            const tripTypeChecked = document.querySelector('input[name="trip"]:checked');
            const tripType = tripTypeChecked ? tripTypeChecked.value : 'oneway';
            const returnDateValue = (tripType === 'round' && returnDateInput) ? returnDateInput.value : null;

            if (!originIata || !destinationIata || !departureDate || passengers <= 0) { // Sửa passengers === 0 thành <=0
                alert("Vui lòng điền đầy đủ thông tin bắt buộc: Điểm đi, Điểm đến, Ngày đi và Số hành khách phải lớn hơn 0.");
                return;
            }
            if (originIata === destinationIata) {
                alert("Điểm đi và điểm đến không được trùng nhau.");
                return;
            }
            if (tripType === 'round' && !returnDateValue) {
                alert("Vui lòng chọn ngày về cho chuyến bay khứ hồi.");
                return;
            }
            if (tripType === 'round' && returnDateValue < departureDate) {
                alert("Ngày về phải sau hoặc bằng ngày đi.");
                return;
            }

            if (flightOptionsContainer) flightOptionsContainer.innerHTML = '<p style="text-align:center; color: #fff;">Đang tìm kiếm chuyến bay, vui lòng chờ...</p>';
            if (flightResultsSection) flightResultsSection.style.display = "block";

            try {
                // TÌM CHUYẾN ĐI
                const departureSearchData = {
                    origin_iata: originIata,
                    destination_iata: destinationIata,
                    departure_date: departureDate,
                    passengers: passengers,
                    seat_class: seatClass
                };
                console.log("Đang tìm chuyến đi:", departureSearchData);
                const departureResponse = await fetch('/api/flights/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(departureSearchData),
                });
                const departureResult = await departureResponse.json();
                console.log("Kết quả chuyến đi:", departureResult);

                let departureFlights = [];
                if (departureResponse.ok && departureResult.success) {
                    departureFlights = departureResult.flights;
                } else {
                    console.error("Lỗi tìm chuyến đi:", departureResult.message);
                    // Không nên return ở đây nếu là khứ hồi, vì có thể chuyến về vẫn có
                }

                // TÌM CHUYẾN VỀ (NẾU LÀ KHỨ HỒI)
                let returnFlights = [];
                if (tripType === 'round' && returnDateValue) {
                    const returnSearchData = {
                        origin_iata: destinationIata, // Đảo ngược cho chuyến về
                        destination_iata: originIata,   // Đảo ngược cho chuyến về
                        departure_date: returnDateValue,
                        passengers: passengers,
                        seat_class: seatClass
                    };
                    console.log("Đang tìm chuyến về:", returnSearchData);
                    const returnResponse = await fetch('/api/flights/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(returnSearchData),
                    });
                    const returnResult = await returnResponse.json();
                    console.log("Kết quả chuyến về:", returnResult);

                    if (returnResponse.ok && returnResult.success) {
                        returnFlights = returnResult.flights;
                    } else {
                        console.error("Lỗi tìm chuyến về:", returnResult.message);
                    }
                }
                renderRoundTripFlightResults(departureFlights, returnFlights, seatClass, passengers, tripType);

            } catch (error) {
                console.error('Lỗi nghiêm trọng khi tìm kiếm chuyến bay (catch):', error);
                if (flightOptionsContainer) flightOptionsContainer.innerHTML = '<p style="text-align:center; color: #ffdddd;">Có lỗi kết nối máy chủ. Vui lòng thử lại.</p>';
            }
        });
    }


    function renderRoundTripFlightResults(departureFlights, returnFlights, selectedSeatClass, numPassengers, tripType) {
        if (!flightOptionsContainer) return;
        flightOptionsContainer.innerHTML = ""; 

        const originalSearchDate = departureDateInput.value; // Ngày người dùng chọn ban đầu

        // Hàm helper để render một nhóm chuyến bay cho một ngày cụ thể
        function renderFlightsForDate(flights, date, legTitle, isOriginalDate) {
            const dateSection = document.createElement('div');
            dateSection.className = 'flight-results-date-section';
            
            const dateHeader = document.createElement(isOriginalDate ? 'h3' : 'h4');
            dateHeader.className = isOriginalDate ? 'flight-results-date-header' : 'flight-results-date-subheader';
            // Định dạng lại ngày để hiển thị (ví dụ: Thứ Ba, 05/07/2025)
            const dateObj = new Date(date + 'T00:00:00'); // Thêm T00:00:00 để tránh lỗi timezone khi parse
            const formattedDisplayDate = dateObj.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            dateHeader.textContent = `${legTitle} - ${formattedDisplayDate}`;
            dateSection.appendChild(dateHeader);

            if (!flights || flights.length === 0) {
                dateSection.innerHTML += "<p style='text-align:center; color: #fff;'>Không có chuyến bay nào cho ngày này.</p>";
            } else {
                flights.forEach(flight => {
                    // Giả sử legType được truyền đúng từ createFlightOptionElement
                    dateSection.appendChild(createFlightOptionElement(flight, selectedSeatClass, numPassengers, legTypeFromSearch)); 
                });
            }
            flightOptionsContainer.appendChild(dateSection);
        }
        
        let legTypeFromSearch = 'departure'; // Mặc định cho tìm kiếm một chiều

        // Gom nhóm chuyến đi theo ngày
        const departureFlightsByDate = {};
        if (departureFlights && departureFlights.length > 0) {
            departureFlights.forEach(flight => {
                const flightDate = flight.departure_date_form; // Sử dụng trường YYYY-MM-DD từ backend
                if (!departureFlightsByDate[flightDate]) {
                    departureFlightsByDate[flightDate] = [];
                }
                departureFlightsByDate[flightDate].push(flight);
            });
        }

        // Hiển thị chuyến đi
        const legTitleDeparture = tripType === 'round' ? "Lượt đi" : "Chuyến bay";
        if (Object.keys(departureFlightsByDate).length > 0) {
            // Hiển thị ngày gốc trước tiên nếu có
            if (departureFlightsByDate[originalSearchDate]) {
                renderFlightsForDate(departureFlightsByDate[originalSearchDate], originalSearchDate, legTitleDeparture, true);
                delete departureFlightsByDate[originalSearchDate]; // Xóa để không hiển thị lại
            }
            // Hiển thị các ngày tiếp theo
            Object.keys(departureFlightsByDate).sort().forEach(date => { // Sắp xếp ngày
                renderFlightsForDate(departureFlightsByDate[date], date, legTitleDeparture, false);
            });
        } else {
            flightOptionsContainer.innerHTML += `<div class="flight-results-leg"><h2>${legTitleDeparture}:</h2><p style='text-align:center; color: #fff;'>Không tìm thấy chuyến ${legTitleDeparture.toLowerCase()} phù hợp.</p></div>`;
        }


        // Hiển thị chuyến về nếu là khứ hồi
        if (tripType === 'round') {
            legTypeFromSearch = 'return'; // Cập nhật cho nút đặt vé chặng về
            const originalReturnDate = returnDateInput.value; // Ngày về người dùng chọn
            const returnFlightsByDate = {};
            if (returnFlights && returnFlights.length > 0) {
                returnFlights.forEach(flight => {
                    const flightDate = flight.departure_date_form;
                    if (!returnFlightsByDate[flightDate]) {
                        returnFlightsByDate[flightDate] = [];
                    }
                    returnFlightsByDate[flightDate].push(flight);
                });
            }
            
            const legTitleReturn = "Lượt về";
            if (Object.keys(returnFlightsByDate).length > 0) {
                if (returnFlightsByDate[originalReturnDate]) {
                    renderFlightsForDate(returnFlightsByDate[originalReturnDate], originalReturnDate, legTitleReturn, true);
                    delete returnFlightsByDate[originalReturnDate];
                }
                Object.keys(returnFlightsByDate).sort().forEach(date => {
                    renderFlightsForDate(returnFlightsByDate[date], date, legTitleReturn, false);
                });
            } else {
                flightOptionsContainer.innerHTML += `<div class="flight-results-leg"><h2>${legTitleReturn}:</h2><p style='text-align:center; color: #fff;'>Không tìm thấy chuyến ${legTitleReturn.toLowerCase()} phù hợp.</p></div>`;
            }
        }
        
        // Nếu không có kết quả nào cả
        if (flightOptionsContainer.children.length === 0 || 
            (tripType === 'oneway' && (!departureFlights || departureFlights.length === 0)) ||
            (tripType === 'round' && (!departureFlights || departureFlights.length === 0) && (!returnFlights || returnFlights.length === 0) )
        ) {
            flightOptionsContainer.innerHTML = "<p style='text-align:center; color: #fff;'>Không tìm thấy chuyến bay nào phù hợp cho lựa chọn của bạn hoặc các ngày lân cận.</p>";
        } else {
            attachBookButtonListeners(); 
        }
    }

    // --- HÀM TẠO ELEMENT CHO MỘT LỰA CHỌN CHUYẾN BAY ---
    function createFlightOptionElement(flight, selectedSeatClass, numPassengers, legType) {
        const priceDisplay = (flight.price !== null && flight.price !== undefined) 
                             ? flight.price.toLocaleString('vi-VN') + ' VND' 
                             : 'Liên hệ';
        
        const flightOptionDiv = document.createElement('div');
        flightOptionDiv.className = 'flight-option';
        flightOptionDiv.innerHTML = `
            <div class="flight-details">
                <h3>Chuyến bay: ${flight.flight_number} (SangAir)</h3>
                <p><strong>Hành trình:</strong> ${flight.origin_city || flight.origin_iata} (${flight.origin_iata}) → ${flight.destination_city || flight.destination_iata} (${flight.destination_iata})</p>
                <p><strong>Thời gian:</strong> ${flight.departure_time_formatted} → ${flight.arrival_time_formatted}</p>
                <p><strong>Thời gian bay:</strong> ${flight.duration_formatted || 'N/A'}</p>
                <p><strong>Hạng vé:</strong> ${selectedSeatClass}</p>
                <p><strong>Giá vé từ:</strong> <span class="flight-price">${priceDisplay}</span> / khách</p>
                <p><strong>Còn lại:</strong> <span class="status-confirmed">${flight.available_seats} chỗ</span></p>
            </div>
            <button class="book-btn" 
                    data-flight-id="${flight.id}" 
                    data-seat-class="${selectedSeatClass}" 
                    data-total-passengers="${numPassengers}"
                    data-leg-type="${legType}">Đặt vé ${legType === 'departure' ? 'chặng đi' : 'chặng về'}</button>
        `;
        return flightOptionDiv;
    }

    // --- RENDER KẾT QUẢ TÌM KIẾM CHUYẾN BAY ---
    function renderFlightResults(flights, selectedSeatClass, numPassengers) {
        if (!flightOptionsContainer) return;
        flightOptionsContainer.innerHTML = ""; 

        if (!flights || flights.length === 0) {
            flightOptionsContainer.innerHTML = "<p style='text-align:center; color: #fff;'>Không tìm thấy chuyến bay nào phù hợp với lựa chọn của bạn.</p>";
            return;
        }

        flights.forEach(flight => {
            const priceDisplay = (flight.price !== null && flight.price !== undefined) 
                                 ? flight.price.toLocaleString('vi-VN') + ' VND' 
                                 : 'Liên hệ';
            
            const flightOptionDiv = document.createElement('div');
            flightOptionDiv.className = 'flight-option';
            flightOptionDiv.innerHTML = `
                <div class="flight-details">
                    <h3>Chuyến bay: ${flight.flight_number} (SangAir)</h3>
                    <p><strong>Hành trình:</strong> ${flight.origin_city || flight.origin_iata} (${flight.origin_iata}) → ${flight.destination_city || flight.destination_iata} (${flight.destination_iata})</p>
                    <p><strong>Thời gian:</strong> ${flight.departure_time_formatted} → ${flight.arrival_time_formatted}</p>
                    <p><strong>Thời gian bay:</strong> ${flight.duration_formatted || 'N/A'}</p>
                    <p><strong>Hạng vé:</strong> ${selectedSeatClass}</p>
                    <p><strong>Giá vé từ:</strong> <span class="flight-price">${priceDisplay}</span> / khách</p>
                    <p><strong>Còn lại:</strong> <span class="status-confirmed">${flight.available_seats} chỗ</span></p>
                </div>
                <button class="book-btn" 
                        data-flight-id="${flight.id}" 
                        data-seat-class="${selectedSeatClass}" 
                        data-total-passengers="${numPassengers}">Đặt vé</button>
            `;
            flightOptionsContainer.appendChild(flightOptionDiv);
        });
        attachBookButtonListeners();
    }

    // --- GẮN LISTENER CHO CÁC NÚT "ĐẶT VÉ" MỚI VÀ XỬ LÝ MODAL ---
    async function attachBookButtonListeners() {
        const newBookButtons = flightOptionsContainer.querySelectorAll(".book-btn");
        if (newBookButtons.length > 0 && bookingModal) {
            newBookButtons.forEach(button => {
                button.removeEventListener('click', handleBookButtonClick); 
                button.addEventListener("click", handleBookButtonClick);
            });
        }
    }
    
    async function handleBookButtonClick() {
        const flightId = this.dataset.flightId;
        const seatClassFromSearch = this.dataset.seatClass;
        const totalPassengersFromSearch = this.dataset.totalPassengers;
        
        console.log("Nút Đặt vé được nhấn. Flight ID:", flightId, "Hạng ghế:", seatClassFromSearch, "Số khách:", totalPassengersFromSearch);

        try {
            const authStatusResponse = await fetch('/api/auth/status');
            const authStatusResult = await authStatusResponse.json();
            console.log("Trạng thái đăng nhập:", authStatusResult);

            if (authStatusResult.logged_in && authStatusResult.user) {
                // Người dùng đã đăng nhập
                const num_adults = parseInt(adultInput.value) || (parseInt(totalPassengersFromSearch) > 0 ? 1 : 0);
                const num_children = parseInt(childInput.value) || 0;
                const num_infants = 0; // Giả sử

                // Chuẩn bị dữ liệu để lưu vào localStorage cho trang thanh toán
                const bookingAttemptDataForPaymentPage = {
                    flight_id: parseInt(flightId),
                    seat_class_booked: seatClassFromSearch,
                    num_adults: num_adults,
                    num_children: num_children,
                    num_infants: num_infants,
                    // Thông tin người liên hệ ban đầu có thể lấy từ người dùng đã đăng nhập
                    // Trang thanh toán sẽ có form để người dùng xác nhận hoặc sửa đổi thông tin này
                    contact_full_name: authStatusResult.user.full_name,
                    contact_email: authStatusResult.user.email,
                    contact_phone: authStatusResult.user.phone_number || "", // Lấy SĐT nếu có
                    // payment_method sẽ được chọn trên trang thanh toán
                };

                localStorage.setItem('currentBookingAttempt', JSON.stringify(bookingAttemptDataForPaymentPage));
                console.log("Đã lưu thông tin đặt vé vào localStorage, chuyển đến trang thanh toán:", bookingAttemptDataForPaymentPage);
                
                // Bỏ qua việc mở modal, chuyển thẳng đến trang thanh toán
                window.location.href = '/thanh-toan';

            } else {
                // Người dùng CHƯA đăng nhập
                alert("Vui lòng đăng nhập hoặc đăng ký để tiếp tục đặt vé.");
                localStorage.setItem('pendingBookingFlightId', flightId);
                localStorage.setItem('pendingBookingSeatClass', seatClassFromSearch);
                localStorage.setItem('pendingBookingTotalPassengers', totalPassengersFromSearch);
                
                let currentPath = window.location.pathname;
                if (window.location.search) { 
                    currentPath += window.location.search;
                }
                window.location.href = '/dang-nhap?next=' + encodeURIComponent(currentPath); 
            }
        } catch (error) {
            console.error("Lỗi kiểm tra trạng thái đăng nhập hoặc chuẩn bị dữ liệu thanh toán:", error);
            alert("Có lỗi xảy ra, vui lòng thử lại.");
        }
    }
   

    // --- LOGIC KIỂM TRA ĐẶT VÉ CHỜ XỬ LÝ SAU KHI ĐĂNG NHẬP ---
    async function checkAndResumePendingBooking() {
        const urlParams = new URLSearchParams(window.location.search);
        const justLoggedIn = urlParams.get('loggedin') === 'true';
        // const pendingLegType = urlParams.get('leg'); // Bỏ legType nếu không xử lý khứ hồi phức tạp

        // Chỉ kiểm tra nếu vừa đăng nhập và đang ở trang chủ (hoặc trang có thể tiếp tục đặt vé)
        if (justLoggedIn && (window.location.pathname === '/' || window.location.pathname.endsWith('/home'))) {
            const pendingFlightId = localStorage.getItem('pendingBookingFlightId');
            const pendingSeatClass = localStorage.getItem('pendingBookingSeatClass');
            const pendingTotalPassengers = localStorage.getItem('pendingBookingTotalPassengers');

            if (pendingFlightId && pendingSeatClass && pendingTotalPassengers) {
                console.log("Phát hiện đặt vé đang chờ xử lý sau khi đăng nhập:", pendingFlightId);
                
                // Lấy thông tin người dùng vừa đăng nhập
                const authStatusResponse = await fetch('/api/auth/status');
                const authStatusResult = await authStatusResponse.json();

                if (authStatusResult.logged_in && authStatusResult.user) {
                    const num_adults = parseInt(adultInput.value) || (parseInt(pendingTotalPassengers) > 0 ? 1 : 0); // Lấy lại từ form hoặc localStorage
                    const num_children = parseInt(childInput.value) || 0; // Lấy lại từ form hoặc localStorage
                    const num_infants = 0;

                    const bookingAttemptDataForPaymentPage = {
                        flight_id: parseInt(pendingFlightId),
                        seat_class_booked: pendingSeatClass,
                        num_adults: num_adults,
                        num_children: num_children,
                        num_infants: num_infants,
                        contact_full_name: authStatusResult.user.full_name,
                        contact_email: authStatusResult.user.email,
                        contact_phone: authStatusResult.user.phone_number || "",
                    };
                    localStorage.setItem('currentBookingAttempt', JSON.stringify(bookingAttemptDataForPaymentPage));
                }
                
                // Xóa các key pending cũ
                localStorage.removeItem('pendingBookingFlightId');
                localStorage.removeItem('pendingBookingSeatClass');
                localStorage.removeItem('pendingBookingTotalPassengers');
                
                // Xóa tham số loggedin khỏi URL
                if (window.history.replaceState) {
                    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                    window.history.replaceState({path:cleanUrl}, '', cleanUrl);
                }
                
                alert("Bạn đã đăng nhập thành công. Đang chuyển đến trang thanh toán cho chuyến bay đã chọn.");
                window.location.href = '/thanh-toan'; 
            }
        }
    }
    checkAndResumePendingBooking();


    // --- CÁC PHẦN KHÁC CỦA FILE home_script.js GỐC CỦA BẠN ---
    // (Ví dụ: xử lý tab Hành lý, Điểm đến hấp dẫn, Carousel tin tức)
    // Bạn có thể copy và dán các phần đó vào đây nếu chúng không xung đột
    // với logic tìm kiếm và đặt vé ở trên.

    // Ví dụ, giữ lại phần xử lý tab Hành lý của bạn:
    if (baggageOption && seatPreference && seatExtraLegroom) {
        function formatCurrency(amount) {
             return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
        }
        function updateAncillaryFees() {
            let baggagePrice = parseFloat(baggageOption.selectedOptions[0].dataset.price) || 0;
            let seatPrefPrice = parseFloat(seatPreference.selectedOptions[0].dataset.price) || 0;
            let extraLegroomPrice = seatExtraLegroom.checked ? (parseFloat(seatExtraLegroom.dataset.price) || 0) : 0;
            
            const totalSeatFee = seatPrefPrice + extraLegroomPrice;
            const totalAncillary = baggagePrice + totalSeatFee;

            if (baggageFeeDisplay) baggageFeeDisplay.textContent = formatCurrency(baggagePrice);
            if (seatFeeDisplay) seatFeeDisplay.textContent = formatCurrency(totalSeatFee);
            if (totalAncillaryCostDisplay) totalAncillaryCostDisplay.textContent = formatCurrency(totalAncillary);
        }
        baggageOption.addEventListener("change", updateAncillaryFees);
        seatPreference.addEventListener("change", updateAncillaryFees);
        seatExtraLegroom.addEventListener("change", updateAncillaryFees);
        updateAncillaryFees(); 
    }
    
    if (confirmAncillaryBtn) {
        confirmAncillaryBtn.addEventListener("click", function() {
            // Logic demo hiện tại của bạn
            alert("Lựa chọn dịch vụ hành lý và chỗ ngồi (demo).");
        });
    }

    // Xử lý click vào "Điểm đến hấp dẫn"
    const destinations = document.querySelectorAll(".destination");
    if (destinations.length > 0 && departureSelect && destinationSelect && bookingForm) {
        destinations.forEach(dest => {
            dest.addEventListener("click", () => {
                const locationName = dest.getAttribute("data-destination"); // Ví dụ: "Phú Quốc"
                // Cần tìm IATA code tương ứng từ <option> của destinationSelect
                let iataCodeForLocation = "";
                for(let option of destinationSelect.options) {
                    if (option.textContent.includes(locationName)) {
                        iataCodeForLocation = option.value;
                        break;
                    }
                }
                
                // Cố định điểm đi là Hà Nội (HAN) - hoặc bạn có thể lấy từ một default nào đó
                if (departureSelect.querySelector('option[value="HAN"]')) {
                     departureSelect.value = "HAN";
                } else if (departureSelect.options.length > 1) { // Lấy option đầu tiên nếu HAN không có
                    departureSelect.value = departureSelect.options[1].value;
                }


                if (iataCodeForLocation) {
                    destinationSelect.value = iataCodeForLocation;
                } else {
                     // Nếu không tìm thấy IATA code, có thể chọn option đầu tiên hoặc báo lỗi
                     if(destinationSelect.options.length > 1) destinationSelect.value = destinationSelect.options[1].value;
                }
                
                bookingForm.scrollIntoView({ behavior: "smooth" });
                // Có thể tự động submit form tìm kiếm ở đây nếu muốn
                // bookingForm.dispatchEvent(new Event('submit')); 
            });
        });
    }

    // Carousel tin tức (logic này khá độc lập)
    const newsTrack = document.querySelector(".news-track");
    if (newsTrack) {
        const newsItems = newsTrack.querySelectorAll(".news-vertical-item");
        if (newsItems.length > 0) {
            const visibleCount = 3; 
            const itemHeight = newsItems[0].offsetHeight + 10; // +10 cho margin-bottom
            const totalNewsItems = newsItems.length;

            for (let i = 0; i < Math.min(visibleCount, totalNewsItems) ; i++) {
                const clone = newsItems[i].cloneNode(true);
                newsTrack.appendChild(clone);
            }

            let newsIndex = 0;
            let allowNewsTransition = true;

            function updateNewsScroll() {
                if (!newsTrack) return;
                newsTrack.style.transition = allowNewsTransition ? "transform 0.6s ease-in-out" : "none";
                newsTrack.style.transform = `translateY(-${newsIndex * itemHeight}px)`;
            }

            if (totalNewsItems > visibleCount) { // Chỉ chạy interval nếu có đủ item để cuộn
                setInterval(() => {
                    newsIndex++;
                    allowNewsTransition = true;
                    updateNewsScroll();

                    if (newsIndex === totalNewsItems) {
                        setTimeout(() => {
                            allowNewsTransition = false;
                            newsIndex = 0;
                            updateNewsScroll();
                        }, 650); // Thời gian chờ phải lớn hơn transition duration
                    }
                }, 5000);
            }
            updateNewsScroll(); // Gọi lần đầu
        }
    }

}); // Kết thúc DOMContentLoaded listener chính