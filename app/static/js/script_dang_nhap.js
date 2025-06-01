// app/static/js/script_dang_nhap.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const emailError = document.getElementById('login-email-error');
        const passwordError = document.getElementById('login-password-error');
        const generalError = document.getElementById('login-general-error'); // Đảm bảo ID này đúng với HTML của bạn

        loginForm.addEventListener('submit', async function(e) { // << Thêm async
            e.preventDefault();
            let isValid = true;

            // Reset lỗi
            if (emailError) emailError.textContent = '';
            if (passwordError) passwordError.textContent = '';
            if (generalError) {
                generalError.textContent = ''; // Xóa nội dung lỗi cũ
                generalError.style.display = 'none';
            }

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email) {
                if (emailError) emailError.textContent = 'Vui lòng nhập email.';
                isValid = false;
            } else if (!/\S+@\S+\.\S+/.test(email)) { // Regex đơn giản
                if (emailError) emailError.textContent = 'Định dạng email không hợp lệ.';
                isValid = false;
            }

            if (!password) {
                if (passwordError) passwordError.textContent = 'Vui lòng nhập mật khẩu.';
                isValid = false;
            }

            if (isValid) {
                const loginData = {
                    email: email,
                    password: password
                };

                try {
                    const response = await fetch('/api/auth/login', { // Gọi API backend
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(loginData),
                    });
                    const result = await response.json();

                    if (response.ok && result.success && result.user) { // Kiểm tra response.ok và result.user
                        // alert(result.message || 'Đăng nhập thành công!'); // Có thể bỏ alert nếu chuyển hướng ngay

                        // Lưu trạng thái đăng nhập (ví dụ: vào localStorage hoặc để session cookie tự xử lý)
                        // localStorage.setItem('userData', JSON.stringify(result.user)); // Ví dụ

                        // Điều hướng dựa trên vai trò (role)
                        if (result.user.role === 'admin') {
                            window.location.href = '/admin/dashboard'; // Hoặc URL dashboard admin của bạn
                        } else { // Mặc định là 'client' hoặc các role khác
                            window.location.href = '/'; // Chuyển hướng về trang chủ client
                        }
                    } else {
                        if (generalError) {
                            generalError.textContent = result.message || 'Email hoặc mật khẩu không chính xác.';
                            generalError.style.display = 'block'; // Hoặc 'flex' tùy CSS
                        }
                    }
                } catch (error) {
                    console.error('Lỗi khi đăng nhập:', error);
                    if (generalError) {
                        generalError.textContent = 'Có lỗi xảy ra trong quá trình đăng nhập. Vui lòng thử lại sau.';
                        generalError.style.display = 'block';
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