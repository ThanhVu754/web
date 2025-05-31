document.addEventListener('DOMContentLoaded', function() {
    console.log("Báo cáo & Thống kê Script Loaded!");

    // DOM Elements
    const totalRevenueStatEl = document.getElementById('totalRevenueStat');
    const totalBookingsStatEl = document.getElementById('totalBookingsStat');
    const activeFlightsStatEl = document.getElementById('activeFlightsStat');
    const newCustomersStatEl = document.getElementById('newCustomersStat');
    const topRoutesTableBodyEl = document.getElementById('topRoutesTableBody');
    const reportDateRangeSelect = document.getElementById('reportDateRange');
    const applyReportFilterBtn = document.getElementById('applyReportFilterBtn');

    // Chart instances (để có thể destroy và vẽ lại)
    let revenueChartInstance = null;
    let bookingStatusChartInstance = null;

    // --- Mock Data (Lấy từ các file script khác hoặc định nghĩa lại ở đây) ---
    // Giả sử bạn có các mảng mockFlights, mockBookings, mockUsers đã được load từ localStorage
    // hoặc được định nghĩa trong một file chung. Để đơn giản, tôi sẽ định nghĩa lại một ít ở đây.
    
    // Lấy dữ liệu từ localStorage (nếu có)
    function getMockData(key, defaultValue = []) {
        const storedData = localStorage.getItem(key);
        try {
            return storedData ? JSON.parse(storedData) : defaultValue;
        } catch (e) {
            console.error(`Error parsing data from localStorage for key ${key}:`, e);
            return defaultValue;
        }
    }

    let mockFlights = getMockData('mockFlightsData', [ // Giả sử bạn lưu flights với key này
        { id: 1, flightNumber: 'SA101', departureAirport: 'HAN', arrivalAirport: 'SGN', departureDate: '2025-07-15', status: 'scheduled', totalSeats: 150, bookedSeats: 120 },
        { id: 2, flightNumber: 'SA202', departureAirport: 'SGN', arrivalAirport: 'DAD', departureDate: '2025-07-16', status: 'on-time', totalSeats: 180, bookedSeats: 150 },
        { id: 3, flightNumber: 'SA303', departureAirport: 'DAD', arrivalAirport: 'HAN', departureDate: '2025-07-17', status: 'scheduled', totalSeats: 160, bookedSeats: 160 },
    ]);

    let mockBookings = getMockData('sangAirBookingsData', [ // Giả sử bạn lưu bookings với key này
        { id: 'SANG1001', flightDate: '2025-07-15', totalAmount: 1500000, status: 'confirmed', itinerary: 'SGN → HAN', createdAt: '2025-07-01T10:00:00Z'},
        { id: 'SANG1002', flightDate: '2025-08-20', totalAmount: 950000, status: 'pending_payment', itinerary: 'DAD → SGN', createdAt: '2025-07-05T11:00:00Z'},
        { id: 'SANG1003', flightDate: '2025-09-01', totalAmount: 1200000, status: 'cancelled_by_user', itinerary: 'HAN → DAD', createdAt: '2025-06-20T12:00:00Z'},
        { id: 'SANG1004', flightDate: '2025-07-15', totalAmount: 1800000, status: 'confirmed', itinerary: 'SGN → HAN', createdAt: '2025-07-02T14:00:00Z'},
        { id: 'SANG1005', flightDate: '2025-07-16', totalAmount: 2200000, status: 'completed', itinerary: 'SGN → DAD', createdAt: '2025-07-03T15:00:00Z'},
    ]);
    
    let mockUsers = getMockData('sangAirUsersData', [ // Giả sử bạn lưu users với key này
        { id: 1, registeredDate: '2024-01-15' }, { id: 2, registeredDate: '2025-07-20' },
        { id: 3, registeredDate: '2025-06-10' }, { id: 4, registeredDate: '2025-07-01' },
    ]);


    function formatCurrency(amount) {
        return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    }

    // --- Functions to Calculate Stats ---
    function calculateOverviewStats(filteredBookings, filteredUsers, filteredFlights) {
        const totalRevenue = filteredBookings
            .filter(b => b.status === 'confirmed' || b.status === 'completed' || b.status === 'payment_received')
            .reduce((sum, b) => sum + b.totalAmount, 0);
        
        const totalBookings = filteredBookings.length;
        const activeFlights = filteredFlights.filter(f => f.status === 'scheduled' || f.status === 'on-time').length;
        const newCustomers = filteredUsers.length; // Giả sử filteredUsers đã được lọc theo ngày đăng ký

        if(totalRevenueStatEl) totalRevenueStatEl.textContent = formatCurrency(totalRevenue);
        if(totalBookingsStatEl) totalBookingsStatEl.textContent = totalBookings;
        if(activeFlightsStatEl) activeFlightsStatEl.textContent = activeFlights;
        if(newCustomersStatEl) newCustomersStatEl.textContent = newCustomers;
    }

    function getFilteredData(dateRange) {
        // Hàm này sẽ lọc mockBookings, mockUsers, mockFlights dựa trên dateRange
        // Hiện tại, để đơn giản, chúng ta sẽ trả về toàn bộ dữ liệu mẫu
        // Bạn cần triển khai logic lọc ngày tháng phức tạp hơn ở đây
        console.log("Lọc dữ liệu cho khoảng thời gian:", dateRange); 
        // Ví dụ đơn giản:
        // const today = new Date();
        // if (dateRange === 'today') {
        //    return mockBookings.filter(b => new Date(b.createdAt).toDateString() === today.toDateString());
        // }
        return {
            bookings: mockBookings,
            users: mockUsers, // Cần lọc user theo ngày đăng ký dựa trên dateRange
            flights: mockFlights // Cần lọc chuyến bay theo ngày bay/ngày tạo dựa trên dateRange
        };
    }


    // --- Chart Drawing Functions ---
    function drawRevenueChart(filteredBookings) {
        const ctx = document.getElementById('revenueChart')?.getContext('2d');
        if (!ctx) return;

        if (revenueChartInstance) {
            revenueChartInstance.destroy(); // Hủy biểu đồ cũ trước khi vẽ mới
        }
        // Chuẩn bị dữ liệu cho biểu đồ doanh thu (ví dụ: doanh thu theo ngày trong khoảng đã chọn)
        // Đây là ví dụ đơn giản, bạn cần tổng hợp dữ liệu phức tạp hơn
        const labels = ['Ngày 1', 'Ngày 2', 'Ngày 3', 'Ngày 4', 'Ngày 5', 'Ngày 6', 'Ngày 7']; // Cần động
        const data = [1200000, 1900000, 800000, 1700000, 2200000, 1500000, 2000000]; // Cần động

        revenueChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Doanh thu (VND)',
                    data: data,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    function drawBookingStatusChart(filteredBookings) {
        const ctx = document.getElementById('bookingStatusChart')?.getContext('2d');
        if (!ctx) return;

        if (bookingStatusChartInstance) {
            bookingStatusChartInstance.destroy();
        }
        const statusCounts = filteredBookings.reduce((acc, booking) => {
            acc[booking.status] = (acc[booking.status] || 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(statusCounts).map(status => statusMapping[status]?.text || status);
        const data = Object.values(statusCounts);
        const backgroundColors = [ // Thêm màu cho các trạng thái
            'rgba(40, 167, 69, 0.7)',  // confirmed
            'rgba(255, 193, 7, 0.7)', // pending_payment
            'rgba(23, 162, 184, 0.7)', // payment_received
            'rgba(220, 53, 69, 0.7)', // cancelled_by_user
            'rgba(108, 117, 125, 0.7)',// cancelled_by_admin
            'rgba(0, 123, 255, 0.7)', // completed
            'rgba(52, 58, 64, 0.7)'   // no_show
        ];


        bookingStatusChartInstance = new Chart(ctx, {
            type: 'pie', // Hoặc 'doughnut'
            data: {
                labels: labels,
                datasets: [{
                    label: 'Trạng thái Đặt chỗ',
                    data: data,
                    backgroundColor: backgroundColors.slice(0, data.length),
                    hoverOffset: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
    
    // --- Top Routes ---
    function displayTopRoutes(filteredBookings) {
        if (!topRoutesTableBodyEl) return;
        topRoutesTableBodyEl.innerHTML = '';

        const routeCounts = filteredBookings.reduce((acc, booking) => {
            if (booking.status === 'confirmed' || booking.status === 'completed') { // Chỉ tính các đặt chỗ thành công
                const route = booking.itinerary;
                acc[route] = (acc[route] || 0) + 1;
            }
            return acc;
        }, {});

        const sortedRoutes = Object.entries(routeCounts)
            .sort(([,a],[,b]) => b-a)
            .slice(0, 5); // Lấy top 5

        if (sortedRoutes.length === 0) {
            topRoutesTableBodyEl.innerHTML = '<tr><td colspan="3" style="text-align:center;">Chưa có dữ liệu chặng bay.</td></tr>';
            return;
        }
        
        sortedRoutes.forEach(([route, count], index) => {
            const row = topRoutesTableBodyEl.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${route}</td>
                <td>${count}</td>
            `;
        });
    }


    // --- Main Update Function ---
    function updateDashboard() {
        const selectedDateRange = reportDateRangeSelect ? reportDateRangeSelect.value : 'last30days';
        const { bookings, users, flights } = getFilteredData(selectedDateRange);

        calculateOverviewStats(bookings, users, flights);
        drawRevenueChart(bookings);
        drawBookingStatusChart(bookings);
        displayTopRoutes(bookings);
    }

    // --- Event Listeners ---
    if (applyReportFilterBtn) {
        applyReportFilterBtn.addEventListener('click', updateDashboard);
    }

    // --- Initial Load ---
    updateDashboard(); 

});