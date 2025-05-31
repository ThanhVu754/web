document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let isValid = true;

            const fullNameInput = document.getElementById('register-fullname');
            const emailInput = document.getElementById('register-email');
            const phoneInput = document.getElementById('register-phone');
            const passwordInput = document.getElementById('register-password');
            const confirmPasswordInput = document.getElementById('register-confirm-password');
            const agreeTermsCheckbox = document.getElementById('agreeTerms');

            const fullNameError = document.getElementById('register-fullname-error');
            const emailError = document.getElementById('register-email-error');
            const phoneError = document.getElementById('register-phone-error');
            const passwordError = document.getElementById('register-password-error');
            const confirmPasswordError = document.getElementById('register-confirm-password-error');
            const agreeTermsError = document.getElementById('agreeTerms-error');
            const generalError = document.getElementById('register-general-error');

            // Reset lỗi
            [fullNameError, emailError, phoneError, passwordError, confirmPasswordError, agreeTermsError].forEach(el => {
                if(el) el.textContent = '';
            });
            if(generalError) generalError.style.display = 'none';

            // Validate Họ tên
            if (!fullNameInput.value.trim()) {
                if(fullNameError) fullNameError.textContent = 'Vui lòng nhập họ và tên.';
                isValid = false;
            }

            // Validate Email
            if (!emailInput.value.trim()) {
                if(emailError) emailError.textContent = 'Vui lòng nhập email.';
                isValid = false;
            } else if (!/\S+@\S+\.\S+/.test(emailInput.value.trim())) {
                if(emailError) emailError.textContent = 'Định dạng email không hợp lệ.';
                isValid = false;
            }
            
            // Validate Số điện thoại (tùy chọn, ví dụ cơ bản)
            if (phoneInput.value.trim() && !/^\d{10,11}$/.test(phoneInput.value.trim())) {
                if(phoneError) phoneError.textContent = 'Số điện thoại không hợp lệ.';
                isValid = false;
            }

            // Validate Mật khẩu
            if (!passwordInput.value) {
                if(passwordError) passwordError.textContent = 'Vui lòng nhập mật khẩu.';
                isValid = false;
            } else if (passwordInput.value.length < 6) {
                if(passwordError) passwordError.textContent = 'Mật khẩu phải có ít nhất 6 ký tự.';
                isValid = false;
            }

            // Validate Xác nhận mật khẩu
            if (!confirmPasswordInput.value) {
                if(confirmPasswordError) confirmPasswordError.textContent = 'Vui lòng xác nhận mật khẩu.';
                isValid = false;
            } else if (passwordInput.value && confirmPasswordInput.value !== passwordInput.value) {
                if(confirmPasswordError) confirmPasswordError.textContent = 'Mật khẩu xác nhận không khớp.';
                isValid = false;
            }
            
            // Validate Đồng ý điều khoản
            if (!agreeTermsCheckbox.checked) {
                if(agreeTermsError) agreeTermsError.textContent = 'Bạn phải đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.';
                isValid = false;
            }

            if (isValid) {
                alert('Đăng ký thành công! (Mô phỏng)\nVui lòng kiểm tra email để kích hoạt tài khoản.');
                // Trong thực tế, bạn sẽ gửi dữ liệu này lên backend
                // registerForm.reset(); // Reset form sau khi thành công
                // window.location.href = 'dang_nhap.html'; // Chuyển hướng đến trang đăng nhập
            } else {
                if(generalError) {
                    generalError.textContent = 'Vui lòng kiểm tra lại các thông tin đã nhập.';
                    generalError.style.display = 'block';
                }
            }
        });
    }
});