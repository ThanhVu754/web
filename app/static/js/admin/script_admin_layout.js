document.addEventListener('DOMContentLoaded', function() {
    console.log("Admin Layout Script Loaded (Simplified)!");

    const sidebar = document.getElementById('adminSidebar');
    const mobileToggleBtn = document.getElementById('mobile-menu-toggle-btn');
    const mainContentForOverlay = document.querySelector('.admin-main-content');


    // --- Mobile Sidebar Open/Close Toggle ---
    if (mobileToggleBtn && sidebar) {
        mobileToggleBtn.addEventListener('click', function(event) {
            event.stopPropagation(); // Ngăn sự kiện click nổi bọt lên document
            sidebar.classList.toggle('open');
            if (mainContentForOverlay) {
                mainContentForOverlay.classList.toggle('sidebar-open-overlay');
            }
        });
    }
    
    // Đóng sidebar khi click vào main content hoặc bất kỳ đâu ngoài sidebar (chỉ trên mobile khi sidebar đang mở)
    document.addEventListener('click', function(event) {
        if (sidebar && sidebar.classList.contains('open') && window.innerWidth <= 768) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnToggleButton = mobileToggleBtn ? mobileToggleBtn.contains(event.target) : false;

            if (!isClickInsideSidebar && !isClickOnToggleButton) {
                sidebar.classList.remove('open');
                if (mainContentForOverlay) {
                    mainContentForOverlay.classList.remove('sidebar-open-overlay');
                }
            }
        }
    });

    
    // --- Sidebar Active Link ---
    const currentLocation = window.location.pathname; 
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');

    sidebarLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        // So sánh chính xác hơn, tránh trường hợp "index.html" khớp với "admin/index.html"
        if (linkHref && currentLocation.endsWith(linkHref) && (currentLocation.length === linkHref.length || currentLocation.charAt(currentLocation.length - linkHref.length -1) === '/')) {
            sidebarLinks.forEach(l => l.parentElement.classList.remove('active'));
            link.parentElement.classList.add('active');
        }
    });
    // Xử lý đặc biệt cho trang dashboard nếu URL là /admin/ hoặc /admin/dashboard.html (hoặc /admin/index.html)
    const adminBasePaths = ['/admin/', '/admin/index.html']; 
    if (adminBasePaths.some(path => currentLocation.endsWith(path)) || (currentLocation.includes('dashboard.html') && !currentLocation.includes('dashboard.html.'))) {
        const dashboardLink = document.querySelector('.sidebar-nav a[href="dashboard.html"]');
        if (dashboardLink) {
             sidebarLinks.forEach(l => l.parentElement.classList.remove('active'));
            dashboardLink.parentElement.classList.add('active');
        }
    }


    // --- Xử lý Logout ---
    const logoutButton = document.querySelector('.logout-btn'); // Lấy nút đăng xuất
    if (logoutButton) {
        logoutButton.addEventListener('click', async function(e) { // Thêm async
            e.preventDefault(); // Ngăn hành vi mặc định của thẻ <a> nếu href="#"
            if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
                try {
                    const response = await fetch('/api/auth/logout', { // Gọi API logout (trong client_routes.py)
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            // Nếu API logout của bạn yêu cầu CSRF token hoặc các header khác, thêm vào đây
                        }
                    });
                    const result = await response.json();

                    if (response.ok && result.success) {
                        alert(result.message || "Đăng xuất thành công!");
                        // Chuyển hướng về trang đăng nhập chung (client/dang_nhap.html)
                        // Vì admin cũng dùng trang đăng nhập này
                        window.location.href = '/dang-nhap'; // Hoặc url_for('client_bp.login_page') nếu bạn có cách lấy URL đó ở JS
                    } else {
                        alert("Lỗi đăng xuất: " + (result.message || "Không thể đăng xuất."));
                    }
                } catch (error) {
                    console.error("Lỗi khi thực hiện đăng xuất:", error);
                    alert("Có lỗi kết nối xảy ra khi đăng xuất. Vui lòng thử lại.");
                }
            }
        });
    }
});