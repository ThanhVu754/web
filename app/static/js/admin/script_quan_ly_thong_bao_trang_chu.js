document.addEventListener('DOMContentLoaded', function() {
    console.log("Quản lý Thông báo Trang chủ Script Loaded!");

    const noticeSectionTitleInput = document.getElementById('noticeSectionTitle');
    const noticePlaneImageURLInput = document.getElementById('noticePlaneImageURL');
    const noticePlaneImagePreview = document.getElementById('noticePlaneImagePreview');
    const saveNoticeSettingsBtn = document.getElementById('saveNoticeSettingsBtn');
    
    const addNoticeItemBtn = document.getElementById('addNoticeItemBtn');
    const noticeItemsContainer = document.getElementById('noticeItemsContainer');
    const saveAllNoticeItemsBtn = document.getElementById('saveAllNoticeItemsBtn');

    const LOCAL_STORAGE_KEY_NOTICES = 'sangAirHomepageNotices';

    // Dữ liệu mặc định nếu không có gì trong localStorage
    let defaultSiteNotices = {
        title: "THÔNG BÁO",
        planeImageURL: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
        items: [
            { id: 1, content: "<strong>Quý hành khách lưu ý:</strong> Nội dung ví dụ cho thông báo đầu tiên." },
            { id: 2, content: "Cập nhật chính sách hành lý mới, vui lòng xem chi tiết." },
            { id: 3, content: "Mọi thông tin chi tiết, vui lòng liên hệ tổng đài 1900 1100." }
        ]
    };

    let siteNotices;

    // Load dữ liệu ban đầu từ localStorage hoặc dùng dữ liệu mặc định
    function loadInitialData() {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY_NOTICES);
        if (storedData) {
            siteNotices = JSON.parse(storedData);
            console.log("Đã tải dữ liệu thông báo từ localStorage (Admin)");
        } else {
            siteNotices = JSON.parse(JSON.stringify(defaultSiteNotices)); // Deep copy
            console.log("Sử dụng dữ liệu thông báo mặc định (Admin)");
        }
        
        if (noticeSectionTitleInput) noticeSectionTitleInput.value = siteNotices.title;
        if (noticePlaneImageURLInput) noticePlaneImageURLInput.value = siteNotices.planeImageURL;
        if (noticePlaneImagePreview) {
             noticePlaneImagePreview.src = siteNotices.planeImageURL || defaultSiteNotices.planeImageURL;
             noticePlaneImagePreview.onerror = function() { this.src = defaultSiteNotices.planeImageURL; }
        }
        renderNoticeItems();
    }

    // Lưu toàn bộ đối tượng siteNotices vào localStorage
    function saveNoticesToLocalStorage() {
        localStorage.setItem(LOCAL_STORAGE_KEY_NOTICES, JSON.stringify(siteNotices));
        console.log("Đã lưu dữ liệu thông báo vào localStorage (Admin)");
    }

    // Xem trước ảnh khi thay đổi URL
    if (noticePlaneImageURLInput && noticePlaneImagePreview) {
        noticePlaneImageURLInput.addEventListener('input', function() {
            noticePlaneImagePreview.src = this.value || defaultSiteNotices.planeImageURL;
            noticePlaneImagePreview.onerror = function() { this.src = defaultSiteNotices.planeImageURL; }
        });
    }

    // Lưu cài đặt chung
    if (saveNoticeSettingsBtn) {
        saveNoticeSettingsBtn.addEventListener('click', function() {
            siteNotices.title = noticeSectionTitleInput.value;
            siteNotices.planeImageURL = noticePlaneImageURLInput.value;
            saveNoticesToLocalStorage();
            alert("Đã lưu cài đặt chung cho khu vực thông báo!");
        });
    }

    // Hiển thị các mục thông báo
    function renderNoticeItems() {
        if (!noticeItemsContainer) return;
        noticeItemsContainer.innerHTML = '';
        siteNotices.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'notice-item-admin';
            itemDiv.dataset.id = item.id;
            
            const textarea = document.createElement('textarea');
            textarea.rows = 3;
            textarea.value = item.content;
            // Tự động điều chỉnh chiều cao của textarea
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight) + 'px';
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'notice-item-actions';
            
            const saveItemBtn = document.createElement('button'); // Đổi thành "Lưu"
            saveItemBtn.className = 'btn btn-sm btn-save-notice-item'; // Class mới
            saveItemBtn.innerHTML = '<i class="fas fa-save"></i> Lưu'; 
            saveItemBtn.addEventListener('click', function() {
                saveNoticeItem(item.id, textarea.value);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-delete-notice';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Xóa';
            deleteBtn.addEventListener('click', function() {
                deleteNoticeItem(item.id);
            });
            
            actionsDiv.appendChild(saveItemBtn); // Nút Lưu
            actionsDiv.appendChild(deleteBtn);
            
            itemDiv.appendChild(textarea);
            itemDiv.appendChild(actionsDiv);
            noticeItemsContainer.appendChild(itemDiv);
        });
    }

    // Thêm mục thông báo mới
    if (addNoticeItemBtn) {
        addNoticeItemBtn.addEventListener('click', function() {
            const newId = siteNotices.items.length > 0 ? Math.max(...siteNotices.items.map(i => i.id)) + 1 : 1;
            siteNotices.items.push({ id: newId, content: "Nội dung thông báo mới..." });
            saveNoticesToLocalStorage(); // Lưu ngay khi thêm
            renderNoticeItems(); // Vẽ lại
        });
    }

    // Lưu một mục thông báo (sửa trực tiếp)
    function saveNoticeItem(id, newContent) {
        const itemIndex = siteNotices.items.findIndex(i => i.id === id);
        if (itemIndex > -1) {
            siteNotices.items[itemIndex].content = newContent;
            saveNoticesToLocalStorage();
            alert(`Đã cập nhật mục thông báo ID: ${id}`);
        }
    }
    
    // Xóa mục thông báo
    function deleteNoticeItem(id) {
        if (confirm(`Bạn có chắc muốn xóa mục thông báo này (ID: ${id})?`)) {
            siteNotices.items = siteNotices.items.filter(i => i.id !== id);
            saveNoticesToLocalStorage();
            alert(`Đã xóa mục thông báo ID: ${id}`);
            renderNoticeItems();
        }
    }
    
    // Lưu tất cả các mục thông báo
    if (saveAllNoticeItemsBtn) {
        saveAllNoticeItemsBtn.addEventListener('click', function() {
            const itemDivs = noticeItemsContainer.querySelectorAll('.notice-item-admin');
            let changed = false;
            itemDivs.forEach((div) => {
                const itemId = parseInt(div.dataset.id);
                const textarea = div.querySelector('textarea');
                const itemIndex = siteNotices.items.findIndex(i => i.id === itemId);
                if (itemIndex > -1 && textarea && siteNotices.items[itemIndex].content !== textarea.value) {
                    siteNotices.items[itemIndex].content = textarea.value;
                    changed = true;
                }
            });
            if (changed) {
                saveNoticesToLocalStorage();
                alert("Đã lưu tất cả thay đổi cho các mục thông báo!");
            } else {
                alert("Không có thay đổi nào để lưu.");
            }
        });
    }

    // Khởi tạo
    loadInitialData();
    
    // Submenu trong sidebar (đã có trong script_admin_layout.js)
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (sidebarNav) {
        const hasSubmenuItems = sidebarNav.querySelectorAll('li.has-submenu > a');
        hasSubmenuItems.forEach(item => {
            item.addEventListener('click', function(e) {
                if (this.getAttribute('href') === '#') {
                    e.preventDefault();
                }
                const parentLi = this.parentElement;
                parentLi.classList.toggle('open');
            });
        });
    }
});