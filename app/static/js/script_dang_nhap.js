// app/static/js/script_dang_nhap.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const emailError = document.getElementById('login-email-error');
        const passwordError = document.getElementById('login-password-error');
        const generalError = document.getElementById('login-general-error'); // Đây là div màu đỏ

        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            let isValid = true;

            // Reset lỗi
            if (emailError) emailError.textContent = '';
            if (passwordError) passwordError.textContent = '';
            if (generalError) {
                generalError.textContent = ''; // Xóa nội dung lỗi cũ
                generalError.style.display = 'none'; // <<< ẨN ĐI MẶC ĐỊNH KHI SUBMIT
            }

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            // --- Client-side validation (giữ nguyên) ---
            if (!email) {
                if (emailError) emailError.textContent = 'Vui lòng nhập email.';
                isValid = false;
            } else if (!/\S+@\S+\.\S+/.test(email)) { 
                if (emailError) emailError.textContent = 'Định dạng email không hợp lệ.';
                isValid = false;
            }

            if (!password) {
                if (passwordError) passwordError.textContent = 'Vui lòng nhập mật khẩu.';
                isValid = false;
            }
            // --- Hết client-side validation ---

            if (isValid) {
                const loginData = {
                    email: email,
                    password: password
                };

                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(loginData),
                    });
                    const result = await response.json(); // Luôn cố gắng parse JSON

                    if (response.ok && result.success && result.user) { 
                        // Đăng nhập thành công
                        // alert(result.message || 'Đăng nhập thành công!'); // Có thể bỏ alert
                        if (result.user.role === 'admin') {
                            window.location.href = '/admin/dashboard'; 
                        } else { 
                            window.location.href = '/'; 
                        }
                    } else {
                        // Đăng nhập thất bại hoặc có lỗi từ server (ví dụ: tài khoản bị khóa)
                        if (generalError) {
                            generalError.textContent = result.message || 'Email hoặc mật khẩu không chính xác, hoặc tài khoản có vấn đề.';
                            generalError.style.display = 'block'; // <<< HIỂN THỊ Ô LỖI MÀU ĐỎ
                        }
                    }
                } catch (error) { // Lỗi mạng hoặc lỗi không parse được JSON (nếu server lỗi 500 trả về HTML)
                    console.error('Lỗi khi đăng nhập:', error);
                    if (generalError) {
                        generalError.textContent = 'Có lỗi xảy ra trong quá trình đăng nhập. Vui lòng thử lại sau.';
                        generalError.style.display = 'block'; // <<< HIỂN THỊ Ô LỖI MÀU ĐỎ
                    }
                }
            } else {
                 // Trường hợp validation phía client thất bại, có thể hiện lỗi chung nếu muốn
                 if (generalError && !emailError.textContent && !passwordError.textContent) { // Chỉ hiện lỗi chung nếu không có lỗi cụ thể ở input
                    generalError.textContent = 'Vui lòng kiểm tra lại thông tin đã nhập.';
                    generalError.style.display = 'block';
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