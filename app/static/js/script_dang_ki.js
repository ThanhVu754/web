// app/static/js/script_dang_ki.js
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) { // << Thêm async
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
                if (el) el.textContent = '';
            });
            if (generalError) {
                generalError.textContent = ''; // Xóa nội dung lỗi cũ
                generalError.style.display = 'none';
            }

            // Validate Họ tên
            if (!fullNameInput.value.trim()) {
                if (fullNameError) fullNameError.textContent = 'Vui lòng nhập họ và tên.';
                isValid = false;
            }

            // Validate Email
            const email = emailInput.value.trim();
            if (!email) {
                if (emailError) emailError.textContent = 'Vui lòng nhập email.';
                isValid = false;
            } else if (!/\S+@\S+\.\S+/.test(email)) { // Regex đơn giản, có thể cải thiện
                if (emailError) emailError.textContent = 'Định dạng email không hợp lệ.';
                isValid = false;
            }
            
            // Validate Số điện thoại (tùy chọn)
            const phone = phoneInput.value.trim();
            if (phone && !/^\d{10,11}$/.test(phone)) { // Chỉ validate nếu có nhập
                if (phoneError) phoneError.textContent = 'Số điện thoại không hợp lệ (10-11 chữ số).';
                isValid = false;
            }

            // Validate Mật khẩu
            const password = passwordInput.value;
            if (!password) {
                if (passwordError) passwordError.textContent = 'Vui lòng nhập mật khẩu.';
                isValid = false;
            } else if (password.length < 6) {
                if (passwordError) passwordError.textContent = 'Mật khẩu phải có ít nhất 6 ký tự.';
                isValid = false;
            }

            // Validate Xác nhận mật khẩu
            if (!confirmPasswordInput.value) {
                if (confirmPasswordError) confirmPasswordError.textContent = 'Vui lòng xác nhận mật khẩu.';
                isValid = false;
            } else if (password && confirmPasswordInput.value !== password) {
                if (confirmPasswordError) confirmPasswordError.textContent = 'Mật khẩu xác nhận không khớp.';
                isValid = false;
            }
            
            // Validate Đồng ý điều khoản
            if (!agreeTermsCheckbox.checked) {
                if (agreeTermsError) agreeTermsError.textContent = 'Bạn phải đồng ý với Điều khoản và Chính sách.';
                isValid = false;
            }

            if (isValid) {
                const userData = {
                    full_name: fullNameInput.value.trim(),
                    email: email,
                    password: password,
                    phone_number: phone // Gửi phone nếu có, backend có thể xử lý phone là optional
                };

                try {
                    const response = await fetch('/api/auth/register', { // Gọi API backend
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(userData),
                    });
                    const result = await response.json();

                    if (response.ok && result.success) { // Kiểm tra response.ok cho status 2xx
                        alert(result.message || 'Đăng ký thành công! Vui lòng đăng nhập.');
                        registerForm.reset();
                        window.location.href = '/dang-nhap'; // Chuyển hướng đến trang đăng nhập
                    } else {
                        if (generalError) {
                            generalError.textContent = result.message || 'Đăng ký không thành công. Vui lòng thử lại.';
                            generalError.style.display = 'block'; // Hoặc 'flex' tùy CSS
                        }
                    }
                } catch (error) {
                    console.error('Lỗi khi đăng ký:', error);
                    if (generalError) {
                        generalError.textContent = 'Có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại sau.';
                        generalError.style.display = 'block';
                    }
                }
            } else {
                if (generalError) {
                    generalError.textContent = 'Vui lòng kiểm tra lại các thông tin đã nhập.';
                    generalError.style.display = 'block';
                }
            }
        });
    }
});