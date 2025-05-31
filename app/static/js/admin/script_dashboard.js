document.addEventListener('DOMContentLoaded', function() {
    console.log("Admin Dashboard Script Loaded (Simplified)!");

    // Trong phiên bản đơn giản này, dashboard chủ yếu hiển thị thông tin tĩnh
    // hoặc thông tin sẽ được cập nhật từ backend khi render trang.
    // Nếu bạn cần cập nhật các con số bằng JavaScript (ví dụ: sau khi gọi API),
    // bạn sẽ viết mã đó ở đây.

    // Ví dụ, nếu bạn muốn lấy dữ liệu động cho các card:
    // function fetchDashboardStats() {
    //     // Giả sử gọi API
    //     // fetch('/api/admin/dashboard-stats')
    //     //     .then(response => response.json())
    //     //     .then(data => {
    //     //         const upcomingFlightsEl = document.getElementById('upcoming-flights-count');
    //     //         if (upcomingFlightsEl) upcomingFlightsEl.textContent = data.upcomingFlights || 'N/A';
                
    //     //         const newBookingsEl = document.getElementById('new-bookings-count');
    //     //         if (newBookingsEl) newBookingsEl.textContent = data.newBookingsToday || 'N/A';
                
    //     //         const newUsersEl = document.getElementById('new-users-count');
    //     //         if (newUsersEl) newUsersEl.textContent = data.newUsers || 'N/A';
                
    //     //         const monthlyRevenueEl = document.getElementById('monthly-revenue');
    //     //         if (monthlyRevenueEl) monthlyRevenueEl.textContent = data.monthlyRevenue ? data.monthlyRevenue.toLocaleString('vi-VN') + ' VND' : 'N/A';
    //     //     })
    //     //     .catch(error => console.error('Error fetching dashboard stats:', error));
    // }

    // fetchDashboardStats(); // Gọi hàm khi trang tải xong
});