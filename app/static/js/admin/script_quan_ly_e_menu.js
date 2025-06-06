// app/static/js/admin/script_quan_ly_e_menu.js
document.addEventListener('DOMContentLoaded', function() {
    console.log("E-Menu Management Script Loaded - API Integrated!");

    // DOM Elements
    const addMenuItemBtn = document.getElementById('addMenuItemBtn');
    const menuItemFormModal = document.getElementById('menuItemFormModal');
    const closeMenuItemModalBtn = document.getElementById('closeMenuItemModalBtn');
    const menuItemForm = document.getElementById('menuItemForm'); // ID của form trong modal
    const menuItemModalTitle = document.getElementById('menuItemModalTitle');
    const eMenuTableBody = document.getElementById('eMenuTableBody');
    const cancelMenuItemFormBtn = document.getElementById('cancelMenuItemFormBtn');
    const menuItemSearchInput = document.getElementById('menuItemSearchInput');
    const menuCategoryFilter = document.getElementById('menuCategoryFilter');
    const applyMenuItemFilterBtn = document.getElementById('applyMenuItemFilterBtn');
    const hiddenMenuItemId = document.getElementById('menuItemId'); // input hidden
    const imagePreview = document.getElementById('imagePreview');
    const menuItemImageFileInput = document.getElementById('menuItemImageFile'); // Input file mới
    const menuItemImageURLInput = document.getElementById('menuItemImageURL'); // Input type="file"

    let editingMenuItemId = null;
    let allMenuItems = []; // Để lưu trữ dữ liệu từ API

    const categoryNames = {
        "combo": "Combo",
        "do_an_nong": "Đồ ăn nóng",
        "do_uong": "Đồ uống",
        "mon_an_vat": "Món ăn vặt"
    };

    // --- Helper Functions for Validation ---
    function displayValidationError(inputId, message) {
        let errorElement = document.getElementById(inputId + '-error');
        const inputElement = document.getElementById(inputId);
        if (!inputElement) {
             console.warn(`Validation: Input element with ID '${inputId}' not found.`);
             return;
        }
        // Tạo element lỗi nếu chưa có (giữ lại logic tạo của bạn nếu đã có)
        if (!errorElement && inputElement.parentElement) {
            const formGroup = inputElement.closest('.form-group');
            if (formGroup) {
                 errorElement = document.createElement('div');
                 errorElement.className = 'validation-error-message'; 
                 errorElement.id = inputId + '-error';
                 inputElement.insertAdjacentElement('afterend', errorElement);
            } else {
                inputElement.insertAdjacentHTML('afterend', `<span class="validation-error-message" id="${inputId}-error"></span>`);
                errorElement = document.getElementById(inputId + '-error');
            }
        }
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    function clearValidationErrors(form) {
        if (!form) return;
        form.querySelectorAll('.validation-error-message').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
    }

     // --- CẬP NHẬT HÀM XEM TRƯỚC ẢNH KHI CHỌN TỆP ---
    if (menuItemImageFileInput && imagePreview) {
        menuItemImageFileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                }
                reader.readAsDataURL(file);
            } else {
                imagePreview.style.display = 'none';
                imagePreview.src = '#';
            }
        });
    }

    // --- FETCH MENU ITEMS FROM API ---
    async function fetchMenuItems(searchTerm = '', categoryTerm = '') {
        console.log(`Fetching menu items with searchTerm: '${searchTerm}', category: '${categoryTerm}'`);
        let apiUrl = '/admin/api/menu-items?'; // API của admin
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (categoryTerm) params.append('category', categoryTerm);
        apiUrl += params.toString();

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            console.log("Response from fetchMenuItems API:", data);
            if (data.success && Array.isArray(data.menu_items)) {
                allMenuItems = data.menu_items;
                renderEMenuTable(allMenuItems);
            } else {
                if(eMenuTableBody) eMenuTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">${data.message || 'Không tải được dữ liệu E-Menu.'}</td></tr>`;
                console.error("Failed to fetch menu items:", data.message);
            }
        } catch (error) {
            if(eMenuTableBody) eMenuTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Lỗi kết nối máy chủ khi tải E-Menu.</td></tr>`;
            console.error("Error fetching menu items (catch):", error);
        }
    }

    // --- RENDER E-MENU TABLE ---
    function renderEMenuTable(itemsToRender) {
        if (!eMenuTableBody) return;
        eMenuTableBody.innerHTML = ''; 
        if (!itemsToRender || itemsToRender.length === 0) {
            eMenuTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Không có món ăn/đồ uống nào.</td></tr>';
            return;
        }

        itemsToRender.forEach(item => {
            const row = eMenuTableBody.insertRow();
            const descriptionShort = item.description ? (item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description) : 'N/A';
            const imageUrl = item.image_url || '/static/images/placeholder-food.png'; // Dùng ảnh placeholder nếu không có
            
            row.innerHTML = `
                <td>${item.id}</td>
                <td><img src="${imageUrl}" alt="${item.name}" class="item-image-thumbnail" onerror="this.onerror=null;this.src='/static/images/placeholder-food.png';"></td>
                <td>${item.name}</td>
                <td>${categoryNames[item.category] || item.category}</td>
                <td>${(item.price_vnd || 0).toLocaleString('vi-VN')}</td>
                <td>${item.price_usd ? item.price_usd.toFixed(2) : 'N/A'}</td>
                <td class="item-description-short" title="${item.description || ''}">${descriptionShort}</td>
                <td class="btn-action-group">
                    <button class="btn btn-sm btn-edit-item" data-item-id="${item.id}"><i class="fas fa-edit"></i> Sửa</button>
                    <button class="btn btn-sm btn-delete-item" data-item-id="${item.id}"><i class="fas fa-trash"></i> Xóa</button>
                </td>
            `;
        });
        attachActionListenersToEMenuTable();
    }

    // --- ATTACH ACTION LISTENERS TO E-MENU TABLE ---
    function attachActionListenersToEMenuTable() {
        if (!eMenuTableBody) return;
        eMenuTableBody.querySelectorAll('.btn-edit-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = parseInt(this.dataset.itemId);
                openMenuItemModal("Chỉnh sửa món ăn/đồ uống", itemId);
            });
        });
        eMenuTableBody.querySelectorAll('.btn-delete-item').forEach(btn => {
            btn.addEventListener('click', async function() { // Chuyển thành async
                const itemId = parseInt(this.dataset.itemId);
                const itemName = allMenuItems.find(item => item.id === itemId)?.name || `ID ${itemId}`;
                 if (confirm(`Bạn có chắc chắn muốn xóa món '${itemName}' không?`)) {
                    try {
                        const response = await fetch(`/admin/api/menu-items/${itemId}`, { method: 'DELETE' });
                        const result = await response.json();
                        if (response.ok && result.success) {
                            alert(result.message || `Đã xóa món ID ${itemId}`);
                            fetchMenuItems(menuItemSearchInput.value.trim(), menuCategoryFilter.value); // Tải lại
                        } else {
                             alert("Lỗi khi xóa: " + (result.message || "Không thể xóa món."));
                        }
                    } catch (error) {
                        console.error("Lỗi khi xóa món ăn:", error);
                        alert("Lỗi kết nối khi xóa món ăn.");
                    }
                }
            });
        });
    }
    
    // --- IMAGE PREVIEW (Giữ nguyên) ---
    if (menuItemImageURLInput && imagePreview) {
        menuItemImageURLInput.addEventListener('input', function() {
            const url = this.value;
            if (url && isValidURL(url)) { // Chỉ hiện preview nếu có URL và hợp lệ
                imagePreview.src = url;
                imagePreview.style.display = 'block';
                imagePreview.onerror = function() { 
                    this.src = '/static/images/placeholder-food.png'; // Hoặc ẩn đi: this.style.display = 'none';
                };
            } else if (!url) { // Nếu URL rỗng thì ẩn preview
                imagePreview.style.display = 'none';
                imagePreview.src = '#'; // Reset src
            } else { // URL không hợp lệ (nhưng không rỗng)
                imagePreview.style.display = 'none'; // Hoặc hiển thị ảnh báo lỗi
            }
        });
    }

    // --- MODAL HANDLING (E-MENU ITEM FORM) ---
    async function openMenuItemModal(title = "Thêm món mới", itemIdToEdit = null) {
        if (!menuItemFormModal || !menuItemModalTitle || !menuItemForm) return;
        menuItemModalTitle.textContent = title;
        menuItemForm.reset(); 
        clearValidationErrors(menuItemForm); 
        if(imagePreview) imagePreview.style.display = 'none'; 
        if(hiddenMenuItemId) hiddenMenuItemId.value = ''; 
        if(menuItemImageFileInput) menuItemImageFileInput.value = '';
        if(imagePreview) {
            imagePreview.style.display = 'none';
            imagePreview.src = '#';
        }
        
        if (itemIdToEdit) { 
            // Khi sửa, chúng ta sẽ tải thông tin món ăn,
            // và hiển thị ảnh hiện tại trong imagePreview từ URL đã lưu
            try {
                const response = await fetch(`/admin/api/menu-items/${itemIdToEdit}`);
                const data = await response.json();
                if (data.success && data.menu_item) {
                    const itemData = data.menu_item;
                    if(hiddenMenuItemId) hiddenMenuItemId.value = itemData.id;
                    document.getElementById('menuItemName').value = itemData.name;
                    document.getElementById('menuItemCategory').value = itemData.category;
                    document.getElementById('menuItemImageURL').value = itemData.image_url || '';
                    document.getElementById('menuItemPriceVND').value = itemData.price_vnd;
                    document.getElementById('menuItemPriceUSD').value = itemData.price_usd || '';
                    document.getElementById('menuItemDescription').value = itemData.description || '';
                    // Thêm is_available, display_order nếu form có
                    // document.getElementById('menuItemIsAvailable').checked = itemData.is_available == 1;
                    // document.getElementById('menuItemDisplayOrder').value = itemData.display_order;
                    
                    if (itemData.image_url && imagePreview && isValidURL(itemData.image_url)) {
                        imagePreview.src = data.menu_item.image_url;
                        imagePreview.style.display = 'block';
                    }
                } else {
                    alert("Lỗi tải thông tin món: " + (data.message || "Không tìm thấy."));
                    closeMenuItemModal(); return;
                }
            } catch (error) { /* ... */ closeMenuItemModal(); return;}
        }
        menuItemFormModal.style.display = 'flex';
    }

    function closeMenuItemModal() { /* ... giữ nguyên ... */ }
    // ... (event listeners cho các nút modal giữ nguyên) ...
    if (addMenuItemBtn) addMenuItemBtn.addEventListener('click', () => openMenuItemModal("Thêm món mới vào E-Menu"));
    if (closeMenuItemModalBtn) closeMenuItemModalBtn.addEventListener('click', closeMenuItemModal);
    if (cancelMenuItemFormBtn) cancelMenuItemFormBtn.addEventListener('click', closeMenuItemModal);
    window.addEventListener('click', (event) => { if (event.target == menuItemFormModal) closeMenuItemModal(); });


    // --- FORM SUBMISSION (CREATE/UPDATE MENU ITEM) ---
    if (menuItemForm) {
        menuItemForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            clearValidationErrors(menuItemForm); 
            let isValid = true;

            // 1. Lấy và Validate dữ liệu text (tương tự như cũ)
            const name = document.getElementById('menuItemName').value.trim();
            const category = document.getElementById('menuItemCategory').value;
            const priceVND = document.getElementById('menuItemPriceVND').value;
            const priceUSD = document.getElementById('menuItemPriceUSD').value;
            const description = document.getElementById('menuItemDescription').value.trim();
            
            // Input file
            const imageFileInput = document.getElementById('menuItemImageFile'); 
            const imageFile = imageFileInput ? imageFileInput.files[0] : null;

            if (name === '') {
                displayValidationError('menuItemName', 'Tên món là bắt buộc.');
                isValid = false;
            }
            if (category === '') {
                displayValidationError('menuItemCategory', 'Vui lòng chọn danh mục.');
                isValid = false;
            }
            if (priceVND === '' || parseFloat(priceVND) < 0) {
                displayValidationError('menuItemPriceVND', 'Giá VND là bắt buộc và không được âm.');
                isValid = false;
            }
            if (priceUSD !== '' && parseFloat(priceUSD) < 0) {
                displayValidationError('menuItemPriceUSD', 'Giá USD không được âm (nếu có nhập).');
                isValid = false;
            }
            // Thêm validation cho file ảnh nếu cần (ví dụ: kích thước)
            if (imageFile && imageFile.size > 2 * 1024 * 1024) { // Giới hạn 2MB
                displayValidationError('menuItemImageFile', 'Kích thước ảnh không được vượt quá 2MB.');
                isValid = false;
            }

            if (!isValid) {
                console.error("Validation failed. Form submission stopped.");
                return;
            }

            // 2. Tạo đối tượng FormData để gửi đi
            // FormData sẽ tự động lấy các trường có thuộc tính 'name' trong form
            const formData = new FormData(menuItemForm); 
            // JavaScript sẽ tự động thêm các trường:
            // menuItemId, menuItemName, menuItemCategory, menuItemPriceVND, 
            // menuItemPriceUSD, menuItemDescription, và menuItemImageFile (nếu có file được chọn)
            // Dựa trên thuộc tính 'name' của các input trong form HTML của bạn.
            // Hãy đảm bảo các input trong quan_ly_e_menu.html có các 'name' tương ứng.
            
            console.log("FormData created. Editing ID:", editingMenuItemId);
            // Bạn có thể xem nội dung FormData bằng cách lặp qua nó:
            // for (let [key, value] of formData.entries()) { 
            //   console.log(key, value);
            // }


            let url = '/admin/api/menu-items';
            let method = 'POST';

            if (editingMenuItemId) { 
                url = `/admin/api/menu-items/${editingMenuItemId}`;
                method = 'PUT';
                // Khi sửa, nếu người dùng không chọn file mới, 'menuItemImageFile' sẽ không có trong FormData.
                // Backend API (api_admin_update_menu_item) đã được thiết kế để chỉ cập nhật ảnh nếu có file mới được gửi lên.
            }

            try {
                // Khi dùng FormData với fetch, không cần đặt header 'Content-Type'.
                // Trình duyệt sẽ tự động đặt header đúng (multipart/form-data) cùng với boundary.
                const response = await fetch(url, {
                    method: method,
                    body: formData // Gửi FormData trực tiếp
                });

                const result = await response.json();
                console.log("API Response:", response.status, result);

                if (response.ok && result.success) {
                    alert(result.message || (editingMenuItemId ? "Cập nhật món thành công!" : "Thêm món mới thành công!"));
                    // Gọi hàm tải lại danh sách món ăn từ server
                    fetchMenuItems(
                        menuItemSearchInput ? menuItemSearchInput.value.trim() : '', 
                        menuCategoryFilter ? menuCategoryFilter.value : ''
                    ); 
                    closeMenuItemModal();
                } else {
                    alert("Lỗi: " + (result.message || "Thao tác không thành công."));
                }
            } catch (error) {
                console.error("Lỗi khi lưu món ăn:", error);
                alert("Lỗi kết nối máy chủ khi lưu món ăn.");
            }
        });
    }

     function closeMenuItemModal() {
        if (menuItemFormModal) {
            menuItemFormModal.style.display = 'none';
            console.log("E-Menu modal closed.");
        }
    }

    // --- GẮN SỰ KIỆN CHO CÁC NÚT ĐÓNG/MỞ MODAL ---

    // Mở modal khi nhấn "Thêm món mới" (Đã có, giữ nguyên)
    if (addMenuItemBtn) {
        addMenuItemBtn.addEventListener('click', () => openMenuItemModal("Thêm món mới vào E-Menu"));
    }

    // Đóng modal khi nhấn nút "X"
    if (closeMenuItemModalBtn) {
        closeMenuItemModalBtn.addEventListener('click', closeMenuItemModal);
    } else {
        console.warn("Element 'closeMenuItemModalBtn' not found.");
    }

    // Đóng modal khi nhấn nút "Hủy"
    if (cancelMenuItemFormBtn) {
        cancelMenuItemFormBtn.addEventListener('click', closeMenuItemModal);
    } else {
        console.warn("Element 'cancelMenuItemFormBtn' not found.");
    }

    // Đóng modal khi click ra vùng xám bên ngoài
    window.addEventListener('click', function(event) {
        if (event.target == menuItemFormModal) { 
            closeMenuItemModal();
        }
    });
    // --- Lọc và Tìm kiếm ---
    function filterAndSearchMenuItems() {
        const searchTerm = menuItemSearchInput ? menuItemSearchInput.value.trim() : '';
        const categoryTerm = menuCategoryFilter ? menuCategoryFilter.value : '';
        fetchMenuItems(searchTerm, categoryTerm); // Gọi API để lọc/tìm kiếm từ backend
    }

    if (applyMenuItemFilterBtn) applyMenuItemFilterBtn.addEventListener('click', filterAndSearchMenuItems);
    if (menuItemSearchInput) {
        menuItemSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') filterAndSearchMenuItems();
        });
    }
    if (menuCategoryFilter) menuCategoryFilter.addEventListener('change', filterAndSearchMenuItems);
    
    // --- Khởi tạo ban đầu ---
    fetchMenuItems(); // Tải danh sách món ăn từ API khi trang được load
});