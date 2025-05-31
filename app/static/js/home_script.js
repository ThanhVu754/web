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

    if (closeModalButton && bookingModal) {
        closeModalButton.addEventListener("click", function () {
          bookingModal.style.display = "none";
        });
    }
    
    window.addEventListener('click', function(event) {
        if (event.target == bookingModal) { 
            bookingModal.style.display = "none";
        }
    });

    if (bookingDetailsForm && bookingModal) {
        bookingDetailsForm.addEventListener("submit", function (e) {
          e.preventDefault();
          const passengerNameInput = document.getElementById("passenger-name");
          const passengerEmailInput = document.getElementById("passenger-email");
          const passengerPhoneInput = document.getElementById("passenger-phone");
          if (!passengerNameInput || !passengerEmailInput || !passengerPhoneInput) return;
          const passengerName = passengerNameInput.value.trim();
          const passengerEmail = passengerEmailInput.value.trim();
          const passengerPhone = passengerPhoneInput.value.trim();
          if (passengerName === "" || passengerEmail === "" || passengerPhone === "") {
            alert("Vui lòng điền đầy đủ thông tin!");
            return;
          }
          alert(`Đặt vé thành công! (Đây là demo, chưa kết nối backend)`);
          bookingModal.style.display = "none";
          bookingDetailsForm.reset();
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