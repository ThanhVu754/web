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
    const logoutButton = document.querySelector('.logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
                alert("Đã đăng xuất! (Đây là demo)");
                // window.location.href = '/login-admin.html'; // Ví dụ chuyển hướng
            }
        });
    }
});