// app/static/js/payment_script.js
document.addEventListener('DOMContentLoaded', function() {
  console.log("payment_script.js loaded");

  // DOM Elements từ payment.html
  const summaryFlightIdEl            = document.getElementById('summaryFlightId');
  const summarySeatClassEl           = document.getElementById('summarySeatClass');
  const summaryNumPaxEl              = document.getElementById('summaryNumPax');
  const summaryTotalAmountDisplayEl  = document.getElementById('summaryTotalAmountDisplay');

  const paymentFormArea              = document.getElementById('paymentFormArea');
  const actualPaymentForm            = document.getElementById('actualPaymentForm');
  const paymentResultEl              = document.getElementById('paymentResult');

  // Input fields trên trang thanh toán
  const contactFullNameInput         = document.getElementById('payment-passenger-name');
  const contactEmailInput            = document.getElementById('payment-passenger-email');
  const contactPhoneInput            = document.getElementById('payment-passenger-phone');
  const paymentMethodSelectOnPage    = document.getElementById('payment-method-select');

  let pendingBookingDataFromStorage = null;

  function loadBookingSummary() {
    const storedData = localStorage.getItem('currentBookingAttempt');
    if (storedData) {
      try {
        pendingBookingDataFromStorage = JSON.parse(storedData);
        console.log("Dữ liệu đặt vé từ localStorage:", pendingBookingDataFromStorage);

        // Kiểm tra nếu có flight_id
        if (pendingBookingDataFromStorage && pendingBookingDataFromStorage.flight_id) {
          if (summaryFlightIdEl) summaryFlightIdEl.textContent = pendingBookingDataFromStorage.flight_id;
          if (summarySeatClassEl) summarySeatClassEl.textContent = pendingBookingDataFromStorage.seat_class_booked;

          // Tính số hành khách
          const adults   = pendingBookingDataFromStorage.num_adults   || 0;
          const children = pendingBookingDataFromStorage.num_children || 0;
          const infants  = pendingBookingDataFromStorage.num_infants  || 0;
          const totalPax = adults + children + infants;

          if (summaryNumPaxEl) {
            summaryNumPaxEl.textContent = `${totalPax} (NL: ${adults}, TE: ${children}, BE: ${infants})`;
          }

          // Tính Tổng tiền dự kiến (giả sử bên backend đã đẩy lên localStorage giá tiền 1 vé vào 'price_per_ticket')
          let totalAmountText = "–";
          if (pendingBookingDataFromStorage.price_per_ticket) {
            const pricePerTicket = pendingBookingDataFromStorage.price_per_ticket;
            const totalAmount    = pricePerTicket * totalPax;
            totalAmountText      = totalAmount.toLocaleString('vi-VN') + " VND";
          }
          if (summaryTotalAmountDisplayEl) summaryTotalAmountDisplayEl.textContent = totalAmountText;

          // Điền thông tin người liên hệ vào form
          if (contactFullNameInput && pendingBookingDataFromStorage.contact_full_name) {
            contactFullNameInput.value = pendingBookingDataFromStorage.contact_full_name;
          }
          if (contactEmailInput && pendingBookingDataFromStorage.contact_email) {
            contactEmailInput.value = pendingBookingDataFromStorage.contact_email;
          }
          if (contactPhoneInput && pendingBookingDataFromStorage.contact_phone) {
            contactPhoneInput.value = pendingBookingDataFromStorage.contact_phone;
          }
          // Optionally cũng chọn phương thức thanh toán mặc định nếu lưu trong localStorage
          if (paymentMethodSelectOnPage && pendingBookingDataFromStorage.payment_method) {
            paymentMethodSelectOnPage.value = pendingBookingDataFromStorage.payment_method;
          }

        } else {
          handleNoBookingData("Dữ liệu đặt vé không hợp lệ.");
        }
      } catch (e) {
        console.error("Lỗi parse JSON:", e);
        handleNoBookingData("Lỗi xử lý thông tin đặt vé.");
      }
    } else {
      handleNoBookingData("Không có thông tin đặt vé để xử lý. Vui lòng quay lại và chọn chuyến bay.");
    }
  }

  function handleNoBookingData(message) {
    if (paymentResultEl) {
      paymentResultEl.innerHTML = `<p class="error-message">${message} <a href="/">Quay lại trang chủ</a>.</p>`;
      paymentResultEl.style.display = 'block';
    }
    if (paymentFormArea) paymentFormArea.style.display = 'none';
    const summaryEl = document.getElementById('bookingSummary');
    if (summaryEl) summaryEl.style.display = 'none';
  }

  if (actualPaymentForm) {
    actualPaymentForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (!pendingBookingDataFromStorage) {
        alert("Không có dữ liệu đặt vé để xử lý. Vui lòng thử lại từ trang chủ.");
        return;
      }

      // Lấy thông tin người liên hệ
      const finalContactFullName = contactFullNameInput.value.trim();
      const finalContactEmail    = contactEmailInput.value.trim();
      const finalContactPhone    = contactPhoneInput.value.trim();
      let finalPaymentMethod     = paymentMethodSelectOnPage
                                   ? paymentMethodSelectOnPage.value
                                   : null;

      if (!finalContactFullName || !finalContactEmail || !finalContactPhone) {
        alert("Vui lòng điền đầy đủ thông tin người liên hệ.");
        return;
      }
      if (!/\S+@\S+\.\S+/.test(finalContactEmail)) {
        alert("Định dạng email người liên hệ không hợp lệ.");
        return;
      }
      if (!finalPaymentMethod) {
        alert("Vui lòng chọn phương thức thanh toán.");
        return;
      }

      // Xây dựng mảng passengers_data (giả định người liên hệ là hành khách đầu tiên)
      const adults   = pendingBookingDataFromStorage.num_adults   || 0;
      const children = pendingBookingDataFromStorage.num_children || 0;
      const infants  = pendingBookingDataFromStorage.num_infants  || 0;
      const totalPax = adults + children + infants;

      const finalPassengersData = [{
        full_name:    finalContactFullName,
        email:        finalContactEmail,
        phone_number: finalContactPhone,
        type:         'adult'
      }];
      // Nếu có nhiều hành khách, thêm placeholder
      for (let i = 1; i < totalPax; i++) {
        let type = 'adult';
        if (i >= adults && i < (adults + children)) {
          type = 'child';
        } else if (i >= (adults + children)) {
          type = 'infant';
        }
        finalPassengersData.push({
          full_name:    `Hành khách ${i + 1}`,
          email:        null,
          phone_number: null,
          type:         type
        });
      }

      // Chuẩn bị payload gửi lên API
      const finalBookingApiData = {
        flight_id:          pendingBookingDataFromStorage.flight_id,
        seat_class_booked:  pendingBookingDataFromStorage.seat_class_booked,
        num_adults:         adults,
        num_children:       children,
        num_infants:        infants,
        price_per_ticket:   pendingBookingDataFromStorage.price_per_ticket || 0,
        passengers_data:    finalPassengersData,
        payment_method:     finalPaymentMethod
      };

      console.log("Gửi dữ liệu đặt vé cuối cùng:", finalBookingApiData);

      // Hiển thị trạng thái “Đang xử lý”
      if (paymentResultEl) {
        paymentResultEl.innerHTML = `<p class="processing-message">Đang xử lý đặt vé của bạn, vui lòng chờ...</p>`;
        paymentResultEl.style.display = 'block';
      }
      if (paymentFormArea) paymentFormArea.style.display = 'none';

      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalBookingApiData)
        });
        const result = await response.json();
        console.log("Kết quả API đặt vé:", result);

        if (paymentResultEl) {
          if (response.ok && result.success && result.booking) {
            paymentResultEl.innerHTML = `
              <h3 class="success-message">Đặt vé thành công!</h3>
              <p>Cảm ơn bạn đã sử dụng dịch vụ của SangAir.</p>
              <p>Mã đặt chỗ: <strong>${result.booking.pnr}</strong></p>
              <p>Tổng tiền: <strong>${result.booking.total_amount.toLocaleString('vi-VN')} VND</strong></p>
            `;
            localStorage.removeItem('currentBookingAttempt');
          } else {
            paymentResultEl.innerHTML = `
              <h3 class="error-message">Đặt vé không thành công</h3>
              <p>${result.message || "Lỗi không xác định. Vui lòng thử lại hoặc liên hệ hỗ trợ."}</p>
              <p><a href="/">Quay lại trang chủ</a></p>
            `;
            if (paymentFormArea) paymentFormArea.style.display = 'block';
          }
        }
      } catch (error) {
        console.error('Lỗi khi gọi API đặt vé:', error);
        if (paymentResultEl) {
          paymentResultEl.innerHTML = `
            <h3 class="error-message">Lỗi kết nối</h3>
            <p>Không thể kết nối đến máy chủ để hoàn tất đặt vé. Vui lòng kiểm tra lại mạng và thử lại.</p>
          `;
        }
        if (paymentFormArea) paymentFormArea.style.display = 'block';
      }
    });
  }

  // Tải dữ liệu tóm tắt đặt chỗ (nếu có) khi trang load xong
  loadBookingSummary();
});
