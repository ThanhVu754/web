document.addEventListener('DOMContentLoaded', function() {
    console.log("home_script.js loaded and DOMContentLoaded.");

    // === Hiển thị Thông báo từ localStorage ===
    const noticeMainTitleElement = document.getElementById('notice-main-title');
    const noticePlaneImageElement = document.getElementById('notice-plane-image');
    const dynamicNoticeContainer = document.getElementById('dynamic-notice-items-container');
    const LOCAL_STORAGE_KEY_NOTICES = 'sangAirHomepageNotices'; // Phải giống key ở admin script

    function loadHomepageNotices() {
        if (!dynamicNoticeContainer) { // Nếu không có container thì không làm gì
            console.warn("Không tìm thấy 'dynamic-notice-items-container' trên trang chủ.");
            return;
        }

        const storedNoticesData = localStorage.getItem(LOCAL_STORAGE_KEY_NOTICES);
        if (storedNoticesData) {
            try {
                const noticesData = JSON.parse(storedNoticesData);
                console.log("Đã tải dữ liệu thông báo từ localStorage (Client)", noticesData);

                if (noticeMainTitleElement && noticesData.title) {
                    noticeMainTitleElement.textContent = noticesData.title;
                }

                if (noticePlaneImageElement && noticesData.planeImageURL) {
                    noticePlaneImageElement.src = noticesData.planeImageURL;
                    noticePlaneImageElement.onerror = function() { // Xử lý nếu ảnh lỗi
                        this.src = 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png'; // Ảnh mặc định
                    }
                }
                
                let contentHtml = '';
                if (noticesData.items && noticesData.items.length > 0) {
                    noticesData.items.forEach(item => {
                        contentHtml += `<p>${item.content}</p>`; // Giả sử item.content đã là HTML an toàn
                    });
                } else {
                    contentHtml = "<p>Hiện chưa có thông báo nào.</p>";
                }
                dynamicNoticeContainer.innerHTML = contentHtml;

            } catch (e) {
                console.error("Lỗi khi parse dữ liệu thông báo từ localStorage:", e);
                // Có thể hiển thị nội dung mặc định nếu lỗi
                dynamicNoticeContainer.innerHTML = "<p>Có lỗi khi tải thông báo.</p>";
            }
        } else {
            console.log("Không có dữ liệu thông báo trong localStorage. Trang chủ sẽ hiển thị nội dung mặc định (nếu có).");
            // Nếu bạn muốn có nội dung mặc định khi không có gì trong localStorage,
            // bạn có thể điền vào dynamicNoticeContainer ở đây.
            // Ví dụ: dynamicNoticeContainer.innerHTML = "<p>Chào mừng đến với SangAir!</p>";
        }
    }
    loadHomepageNotices(); // Gọi hàm để tải thông báo khi trang tải xong
    // === Kết thúc hiển thị Thông báo ===


    // Tab switching logic
    const tabs = document.querySelectorAll(".booking-section .tabs .tab");
    const tabContents = document.querySelectorAll(".booking-section .tab-content");

    if (tabs.length > 0 && tabContents.length > 0) {
        tabs.forEach(tab => {
          tab.addEventListener("click", function () {
            tabs.forEach(item => item.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));
            this.classList.add("active");
            const tabContentElement = document.getElementById(this.dataset.tab);
            if (tabContentElement) {
                tabContentElement.classList.add("active");
            }
          });
        });
    }

    const tripRadios = document.querySelectorAll('input[name="trip"]');
    const returnDateGroup = document.getElementById("return-date-group");
    const bookingForm = document.getElementById("booking-form");
    const flightResults = document.getElementById("flight-results");
    const bookButtons = document.querySelectorAll(".book-btn");
    const bookingModal = document.getElementById("booking-modal");
    const closeModalButton = document.getElementById("close-modal");
    const bookingDetailsForm = document.getElementById("booking-details-form");
    const adultInput = document.getElementById("adult-count");
    const childInput = document.getElementById("child-count");
    const totalPassengersInput = document.getElementById("total-passengers");

    function updateReturnDateVisibility() {
      const selectedTripType = document.querySelector('input[name="trip"]:checked');
      if (returnDateGroup && selectedTripType && selectedTripType.value === "oneway") {
        returnDateGroup.style.display = "none";
      } else if (returnDateGroup) {
        returnDateGroup.style.display = "block";
      }
    }
    if (tripRadios.length > 0) {
        tripRadios.forEach(radio => radio.addEventListener("change", updateReturnDateVisibility));
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

    if (bookingForm) {
        bookingForm.addEventListener("submit", function (e) {
          e.preventDefault();
          const departureInput = document.getElementById("departure");
          const destinationInput = document.getElementById("destination");
          const departureDateInput = document.getElementById("departure-date");
          if (!departureInput || !destinationInput || !departureDateInput) return;
          const departure = departureInput.value.trim();
          const destination = destinationInput.value.trim();
          const departureDate = departureDateInput.value;
          if (departure === "" || destination === "" || departureDate === "") {
            alert("Vui lòng điền đầy đủ thông tin!");
            return;
          }
          if (flightResults) {
            flightResults.style.display = "block";
          }
        });
    }

    if (bookButtons.length > 0 && bookingModal) {
        bookButtons.forEach(button => {
          button.addEventListener("click", function () {
            const flightId = this.getAttribute("data-flight");
            bookingModal.dataset.flight = flightId;
            bookingModal.style.display = "flex"; 
          });
        });
    }
    
    window.addEventListener('click', function(event) {
        if (event.target == bookingModal) { 
            bookingModal.style.display = "none";
        }
    });

    if (bookingDetailsForm && bookingModal) {
    bookingDetailsForm.addEventListener("submit", async function (e) { // Thêm async
        e.preventDefault();
        
        const flightId = bookingModal.dataset.flightId; // Lấy flightId từ modal dataset
        const passengerNameInput = document.getElementById("passenger-name");
        const passengerEmailInput = document.getElementById("passenger-email");
        const passengerPhoneInput = document.getElementById("passenger-phone");
        const paymentMethodSelect = document.getElementById("payment-method");
        
        // Lấy seat_class và total_passengers từ các hidden input trong modal
        // Các hidden input này được điền giá trị khi modal được mở trong hàm attachBookButtonListeners
        const seatClassInput = document.getElementById("hidden-seat-class");
        const totalPassengersInput = document.getElementById("hidden-total-passengers");

        if (!passengerNameInput || !passengerEmailInput || !passengerPhoneInput || 
            !paymentMethodSelect || !seatClassInput || !totalPassengersInput) {
            alert("Lỗi cấu trúc form đặt vé. Vui lòng làm mới trang và thử lại.");
            return;
        }

        const passengerName = passengerNameInput.value.trim();
        const passengerEmail = passengerEmailInput.value.trim();
        const passengerPhone = passengerPhoneInput.value.trim();
        const paymentMethod = paymentMethodSelect.value;
        const seatClass = seatClassInput.value;
        const totalPassengers = parseInt(totalPassengersInput.value) || 1; // Lấy tổng số hành khách từ tìm kiếm

        // --- Validation cơ bản phía client ---
        if (!passengerName || !passengerEmail || !passengerPhone || !flightId) {
            alert("Vui lòng điền đầy đủ thông tin hành khách!");
            return;
        }
        if (!/\S+@\S+\.\S+/.test(passengerEmail)) { // Regex email đơn giản
            alert("Định dạng email không hợp lệ.");
            return;
        }
        // (Có thể thêm validation cho SĐT)
        // --- Hết validation ---

        // Lấy số lượng người lớn, trẻ em từ form tìm kiếm ban đầu để gửi lên API
        // vì API backend cần thông tin này để tính giá và kiểm tra logic.
        const adultCountInput = document.getElementById("adult-count");
        const childCountInput = document.getElementById("child-count");
        const num_adults = parseInt(adultCountInput.value) || (totalPassengers > 0 ? 1 : 0); // Mặc định 1 người lớn nếu có hành khách
        const num_children = parseInt(childCountInput.value) || 0;
        // Giả sử không có em bé (infants) trong form tìm kiếm, nếu có cần thêm input
        const num_infants = 0; 

        // Tạo mảng passengers_data.
        // Để đơn giản cho demo này, nếu có nhiều hành khách, chúng ta sẽ lặp lại thông tin
        // của hành khách đầu tiên. Trong thực tế, bạn cần form động để nhập cho từng người.
        const passengersData = [];
        for (let i = 0; i < totalPassengers; i++) {
            let passengerType = 'adult'; // Mặc định
            if (i >= num_adults && i < (num_adults + num_children)) {
                passengerType = 'child';
            } 
            // (Thêm logic cho 'infant' nếu có)

            passengersData.push({
                full_name: passengerName + (totalPassengers > 1 && i > 0 ? ` (Hành khách ${i + 1})` : ''),
                email: (i === 0) ? passengerEmail : null, // Chỉ cần email của người liên hệ chính
                phone_number: (i === 0) ? passengerPhone : null, // Chỉ cần SĐT của người liên hệ chính
                type: passengerType 
            });
        }
        
        const bookingApiData = {
            flight_id: parseInt(flightId),
            passengers_data: passengersData, // API backend mong đợi key 'passengers_data'
            seat_class_booked: seatClass,    // API backend mong đợi key 'seat_class_booked'
            num_adults: num_adults,
            num_children: num_children,
            num_infants: num_infants, 
            payment_method: paymentMethod
            // total_amount sẽ được tính ở backend
        };

        console.log("Đang gửi dữ liệu đặt vé đến API:", bookingApiData);

        try {
            const response = await fetch('/api/bookings', { // Gọi API POST để tạo booking
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingApiData),
            });
            const result = await response.json();
            console.log("Kết quả API đặt vé:", result);

            if (response.ok && result.success && result.booking) {
                alert(`Đặt vé thành công! Mã đặt chỗ của bạn là: ${result.booking.pnr}.\nTổng tiền: ${result.booking.total_amount.toLocaleString('vi-VN')} VND.\nTrạng thái: ${result.booking.status}`);
                bookingModal.style.display = "none";
                bookingDetailsForm.reset();
                if(flightResultsSection) flightResultsSection.style.display = "none"; // Ẩn kết quả tìm kiếm
                // Có thể chuyển hướng đến trang "Chuyến bay của tôi"
                // window.location.href = '/chuyen-bay-cua-toi'; 
            } else {
                alert("Đặt vé không thành công: " + (result.message || "Lỗi không xác định."));
            }
        } catch (error) {
            console.error('Lỗi khi đặt vé:', error);
            alert("Có lỗi kết nối trong quá trình đặt vé. Vui lòng thử lại.");
        }
    });
  }

    const baggageOption = document.getElementById("baggage-option");
    const seatPreference = document.getElementById("seat-preference");
    const seatExtraLegroom = document.getElementById("seat-extra-legroom");
    const baggageFeeDisplay = document.getElementById("baggage-fee-display");
    const seatFeeDisplay = document.getElementById("seat-fee-display");
    const totalAncillaryCostDisplay = document.getElementById("total-ancillary-cost-display");
    const confirmAncillaryBtn = document.getElementById("confirm-ancillary-btn");

    function formatCurrency(amount) {
        return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    }

    function updateAncillaryFees() {
        let baggagePrice = 0;
        if (baggageOption && baggageOption.selectedOptions.length > 0) {
            baggagePrice = parseFloat(baggageOption.selectedOptions[0].dataset.price) || 0;
        }
        let seatPrefPrice = 0;
        if (seatPreference && seatPreference.selectedOptions.length > 0) {
            seatPrefPrice = parseFloat(seatPreference.selectedOptions[0].dataset.price) || 0;
        }
        let extraLegroomPrice = 0;
        if (seatExtraLegroom && seatExtraLegroom.checked) {
            extraLegroomPrice = parseFloat(seatExtraLegroom.dataset.price) || 0;
        }
        const totalSeatFee = seatPrefPrice + extraLegroomPrice;
        const totalAncillary = baggagePrice + totalSeatFee;
        if (baggageFeeDisplay) baggageFeeDisplay.textContent = formatCurrency(baggagePrice);
        if (seatFeeDisplay) seatFeeDisplay.textContent = formatCurrency(totalSeatFee);
        if (totalAncillaryCostDisplay) totalAncillaryCostDisplay.textContent = formatCurrency(totalAncillary);
    }

    if (baggageOption && seatPreference && seatExtraLegroom) {
        baggageOption.addEventListener("change", updateAncillaryFees);
        seatPreference.addEventListener("change", updateAncillaryFees);
        seatExtraLegroom.addEventListener("change", updateAncillaryFees);
        updateAncillaryFees(); 
    }
    
    if (confirmAncillaryBtn) {
        confirmAncillaryBtn.addEventListener("click", function() {
            const baggageSelectedText = (baggageOption && baggageOption.selectedOptions.length > 0) ? baggageOption.selectedOptions[0].text : "Không chọn";
            const seatPrefSelectedText = (seatPreference && seatPreference.selectedOptions.length > 0) ? seatPreference.selectedOptions[0].text : "Không chọn";
            const extraLegroomSelected = seatExtraLegroom ? seatExtraLegroom.checked : false;
            const totalCostText = totalAncillaryCostDisplay ? totalAncillaryCostDisplay.textContent : "0 VND";
            let message = "Lựa chọn dịch vụ của bạn:\n";
            message += `- Hành lý: ${baggageSelectedText}\n`;
            message += `- Ưu tiên chỗ ngồi: ${seatPrefSelectedText}\n`;
            if (extraLegroomSelected) {
                message += "- Chỗ ngồi duỗi chân rộng: Có\n";
            }
            message += `\nTổng phí dịch vụ thêm: ${totalCostText}\n\n`;
            message += "(Đây là demo, các lựa chọn này chưa được lưu hoặc áp dụng vào đặt vé thực tế.)";
            alert(message);
        });
    }

    if (bookingForm) {
        bookingForm.addEventListener("submit", async function (e) { // Thêm async
            e.preventDefault(); // Ngăn form submit theo cách truyền thống
            
            // --- Thu thập dữ liệu từ form ---
            const departureSelect = document.getElementById("departure");
            const destinationSelect = document.getElementById("destination");
            const departureDateInput = document.getElementById("departure-date");
            const returnDateInput = document.getElementById("return-date"); // Cần xử lý nếu là khứ hồi
            const adultCountInput = document.getElementById("adult-count");
            const childCountInput = document.getElementById("child-count");
            const seatClassSelect = document.getElementById("seat-class");
            const tripTypeInput = document.querySelector('input[name="trip"]:checked');

            // Lấy mã IATA từ value của option được chọn
            // Đảm bảo value của <option> trong HTML là mã IATA (ví dụ: value="SGN")
            const originIata = departureSelect.value;
            const destinationIata = destinationSelect.value;
            const departureDate = departureDateInput.value;
            const passengers = (parseInt(adultCountInput.value) || 0) + (parseInt(childCountInput.value) || 0);
            const seatClass = seatClassSelect.value; // Ví dụ: "Phổ thông", "Thương gia"

            // --- Validation cơ bản phía client ---
            if (!originIata || !destinationIata || !departureDate || passengers === 0) {
                alert("Vui lòng điền đầy đủ thông tin bắt buộc: Điểm đi, Điểm đến, Ngày đi và Số hành khách.");
                return;
            }
            if (originIata === destinationIata) {
                alert("Điểm đi và điểm đến không được trùng nhau.");
                return;
            }

            // Tạo payload cho API
            const searchData = {
                origin_iata: originIata,
                destination_iata: destinationIata,
                departure_date: departureDate,
                passengers: passengers,
                seat_class: seatClass
                // Thêm return_date và trip_type nếu API của bạn hỗ trợ tìm kiếm khứ hồi
                // trip_type: tripTypeInput ? tripTypeInput.value : 'oneway',
                // return_date: (tripTypeInput && tripTypeInput.value === 'round' && returnDateInput) ? returnDateInput.value : null
            };

            console.log("Đang gửi dữ liệu tìm kiếm:", searchData);

            // Hiển thị "Đang tìm kiếm..."
            if (flightOptionsContainer) flightOptionsContainer.innerHTML = '<p style="text-align:center; color: #fff;">Đang tìm kiếm chuyến bay...</p>';
            if (flightResultsSection) flightResultsSection.style.display = "block";


            try {
                const response = await fetch('/api/flights/search', { // Gọi API POST
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(searchData),
                });

                const result = await response.json();
                console.log("Kết quả API tìm kiếm:", result);

                if (response.ok && result.success) {
                    renderFlightResults(result.flights, seatClass); // Truyền cả seatClass để hiển thị giá đúng
                } else {
                    if (flightOptionsContainer) flightOptionsContainer.innerHTML = `<p style="text-align:center; color: #ffdddd;">Lỗi: ${result.message || 'Không tìm thấy chuyến bay hoặc có lỗi xảy ra.'}</p>`;
                }
            } catch (error) {
                console.error('Lỗi khi tìm kiếm chuyến bay:', error);
                if (flightOptionsContainer) flightOptionsContainer.innerHTML = '<p style="text-align:center; color: #ffdddd;">Có lỗi kết nối. Vui lòng thử lại.</p>';
            }
        });
    }

    function renderFlightResults(flights, selectedSeatClass) {
        if (!flightOptionsContainer) return;
        flightOptionsContainer.innerHTML = ""; // Xóa kết quả cũ hoặc thông báo "đang tìm kiếm"

        if (!flights || flights.length === 0) {
            flightOptionsContainer.innerHTML = "<p style='text-align:center; color: #fff;'>Không tìm thấy chuyến bay nào phù hợp với lựa chọn của bạn.</p>";
            return;
        }

        flights.forEach(flight => {
            // flight.price đã được tính ở backend (trong flight_model.search_flights) dựa trên seat_class
            const priceDisplay = flight.price !== null && flight.price !== undefined 
                                 ? flight.price.toLocaleString('vi-VN') + ' VND' 
                                 : 'Liên hệ';
            
            const flightOptionDiv = document.createElement('div');
            flightOptionDiv.className = 'flight-option'; // Sử dụng class đã có trong home.html
            flightOptionDiv.innerHTML = `
                <div class="flight-details">
                    <h3>Chuyến bay: ${flight.flight_number} (SangAir)</h3>
                    <p><strong>Hành trình:</strong> ${flight.origin_city || flight.origin_iata} (${flight.origin_iata}) → ${flight.destination_city || flight.destination_iata} (${flight.destination_iata})</p>
                    <p><strong>Thời gian:</strong> ${flight.departure_time_formatted} → ${flight.arrival_time_formatted}</p>
                    <p><strong>Thời gian bay:</strong> ${flight.duration_formatted || 'N/A'}</p>
                    <p><strong>Hạng vé:</strong> ${selectedSeatClass}</p>
                    <p><strong>Giá vé từ:</strong> <span class="flight-price">${priceDisplay}</span></p>
                    <p><strong>Trạng thái:</strong> <span class="status-confirmed">Còn ${flight.available_seats} chỗ</span></p>
                </div>
                <button class="book-btn" data-flight-id="${flight.id}" data-flight-details='${JSON.stringify(flight)}'>Đặt vé</button>
            `;
            flightOptionsContainer.appendChild(flightOptionDiv);
        });

        // Gắn event listener cho các nút "Đặt vé" mới được tạo
        attachBookButtonListeners();
    }

    async function attachBookButtonListeners() {
        const newBookButtons = flightOptionsContainer.querySelectorAll(".book-btn");
        if (newBookButtons.length > 0 && bookingModal) {
            newBookButtons.forEach(button => {
                button.addEventListener("click", async function () { // Thêm async
                    const flightId = this.dataset.flightId;
                    const flightDetails = JSON.parse(this.dataset.flightDetails);
                    
                    console.log("Chọn đặt vé cho chuyến:", flightId, flightDetails);

                    // 1. Kiểm tra trạng thái đăng nhập
                    try {
                        const authStatusResponse = await fetch('/api/auth/status');
                        const authStatusResult = await authStatusResponse.json();

                        if (authStatusResult.logged_in) {
                            // Nếu đã đăng nhập, hiển thị modal đặt vé
                            bookingModal.dataset.flightId = flightId; // Lưu flightId vào modal
                            // Có thể điền trước một số thông tin vào modal nếu cần
                            // Ví dụ: document.getElementById('hidden-seat-class').value = flightDetails.seat_class;
                            // (Cần đảm bảo flightDetails có thông tin seat_class đã chọn lúc tìm kiếm)
                            // Hoặc lấy seat_class từ form tìm kiếm:
                            const seatClassSelect = document.getElementById("seat-class");
                            if(document.getElementById('hidden-seat-class')) {
                                document.getElementById('hidden-seat-class').value = seatClassSelect ? seatClassSelect.value : 'Phổ thông';
                            }
                             if(document.getElementById('hidden-total-passengers')) {
                                const adultCountInput = document.getElementById("adult-count");
                                const childCountInput = document.getElementById("child-count");
                                const passengers = (parseInt(adultCountInput.value) || 0) + (parseInt(childCountInput.value) || 0);
                                document.getElementById('hidden-total-passengers').value = passengers > 0 ? passengers : 1;
                            }


                            bookingModal.style.display = "flex";
                        } else {
                            // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
                            // Có thể lưu lại thông tin chuyến bay đang định đặt để quay lại sau
                            alert("Vui lòng đăng nhập hoặc đăng ký để tiếp tục đặt vé.");
                            // Ví dụ: lưu flightId vào localStorage rồi đọc lại sau khi đăng nhập
                            // localStorage.setItem('pendingBookingFlightId', flightId);
                            window.location.href = '/dang-nhap'; // URL của trang đăng nhập
                        }
                    } catch (error) {
                        console.error("Lỗi kiểm tra trạng thái đăng nhập:", error);
                        alert("Có lỗi xảy ra, vui lòng thử lại.");
                    }
                });
            });
        }
    }
    
    // Xử lý submit form đặt vé chi tiết (trong modal)
    if (bookingDetailsForm && bookingModal) { // bookingDetailsForm là id của form trong modal
        bookingDetailsForm.addEventListener("submit", async function (e) { // Thêm async
            e.preventDefault();
            
            const flightId = bookingModal.dataset.flightId; // Lấy flightId từ modal
            const passengerNameInput = document.getElementById("passenger-name");
            const passengerEmailInput = document.getElementById("passenger-email");
            const passengerPhoneInput = document.getElementById("passenger-phone");
            const paymentMethodSelect = document.getElementById("payment-method");
            const seatClassInput = document.getElementById("hidden-seat-class"); // Lấy từ trường ẩn
            const totalPassengersInput = document.getElementById("hidden-total-passengers");


            if (!passengerNameInput || !passengerEmailInput || !passengerPhoneInput || !paymentMethodSelect || !seatClassInput || !totalPassengersInput) {
                alert("Lỗi cấu trúc form đặt vé. Vui lòng liên hệ quản trị viên.");
                return;
            }

            const passengerName = passengerNameInput.value.trim();
            const passengerEmail = passengerEmailInput.value.trim();
            const passengerPhone = passengerPhoneInput.value.trim();
            const paymentMethod = paymentMethodSelect.value;
            const seatClass = seatClassInput.value;
            const totalPassengers = parseInt(totalPassengersInput.value); // Số này để backend tính giá và kiểm tra ghế

            // Client-side validation cơ bản
            if (!passengerName || !passengerEmail || !passengerPhone || !flightId) {
                alert("Vui lòng điền đầy đủ thông tin hành khách!");
                return;
            }
            if (!/\S+@\S+\.\S+/.test(passengerEmail)) {
                alert("Định dạng email không hợp lệ.");
                return;
            }
            // Nên có cơ chế nhập thông tin cho từng hành khách nếu totalPassengers > 1
            // Hiện tại, chúng ta sẽ gửi thông tin của 1 hành khách đại diện.
            // Backend cần xử lý số lượng hành khách (num_adults, num_children) dựa trên totalPassengers
            // và thông tin chi tiết từng người (passengers_data).
            // Ví dụ đơn giản:
            const passengersData = [];
            for (let i = 0; i < totalPassengers; i++) {
                // Nếu chỉ có form cho 1 người, lặp lại thông tin đó.
                // Trong thực tế, cần có form động để nhập cho từng người.
                passengersData.push({
                    full_name: passengerName + (i > 0 ? ` (Hành khách ${i+1})` : ''), // Tạm thời
                    email: passengerEmail, // Có thể chỉ cần email người liên hệ
                    phone_number: passengerPhone, // Có thể chỉ cần SĐT người liên hệ
                    type: 'adult' // Cần logic để xác định type dựa trên form tìm kiếm (adults, children)
                });
            }
            // Cần lấy số lượng người lớn, trẻ em từ form tìm kiếm ban đầu
            const adultCountInput = document.getElementById("adult-count");
            const childCountInput = document.getElementById("child-count");
            const num_adults = parseInt(adultCountInput.value) || 0;
            const num_children = parseInt(childCountInput.value) || 0;


            const bookingApiData = {
                flight_id: parseInt(flightId),
                passengers: passengersData, // Mảng các đối tượng hành khách
                seat_class: seatClass,
                num_adults: num_adults,
                num_children: num_children,
                num_infants: 0, // Cần thêm trường này vào form tìm kiếm nếu có
                payment_method: paymentMethod
                // total_amount sẽ được tính ở backend
            };

            console.log("Đang gửi dữ liệu đặt vé:", bookingApiData);

            try {
                const response = await fetch('/api/bookings', { // Gọi API POST để tạo booking
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bookingApiData),
                });
                const result = await response.json();
                console.log("Kết quả API đặt vé:", result);

                if (response.ok && result.success && result.booking) {
                    alert(`Đặt vé thành công! Mã đặt chỗ của bạn là: ${result.booking.pnr}. Tổng tiền: ${result.booking.total_amount.toLocaleString('vi-VN')} VND.`);
                    bookingModal.style.display = "none";
                    bookingDetailsForm.reset();
                    if(flightResultsSection) flightResultsSection.style.display = "none"; // Ẩn kết quả tìm kiếm
                } else {
                    alert("Đặt vé không thành công: " + (result.message || "Lỗi không xác định."));
                }
            } catch (error) {
                console.error('Lỗi khi đặt vé:', error);
                alert("Có lỗi kết nối trong quá trình đặt vé. Vui lòng thử lại.");
            }
        });
    }
    
    // Các hàm và listener khác của bạn (nếu có) giữ nguyên
    // Ví dụ: closeModalButton listener, window click listener for modal...
    if (closeModalButton && bookingModal) {
        closeModalButton.addEventListener("click", function () {
          bookingModal.style.display = "none";
        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
  const destinations = document.querySelectorAll(".destination");
  const departureInput = document.querySelector("#departure");
  const destinationInput = document.querySelector("#destination");

  destinations.forEach(dest => {
    dest.addEventListener("click", () => {
      const location = dest.getAttribute("data-destination");
      if (departureInput && destinationInput) {
        departureInput.value = "Hà Nội"; // cố định khởi hành
        destinationInput.value = location;
        // Cuộn tới form đặt vé
        document.querySelector("#booking-form").scrollIntoView({
          behavior: "smooth"
        });
      }
    });
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const track = document.querySelector(".news-track");
  const items = document.querySelectorAll(".news-vertical-item");
  const visibleCount = 3;
  const itemHeight = items[0].offsetHeight + 10;
  const totalItems = items.length;

  // Clone những tin đầu để cuộn vô tận
  for (let i = 0; i < visibleCount; i++) {
    const clone = items[i].cloneNode(true);
    track.appendChild(clone);
  }

  let index = 0;
  let allowTransition = true;

  function updateScroll() {
    track.style.transition = allowTransition ? "transform 0.6s ease-in-out" : "none";
    track.style.transform = `translateY(-${index * itemHeight}px)`;
  }

  setInterval(() => {
    index++;
    allowTransition = true;
    updateScroll();

    if (index === totalItems) {
      // Reset mượt về đầu sau 650ms
      setTimeout(() => {
        allowTransition = false;
        index = 0;
        updateScroll();
      }, 650);
    }
  }, 5000);

  updateScroll();
});
document.getElementById('booking-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const departure = document.getElementById('departure').value;
  const destination = document.getElementById('destination').value;
  const date = document.getElementById('departure-date').value;
  const seatClass = document.getElementById('seat-class').value;

  if (!departure || !destination || !date) {
    alert("Vui lòng nhập đầy đủ thông tin.");
    return;
  }

  fetch(`/flights?departure=${encodeURIComponent(departure)}&destination=${encodeURIComponent(destination)}`)
    .then(response => response.json())
    .then(data => {
      const resultsContainer = document.getElementById("flight-results");
      const optionsContainer = document.getElementById("flight-options-container");
      optionsContainer.innerHTML = "";

      if (data.length === 0) {
        optionsContainer.innerHTML = "<p>Không tìm thấy chuyến bay phù hợp.</p>";
      } else {
        data.forEach(flight => {
          let price = "N/A";
          if (seatClass === "Phổ thông") price = flight.economy_price;
          else if (seatClass === "Thương gia") price = flight.business_price;
          else if (seatClass === "Hạng nhất") price = flight.first_class_price;

          optionsContainer.innerHTML += `
            <div class="flight-option">
              <div class="flight-details">
                <h3>Chuyến bay: ${flight.flight_code}</h3>
                <p><strong>Hành trình:</strong> ${flight.departure} → ${flight.destination}</p>
                <p><strong>Thời gian:</strong> ${flight.departure_time} → ${flight.arrival_time}</p>
                <p><strong>Hạng:</strong> ${seatClass} - ${price} VND</p>
                <p><strong>Trạng thái:</strong> <span class="status-confirmed">Còn chỗ</span></p>
              </div>
              <button class="book-btn" data-flight="${flight.id}">Đặt vé</button>
            </div>
          `;
        });
      }

      resultsContainer.style.display = "block";
    })
    .catch(error => {
      alert("Lỗi khi tải chuyến bay.");
      console.error(error);
    });
});