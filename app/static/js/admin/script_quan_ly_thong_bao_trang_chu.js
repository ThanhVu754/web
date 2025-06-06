// app/static/js/admin/script_quan_ly_thong_bao_trang_chu.js
document.addEventListener('DOMContentLoaded', function() {
    console.log("Homepage Notification Management Script Loaded - API Integrated!");

    // DOM Elements
    const noticeSectionTitleInput = document.getElementById('noticeSectionTitle');
    const saveNoticeSettingsBtn = document.getElementById('saveNoticeSettingsBtn');
    
    const addNoticeItemBtn = document.getElementById('addNoticeItemBtn');
    const noticeItemsContainer = document.getElementById('noticeItemsContainer');
    
    // Nút "Lưu tất cả" không còn cần thiết với logic CRUD riêng lẻ
    const saveAllNoticeItemsBtn = document.getElementById('saveAllNoticeItemsBtn');
    if (saveAllNoticeItemsBtn) {
        saveAllNoticeItemsBtn.style.display = 'none'; 
    }

    let allNoticesData = []; // Để lưu trữ dữ liệu từ API

    // --- FETCH NOTICES FROM API ---
    async function fetchNotices() {
        console.log("Fetching notifications from API...");
        try {
            const response = await fetch('/admin/api/notifications');
            const data = await response.json();
            if (data.success && Array.isArray(data.notifications)) {
                allNoticesData = data.notifications;
                renderNoticeItems();
            } else {
                console.error("Failed to fetch notices:", data.message);
                if (noticeItemsContainer) noticeItemsContainer.innerHTML = `<p class="error-message">Không thể tải danh sách thông báo.</p>`;
            }
        } catch (error) {
            console.error("Error fetching notices (catch):", error);
            if (noticeItemsContainer) noticeItemsContainer.innerHTML = `<p class="error-message">Lỗi kết nối máy chủ.</p>`;
        }
    }

    // --- RENDER NOTICE ITEMS ---
    function renderNoticeItems() {
        if (!noticeItemsContainer) return;
        noticeItemsContainer.innerHTML = '';
        if (!allNoticesData || allNoticesData.length === 0) {
            noticeItemsContainer.innerHTML = '<p>Chưa có mục thông báo nào. Nhấn "Thêm mục thông báo" để bắt đầu.</p>';
            return;
        }

        allNoticesData.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'notice-item-admin';
            itemDiv.dataset.id = item.id;
            
            const textarea = document.createElement('textarea');
            textarea.rows = 3;
            textarea.value = item.content;
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'notice-item-actions';
            
            const saveItemBtn = document.createElement('button');
            saveItemBtn.className = 'btn btn-sm btn-save-notice-item';
            saveItemBtn.innerHTML = '<i class="fas fa-save"></i> Lưu'; 
            saveItemBtn.addEventListener('click', function() {
                updateNoticeItem(item.id, textarea.value);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-delete-notice';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Xóa';
            deleteBtn.addEventListener('click', function() {
                deleteNoticeItem(item.id);
            });
            
            actionsDiv.appendChild(saveItemBtn);
            actionsDiv.appendChild(deleteBtn);
            
            itemDiv.appendChild(textarea);
            itemDiv.appendChild(actionsDiv);
            noticeItemsContainer.appendChild(itemDiv);

            // Trigger input event để textarea tự điều chỉnh chiều cao ban đầu
            textarea.dispatchEvent(new Event('input'));
        });
    }

    // --- ADD, UPDATE, DELETE NOTICE ITEMS VIA API ---
    async function addNoticeItem() {
        const newContent = prompt("Nhập nội dung cho thông báo mới:", "");
        if (newContent && newContent.trim() !== '') {
            try {
                const response = await fetch('/admin/api/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: newContent.trim() }) // API cần 'content'
                });
                const result = await response.json();
                if (response.ok && result.success) {
                    alert(result.message || "Thêm thông báo thành công!");
                    fetchNotices(); // Tải lại danh sách
                } else {
                    alert("Lỗi khi thêm: " + (result.message || "Thao tác thất bại."));
                }
            } catch (error) {
                console.error("Lỗi khi thêm thông báo:", error);
                alert("Lỗi kết nối khi thêm thông báo.");
            }
        }
    }

    async function updateNoticeItem(id, newContent) {
        if (!newContent || newContent.trim() === '') {
            alert("Nội dung không được để trống.");
            return;
        }
        console.log(`Updating notice ID ${id} with content: ${newContent}`);
        try {
            const response = await fetch(`/admin/api/notifications/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newContent.trim() }) // API cần 'content'
            });
            const result = await response.json();
            if (response.ok && result.success) {
                alert(result.message || `Đã cập nhật thông báo ID ${id}.`);
                // Không cần gọi fetchNotices() ở đây vì chỉ cập nhật nội dung, không thay đổi thứ tự hay số lượng
            } else {
                alert("Lỗi khi cập nhật: " + (result.message || "Thao tác thất bại."));
                fetchNotices(); // Tải lại nếu có lỗi để đồng bộ
            }
        } catch (error) {
            console.error(`Lỗi khi cập nhật thông báo ID ${id}:`, error);
            alert(`Lỗi kết nối khi cập nhật thông báo ID ${id}.`);
        }
    }
    
    async function deleteNoticeItem(id) {
        if (confirm(`Bạn có chắc muốn xóa mục thông báo này (ID: ${id})?`)) {
            try {
                const response = await fetch(`/admin/api/notifications/${id}`, { method: 'DELETE' });
                const result = await response.json();
                if (response.ok && result.success) {
                    alert(result.message || `Đã xóa thông báo ID ${id}.`);
                    fetchNotices(); // Tải lại danh sách
                } else {
                    alert("Lỗi khi xóa: " + (result.message || "Không thể xóa thông báo."));
                }
            } catch (error) {
                console.error(`Lỗi khi xóa thông báo ID ${id}:`, error);
                alert(`Lỗi kết nối khi xóa thông báo ID ${id}.`);
            }
        }
    }
    
    // --- EVENT LISTENERS ---
    if (addNoticeItemBtn) {
        addNoticeItemBtn.addEventListener('click', addNoticeItem);
    }
    
    // Xử lý nút "Lưu Cài đặt chung" (Tiêu đề chính)
    if (saveNoticeSettingsBtn && noticeSectionTitleInput) {
        saveNoticeSettingsBtn.addEventListener('click', async function() {
            const title = noticeSectionTitleInput.value;
            console.log("Saving notice settings with title:", title);

            try {
                const response = await fetch('/admin/api/settings/homepage-notice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: title })
                });
                const result = await response.json();
                if (response.ok && result.success) {
                    alert(result.message || "Đã lưu cài đặt chung!");
                } else {
                    alert("Lỗi: " + (result.message || "Không thể lưu cài đặt."));
                }
            } catch (error) {
                console.error("Lỗi khi lưu cài đặt chung:", error);
                alert("Lỗi kết nối khi lưu cài đặt.");
            }
        });
    }

    // --- KHỞI TẠO BAN ĐẦU ---
    fetchNotices(); // Tải danh sách thông báo từ API khi trang được load
});