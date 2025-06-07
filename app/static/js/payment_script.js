// app/static/js/payment_script.js
document.addEventListener('DOMContentLoaded', function() {
    console.log("payment_script.js loaded and ready.");

    // DOM Elements từ payment.html
    const summaryFlightIdEl = document.getElementById('summaryFlightId');
    const summarySeatClassEl = document.getElementById('summarySeatClass');
    const summaryNumPaxEl = document.getElementById('summaryNumPax');
    const summaryPassengerInfoEl = document.getElementById('summaryPassengerInfo');
    const summaryPaymentMethodEl = document.getElementById('summaryPaymentMethod');
    const summaryBaseFareEstimateEl = document.getElementById('summaryBaseFareEstimate');

    const paymentFormArea = document.getElementById('paymentFormArea');
    const actualPaymentForm = document.getElementById('actualPaymentForm');
    const paymentResultEl = document.getElementById('paymentResult');

    // Input fields trên trang thanh toán
    const contactFullNameInput = document.getElementById('payment-passenger-name');
    const contactEmailInput = document.getElementById('payment-passenger-email');
    const contactPhoneInput = document.getElementById('payment-passenger-phone');
    const paymentMethodSelectOnPage = document.getElementById('payment-method-select');

    let pendingBookingDataFromStorage = null; // Biến để lưu trữ dữ liệu từ localStorage

    const confirmBookingBtn = document.getElementById('confirmBookingBtn');
    const paymentDetailsSection = document.getElementById('payment-details-section');
    
    let pendingBookingData = null;
    let createdBookingId = null; // Lưu ID của booking vừa tạo
    
    if (confirmBookingBtn) {
        confirmBookingBtn.addEventListener('click', async function() {
            if (!pendingBookingData) { alert("Đã có lỗi xảy ra, vui lòng thử lại!"); return; }

            this.disabled = true;
            this.textContent = 'Đang tạo đặt chỗ...';

            try {
                // Gọi API để tạo booking với trạng thái "pending_payment"
                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pendingBookingData)
                });
                const result = await response.json();

                if (response.ok && result.success && result.booking) {
                    // Tạo booking thành công, lưu lại ID và hiển thị form thanh toán
                    createdBookingId = result.booking.booking_id;
                    alert(`Đã tạo đặt chỗ với mã ${result.booking.pnr}. Vui lòng hoàn tất thanh toán.`);
                    
                    // Ẩn nút "Xác nhận đặt chỗ", hiện form thanh toán
                    this.style.display = 'none';
                    if(paymentDetailsSection) paymentDetailsSection.style.display = 'block';

                } else {
                    alert("Lỗi khi tạo đặt chỗ: " + (result.message || "Lỗi không xác định."));
                    this.disabled = false;
                    this.textContent = 'Xác nhận và đến trang Thanh toán';
                }
            } catch (error) {
                console.error('Lỗi khi tạo đặt chỗ:', error);
                alert("Lỗi kết nối khi tạo đặt chỗ.");
                this.disabled = false;
                this.textContent = 'Xác nhận và đến trang Thanh toán';
            }
        });
    }

    // Bước 2: Người dùng submit form thanh toán mô phỏng
    if (actualPaymentForm) {
        actualPaymentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!createdBookingId) {
                alert("Lỗi: Không có mã đặt chỗ để thanh toán.");
                return;
            }

            const cardNumberInput = document.getElementById('card-number');
            const cardHolderInput = document.getElementById('card-holder');
            if (cardNumberInput.value.trim() === '' || cardHolderInput.value.trim() === '') {
                alert("Vui lòng nhập đầy đủ thông tin thanh toán.");
                return;
            }

            const paymentBtn = this.querySelector('.btn-confirm-payment');
            paymentBtn.disabled = true;
            paymentBtn.textContent = "Đang xử lý...";

            try {
                // Gọi API thanh toán mới
                const response = await fetch(`/api/bookings/${createdBookingId}/pay`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // body có thể chứa thông tin thẻ nếu cần
                    // body: JSON.stringify({ card_info: ... })
                });
                const result = await response.json();

                if (paymentResultEl) {
                    paymentResultEl.style.display = 'block';
                    if (response.ok && result.success && result.booking) {
                        paymentResultEl.innerHTML = `
                            <h3 class="success-message">Thanh toán thành công!</h3>
                            <p>Đặt chỗ <strong><span class="math-inline">\{result\.booking\.pnr\}</strong\> của bạn đã được xác nhận\.</p\><p\>Tổng tiền đã thanh toán\: <strong\></span>{result.booking.total_amount.toLocaleString('vi-VN')} VND</strong></p>
                            <p><a href="/">Về trang chủ</a> | <a href="/chuyen-bay-cua-toi">Xem chuyến bay của tôi</a></p>
                        `;
                        localStorage.removeItem('currentBookingAttempt');
                        if(paymentFormArea) paymentFormArea.style.display = 'none'; // Ẩn toàn bộ form area
                    } else {
                        paymentResultEl.innerHTML = `<h3 class="error-message">Thanh toán không thành công</h3><p>${result.message || "Lỗi không xác định."}</p>`;
                        paymentBtn.disabled = false;
                        paymentBtn.textContent = "Thanh toán ngay";
                    }
                }
            } catch (error) {
                 console.error('Lỗi khi thanh toán:', error);
                 if (paymentResultEl) {
                     paymentResultEl.innerHTML = `<h3 class="error-message">Lỗi kết nối</h3><p>Không thể kết nối đến máy chủ. Vui lòng thử lại.</p>`;
                 }
                 paymentBtn.disabled = false;
                 paymentBtn.textContent = "Thanh toán ngay";
            }
        });
    }
    
    // Hàm xử lý khi không có dữ liệu đặt vé hợp lệ
    function handleNoBookingData(message) {
        if(paymentResultEl) {
            paymentResultEl.innerHTML = `<p class="error-message">${message} Vui lòng <a href="/">quay lại trang chủ</a> và chọn lại chuyến bay.</p>`;
            paymentResultEl.style.display = 'block';
        }
        // Ẩn các phần không cần thiết
        if(paymentFormArea) paymentFormArea.style.display = 'none';
        if(document.getElementById('bookingSummary')) document.getElementById('bookingSummary').style.display = 'none';
    }
    
    // Hàm tải và hiển thị tóm tắt thông tin đặt chỗ
    function loadBookingSummary() {
        console.log("Attempting to load booking summary from localStorage...");
        const storedData = localStorage.getItem('currentBookingAttempt');
        
        if (storedData) {
            try {
                pendingBookingDataFromStorage = JSON.parse(storedData);
                console.log("Data from localStorage:", pendingBookingDataFromStorage);

                if (pendingBookingDataFromStorage && pendingBookingDataFromStorage.flight_id) {
                    // Hiển thị tóm tắt
                    if(summaryFlightIdEl) summaryFlightIdEl.textContent = pendingBookingDataFromStorage.flight_id;
                    if(summarySeatClassEl) summarySeatClassEl.textContent = pendingBookingDataFromStorage.seat_class_booked;
                    
                    const totalPax = (pendingBookingDataFromStorage.num_adults || 0) + 
                                     (pendingBookingDataFromStorage.num_children || 0) + 
                                     (pendingBookingDataFromStorage.num_infants || 0);
                    if(summaryNumPaxEl) summaryNumPaxEl.textContent = `${totalPax} (Người lớn: ${pendingBookingDataFromStorage.num_adults}, Trẻ em: ${pendingBookingDataFromStorage.num_children})`;
                    
                    // Điền thông tin người liên hệ vào form trên trang thanh toán
                    if(contactFullNameInput && pendingBookingDataFromStorage.contact_full_name) contactFullNameInput.value = pendingBookingDataFromStorage.contact_full_name;
                    if(contactEmailInput && pendingBookingDataFromStorage.contact_email) contactEmailInput.value = pendingBookingDataFromStorage.contact_email;
                    if(contactPhoneInput && pendingBookingDataFromStorage.contact_phone) contactPhoneInput.value = pendingBookingDataFromStorage.contact_phone;
                    
                    // Hiển thị thông tin người liên hệ trong phần tóm tắt
                    if(summaryPassengerInfoEl) {
                        summaryPassengerInfoEl.innerHTML = ''; 
                        if (pendingBookingDataFromStorage.contact_full_name) {
                            const liName = document.createElement('li');
                            liName.textContent = `Tên liên hệ: ${pendingBookingDataFromStorage.contact_full_name}`;
                            summaryPassengerInfoEl.appendChild(liName);
                        }
                    }

                    // Điền và hiển thị phương thức thanh toán
                    if(paymentMethodSelectOnPage && pendingBookingDataFromStorage.payment_method) {
                        paymentMethodSelectOnPage.value = pendingBookingDataFromStorage.payment_method;
                    }
                    if(summaryPaymentMethodEl && pendingBookingDataFromStorage.payment_method) {
                        summaryPaymentMethodEl.textContent = paymentMethodSelectOnPage.options[paymentMethodSelectOnPage.selectedIndex].text;
                    }

                    // Hiển thị giá tạm tính nếu có (tùy chọn)
                    if(summaryBaseFareEstimateEl) summaryBaseFareEstimateEl.textContent = "Sẽ được tính toán khi xác nhận."; 

                } else {
                    handleNoBookingData("Dữ liệu đặt vé không hợp lệ.");
                }
            } catch (e) {
                console.error("Lỗi parse dữ liệu từ localStorage:", e);
                handleNoBookingData("Lỗi xử lý thông tin đặt vé.");
            }
        } else {
            console.error("Không tìm thấy 'currentBookingAttempt' trong localStorage.");
            handleNoBookingData("Không có thông tin đặt vé để xử lý.");
        }
    }
    
    // Xử lý sự kiện submit của form thanh toán
    if (actualPaymentForm) {
        actualPaymentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!pendingBookingDataFromStorage) {
                alert("Lỗi: Dữ liệu đặt vé không còn. Vui lòng bắt đầu lại quá trình đặt vé.");
                window.location.href = '/';
                return;
            }

            // Lấy thông tin người liên hệ cuối cùng từ form trên trang thanh toán
            const finalContactFullName = contactFullNameInput ? contactFullNameInput.value.trim() : '';
            const finalContactEmail = contactEmailInput ? contactEmailInput.value.trim() : '';
            const finalContactPhone = contactPhoneInput ? contactPhoneInput.value.trim() : '';
            const finalPaymentMethod = paymentMethodSelectOnPage ? paymentMethodSelectOnPage.value : 'credit-card';

            if (!finalContactFullName || !finalContactEmail || !finalContactPhone) {
                alert("Vui lòng điền đầy đủ thông tin người liên hệ.");
                return;
            }
            if (!/\S+@\S+\.\S+/.test(finalContactEmail)) {
                alert("Định dạng email người liên hệ không hợp lệ.");
                return;
            }

            // Cập nhật lại passengers_data với thông tin người liên hệ cuối cùng
              let finalPassengersData = [];
              if (pendingBookingDataFromStorage && Array.isArray(pendingBookingDataFromStorage.passengers_data)) {
                  // Tạo một bản sao của mảng
                  finalPassengersData = JSON.parse(JSON.stringify(pendingBookingDataFromStorage.passengers_data));
              }

              // Cập nhật lại thông tin người liên hệ cuối cùng vào hành khách đầu tiên
              if (finalPassengersData.length > 0) {
                  finalPassengersData[0].full_name = finalContactFullName;
                  finalPassengersData[0].email = finalContactEmail;
                  finalPassengersData[0].phone_number = finalContactPhone;
              } else { // Nếu mảng rỗng vì lý do nào đó, tạo mới
                  finalPassengersData.push({
                      full_name: finalContactFullName, 
                      email: finalContactEmail, 
                      phone_number: finalContactPhone, 
                      type: 'adult'
                  });
              }

            const finalBookingApiData = {
              ...pendingBookingDataFromStorage,
              passengers_data: finalPassengersData, // Ghi đè với thông tin đã được xác nhận/sửa
              payment_method: finalPaymentMethod 
            };

            // Xóa các key tạm không cần gửi lên API
            delete finalBookingApiData.contact_full_name;
            delete finalBookingApiData.contact_email;
            delete finalBookingApiData.contact_phone;

            console.log("Gửi dữ liệu đặt vé cuối cùng đến API:", finalBookingApiData);

            if(paymentResultEl) {
                paymentResultEl.innerHTML = `<p class="processing-message">Đang xử lý đặt vé của bạn, vui lòng chờ...</p>`;
                paymentResultEl.style.display = 'block';
            }
            if(paymentFormArea) paymentFormArea.style.display = 'none'; 

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
                            <h3 class="success-message">Đặt vé và Thanh toán thành công!</h3>
                            <p>Cảm ơn bạn đã sử dụng dịch vụ của SangAir.</p>
                            <p>Mã đặt chỗ của bạn: <strong>${result.booking.pnr}</strong></p>
                            <p>Tổng tiền đã thanh toán: <strong>${result.booking.total_amount.toLocaleString('vi-VN')} VND</strong></p>
                            <p>Trạng thái đặt chỗ: <strong style="color: #28a745;">${result.booking.status === 'confirmed' ? 'Đã xác nhận' : result.booking.status}</strong></p>
                            <hr>
                            <p><a href="/">Về trang chủ</a> | <a href="/chuyen-bay-cua-toi">Xem chuyến bay của tôi</a></p>
                        `;
                        localStorage.removeItem('currentBookingAttempt');
                    } else {
                        paymentResultEl.innerHTML = `
                            <h3 class="error-message">Đặt vé không thành công</h3>
                            <p>${result.message || "Lỗi không xác định. Vui lòng thử lại hoặc liên hệ hỗ trợ."}</p>
                            <p><a href="/">Thử lại từ trang chủ</a></p>
                        `;
                        if(paymentFormArea) paymentFormArea.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('Lỗi khi gọi API đặt vé:', error);
                if (paymentResultEl) {
                    paymentResultEl.innerHTML = `<h3 class="error-message">Lỗi kết nối</h3><p>Không thể kết nối đến máy chủ để hoàn tất đặt vé. Vui lòng kiểm tra lại mạng và thử lại.</p>`;
                }
                if(paymentFormArea) paymentFormArea.style.display = 'block';
            }
        });
    }

    // Tải tóm tắt đặt chỗ khi trang payment.html tải xong
    loadBookingSummary();
});