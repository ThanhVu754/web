document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('adminLoginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessageDiv = document.getElementById('loginErrorMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Ngăn form submit theo cách truyền thống

            const username = usernameInput.value.trim();
            const password = passwordInput.value; // Không trim mật khẩu

            // Xóa thông báo lỗi cũ (nếu có)
            if (errorMessageDiv) {
                errorMessageDiv.textContent = '';
                errorMessageDiv.style.display = 'none';
            }

            // Kiểm tra input cơ bản
            if (username === '' || password === '') {
                if (errorMessageDiv) {
                    errorMessageDiv.textContent = 'Vui lòng nhập tên đăng nhập và mật khẩu.';
                    errorMessageDiv.style.display = 'block';
                }
                return;
            }

            // --- PHẦN MÔ PHỎNG XÁC THỰC (SẼ THAY BẰNG BACKEND SAU) ---
            // Trong thực tế, bạn sẽ gửi username và password này lên server để xác thực.
            // Ở đây, chúng ta dùng một cặp tài khoản demo.
            const MOCK_ADMIN_USER = "admin";
            const MOCK_ADMIN_PASS = "password123";

            if (username === MOCK_ADMIN_USER && password === MOCK_ADMIN_PASS) {
                // Đăng nhập thành công (mô phỏng)
                alert('Đăng nhập thành công! Đang chuyển hướng đến Dashboard...');
                // Lưu trạng thái đăng nhập (ví dụ: localStorage, sessionStorage) - Cần cho Back-end
                // localStorage.setItem('isAdminLoggedIn', 'true'); 
                window.location.href = 'dashboard.html'; // Chuyển hướng đến trang dashboard
            } else {
                // Đăng nhập thất bại
                if (errorMessageDiv) {
                    errorMessageDiv.textContent = 'Tên đăng nhập hoặc mật khẩu không chính xác.';
                    errorMessageDiv.style.display = 'block';
                }
                // Xóa trường mật khẩu để người dùng nhập lại
                passwordInput.value = ''; 
                passwordInput.focus();
            }
            // --- KẾT THÚC PHẦN MÔ PHỎNG XÁC THỰC ---
        });
    }

    // Xử lý link "Quên mật khẩu?" (hiện tại chỉ là placeholder)
    const forgotPasswordLink = document.querySelector('.forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert("Chức năng khôi phục mật khẩu hiện chưa được cài đặt.");
        });
    }
});