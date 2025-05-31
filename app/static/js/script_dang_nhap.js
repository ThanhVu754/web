document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const emailError = document.getElementById('login-email-error');
        const passwordError = document.getElementById('login-password-error');
        const generalError = document.getElementById('login-general-error');

        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let isValid = true;

            // Reset lỗi
            if(emailError) emailError.textContent = '';
            if(passwordError) passwordError.textContent = '';
            if(generalError) generalError.style.display = 'flex';

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email) {
                if(emailError) emailError.textContent = 'Vui lòng nhập email.';
                isValid = false;
            } else if (!/\S+@\S+\.\S+/.test(email)) { 
                if(emailError) emailError.textContent = 'Định dạng email không hợp lệ.';
                isValid = false;
            }

            if (!password) {
                if(passwordError) passwordError.textContent = 'Vui lòng nhập mật khẩu.';
                isValid = false;
            }

            if (isValid) {
                // Mô phỏng đăng nhập
                if (email === "user@example.com" && password === "password123") {
                    alert('Đăng nhập thành công! (Mô phỏng)');
                    // Chuyển hướng đến trang dashboard người dùng hoặc trang chủ
                    // window.location.href = 'my_flights.html'; 
                } else {
                    if(generalError) {
                        generalError.textContent = 'Email hoặc mật khẩu không chính xác.';
                        generalError.style.display = 'bock';
                    }
                }
            }
        });
    }

    const forgotPasswordLink = document.querySelector('.forgot-password-link-vj');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert("Chức năng khôi phục mật khẩu hiện chưa được cài đặt.");
        });
    }
});