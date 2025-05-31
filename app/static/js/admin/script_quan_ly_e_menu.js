document.addEventListener('DOMContentLoaded', function() {
    console.log("E-Menu Management Script Loaded!");

    const addMenuItemBtn = document.getElementById('addMenuItemBtn');
    const menuItemFormModal = document.getElementById('menuItemFormModal');
    const closeMenuItemModalBtn = document.getElementById('closeMenuItemModalBtn');
    const menuItemForm = document.getElementById('menuItemForm');
    const menuItemModalTitle = document.getElementById('menuItemModalTitle');
    const eMenuTableBody = document.getElementById('eMenuTableBody');
    const cancelMenuItemFormBtn = document.getElementById('cancelMenuItemFormBtn');
    const menuItemSearchInput = document.getElementById('menuItemSearchInput');
    const menuCategoryFilter = document.getElementById('menuCategoryFilter');
    const applyMenuItemFilterBtn = document.getElementById('applyMenuItemFilterBtn');
    const hiddenMenuItemId = document.getElementById('menuItemId');
    const imagePreview = document.getElementById('imagePreview');
    const menuItemImageURLInput = document.getElementById('menuItemImageURL');

    let editingMenuItemId = null;
    const LOCAL_STORAGE_KEY_EMENU = 'sangAirEMenuData';

    // Dữ liệu E-Menu mẫu mặc định
    let defaultMockEMenuItems = [
        { id: 1, name: 'Combo Cơm Thái + Nước + Trái cây', category: 'combo', imageURL: '/fontend/images/combo_com_thai.jpg', priceVND: 120000, priceUSD: 9.00, description: 'Cơm Thái cay nồng, nước suối mát lạnh và trái cây tươi.' },
        { id: 2, name: 'Combo Mì Ý + Nước + Trái cây', category: 'combo', imageURL: '/fontend/images/combo_mi_y.jpg', priceVND: 120000, priceUSD: 9.00, description: 'Mì Ý sốt bò bằm đậm đà, kèm nước và trái cây.' },
        { id: 3, name: 'Phở bò', category: 'do_an_nong', imageURL: '', priceVND: 80000, priceUSD: 4.00, description: 'Phở bò truyền thống với nước dùng thanh ngọt.' },
        { id: 4, name: 'Trà đào cam sả', category: 'do_uong', imageURL: '', priceVND: 50000, priceUSD: 2.00, description: 'Trà đào thơm lừng kết hợp vị cam sả tươi mát.' },
        { id: 5, name: 'Cơm rang dưa bò', category: 'combo', imageURL: '/fontend/images/com_rang_dua_bo.jpg', priceVND: 100000, priceUSD: 5.00, description: 'Cơm rang dưa bò chua ngọt, kèm nước và trái cây.' }
    ];

    let mockEMenuItems; // Sẽ được khởi tạo từ localStorage hoặc default

    const categoryNames = {
        "combo": "Combo",
        "do_an_nong": "Đồ ăn nóng",
        "do_uong": "Đồ uống",
        "mon_an_vat": "Món ăn vặt" // Thêm nếu có
    };

    // Load dữ liệu ban đầu từ localStorage hoặc dùng dữ liệu mặc định
    function loadInitialEMenuData() {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY_EMENU);
        if (storedData) {
            mockEMenuItems = JSON.parse(storedData);
            console.log("Đã tải dữ liệu E-Menu từ localStorage (Admin)");
        } else {
            mockEMenuItems = JSON.parse(JSON.stringify(defaultMockEMenuItems)); // Deep copy
            console.log("Sử dụng dữ liệu E-Menu mặc định (Admin)");
            saveEMenuToLocalStorage(); // Lưu dữ liệu mặc định nếu chưa có
        }
        renderEMenuTable(mockEMenuItems);
    }

    // Lưu toàn bộ mảng mockEMenuItems vào localStorage
    function saveEMenuToLocalStorage() {
        localStorage.setItem(LOCAL_STORAGE_KEY_EMENU, JSON.stringify(mockEMenuItems));
        console.log("Đã lưu dữ liệu E-Menu vào localStorage (Admin)");
    }

    // --- Helper Functions for Validation (giữ nguyên) ---
    function displayValidationError(inputId, message) {
        let errorElement = document.getElementById(inputId + '-error');
        const inputElement = document.getElementById(inputId);
        if (!inputElement) return; 

        if (!errorElement && inputElement.parentElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'validation-error-message'; 
            errorElement.id = inputId + '-error';
            inputElement.insertAdjacentElement('afterend', errorElement);
        }
        if (errorElement) errorElement.textContent = message;
    }

    function clearValidationErrors(form) {
        if (form) {
            form.querySelectorAll('.validation-error-message').forEach(el => el.textContent = '');
        }
    }

    function isValidURL(string) {
        if (!string) return true; 
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;  
        }
    }

    // --- Hiển thị danh sách món ăn (giữ nguyên) ---
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
            row.innerHTML = `
                <td>${item.id}</td>
                <td><img src="${item.imageURL || '/public/images/placeholder-food.png'}" alt="${item.name}" class="item-image-thumbnail"></td>
                <td>${item.name}</td>
                <td>${categoryNames[item.category] || item.category}</td>
                <td>${item.priceVND.toLocaleString('vi-VN')}</td>
                <td>${item.priceUSD ? item.priceUSD.toFixed(2) : 'N/A'}</td>
                <td class="item-description-short" title="${item.description || ''}">${descriptionShort}</td>
                <td class="btn-action-group">
                    <button class="btn btn-sm btn-edit-item" data-item-id="${item.id}"><i class="fas fa-edit"></i> Sửa</button>
                    <button class="btn btn-sm btn-delete-item" data-item-id="${item.id}"><i class="fas fa-trash"></i> Xóa</button>
                </td>
            `;
        });
        attachActionListenersToEMenuTable();
    }

    // --- Gắn Listener cho các nút trong bảng E-Menu (giữ nguyên) ---
    function attachActionListenersToEMenuTable() {
        if (!eMenuTableBody) return;
        eMenuTableBody.querySelectorAll('.btn-edit-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = parseInt(this.dataset.itemId);
                openMenuItemModal("Chỉnh sửa món ăn/đồ uống", itemId);
            });
        });
        eMenuTableBody.querySelectorAll('.btn-delete-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = parseInt(this.dataset.itemId);
                 if (confirm(`Bạn có chắc chắn muốn xóa mục này (ID: ${itemId}) không?`)) {
                    mockEMenuItems = mockEMenuItems.filter(item => item.id !== itemId);
                    saveEMenuToLocalStorage(); // Lưu sau khi xóa
                    alert(`Đã xóa mục ID ${itemId}`);
                    renderEMenuTable(mockEMenuItems);
                }
            });
        });
    }
    
    // --- Xem trước ảnh khi nhập URL (giữ nguyên) ---
    if (menuItemImageURLInput && imagePreview) {
        menuItemImageURLInput.addEventListener('input', function() {
            const url = this.value;
            if (isValidURL(url)) {
                imagePreview.src = url;
                imagePreview.style.display = 'block';
                imagePreview.onerror = function() { 
                    this.style.display = 'none';
                };
            } else {
                imagePreview.style.display = 'none';
            }
        });
    }

    // --- Mở/Đóng Modal (giữ nguyên, chỉ thay đổi display thành flex) ---
    function openMenuItemModal(title = "Thêm món mới", itemId = null) {
        if (!menuItemFormModal || !menuItemModalTitle || !menuItemForm) return;
        menuItemModalTitle.textContent = title;
        menuItemForm.reset(); 
        clearValidationErrors(menuItemForm); 
        if(imagePreview) imagePreview.style.display = 'none'; 
        if(hiddenMenuItemId) hiddenMenuItemId.value = ''; 
        editingMenuItemId = null;

        if (itemId) { 
            const itemToEdit = mockEMenuItems.find(item => item.id === itemId);
            if (itemToEdit) {
                editingMenuItemId = itemId;
                if(hiddenMenuItemId) hiddenMenuItemId.value = itemId;
                if(document.getElementById('menuItemName')) document.getElementById('menuItemName').value = itemToEdit.name;
                if(document.getElementById('menuItemCategory')) document.getElementById('menuItemCategory').value = itemToEdit.category;
                if(document.getElementById('menuItemImageURL')) document.getElementById('menuItemImageURL').value = itemToEdit.imageURL || '';
                if(document.getElementById('menuItemPriceVND')) document.getElementById('menuItemPriceVND').value = itemToEdit.priceVND;
                if(document.getElementById('menuItemPriceUSD')) document.getElementById('menuItemPriceUSD').value = itemToEdit.priceUSD || '';
                if(document.getElementById('menuItemDescription')) document.getElementById('menuItemDescription').value = itemToEdit.description || '';
                
                if (itemToEdit.imageURL && imagePreview && isValidURL(itemToEdit.imageURL)) {
                    imagePreview.src = itemToEdit.imageURL;
                    imagePreview.style.display = 'block';
                }
            } else {
                 alert("Không tìm thấy mục để sửa!");
                 return; 
            }
        }
        menuItemFormModal.style.display = 'flex'; // Đảm bảo là 'flex'
    }

    function closeMenuItemModal() {
        if (menuItemFormModal) menuItemFormModal.style.display = 'none';
    }

    if (addMenuItemBtn) {
        addMenuItemBtn.addEventListener('click', () => openMenuItemModal("Thêm món mới vào E-Menu"));
    }
    if (closeMenuItemModalBtn) {
        closeMenuItemModalBtn.addEventListener('click', closeMenuItemModal);
    }
    if (cancelMenuItemFormBtn) {
        cancelMenuItemFormBtn.addEventListener('click', closeMenuItemModal);
    }
    window.addEventListener('click', function(event) {
        if (event.target == menuItemFormModal) { 
            closeMenuItemModal();
        }
    });

    // --- Xử lý Form Thêm/Sửa Món Ăn (thêm saveEMenuToLocalStorage) ---
    if (menuItemForm) {
        menuItemForm.addEventListener('submit', function(event) {
            event.preventDefault();
            clearValidationErrors(menuItemForm); 
            let isValid = true;

            const name = document.getElementById('menuItemName').value.trim();
            const category = document.getElementById('menuItemCategory').value;
            const imageURL = document.getElementById('menuItemImageURL').value.trim();
            const priceVND = document.getElementById('menuItemPriceVND').value;
            const priceUSD = document.getElementById('menuItemPriceUSD').value;
            const description = document.getElementById('menuItemDescription').value.trim();
            
            if (name === '') {
                displayValidationError('menuItemName', 'Tên món là bắt buộc.');
                isValid = false;
            }
            if (category === '') {
                displayValidationError('menuItemCategory', 'Vui lòng chọn danh mục.');
                isValid = false;
            }
            if (imageURL !== '' && !isValidURL(imageURL)) {
                displayValidationError('menuItemImageURL', 'URL hình ảnh không hợp lệ.');
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
            
            if (!isValid) return;

            const itemData = {
                id: editingMenuItemId ? parseInt(editingMenuItemId) : null,
                name: name,
                category: category,
                imageURL: imageURL,
                priceVND: parseFloat(priceVND),
                priceUSD: priceUSD ? parseFloat(priceUSD) : null,
                description: description
            };

            if (editingMenuItemId) { 
                const index = mockEMenuItems.findIndex(item => item.id === editingMenuItemId);
                if (index !== -1) {
                    mockEMenuItems[index] = { ...mockEMenuItems[index], ...itemData };
                    alert("Đã cập nhật thông tin món!");
                }
            } else { 
                itemData.id = mockEMenuItems.length > 0 ? Math.max(...mockEMenuItems.map(item => item.id)) + 1 : 1;
                mockEMenuItems.push(itemData);
                alert("Đã thêm món mới thành công!");
            }
            
            saveEMenuToLocalStorage(); // Lưu sau khi thêm/sửa
            renderEMenuTable(mockEMenuItems);
            closeMenuItemModal();
        });
    }

    // --- Lọc và Tìm kiếm (giữ nguyên) ---
    function filterAndSearchMenuItems() {
        const searchTerm = menuItemSearchInput ? menuItemSearchInput.value.toLowerCase().trim() : '';
        const categoryTerm = menuCategoryFilter ? menuCategoryFilter.value : '';

        const filteredItems = mockEMenuItems.filter(item => {
            const matchesSearch = searchTerm === '' || item.name.toLowerCase().includes(searchTerm);
            const matchesCategory = categoryTerm === '' || item.category === categoryTerm;
            return matchesSearch && matchesCategory;
        });
        renderEMenuTable(filteredItems);
    }

    if (applyMenuItemFilterBtn) applyMenuItemFilterBtn.addEventListener('click', filterAndSearchMenuItems);
    
    // --- Khởi tạo ban đầu ---
    loadInitialEMenuData(); // Thay vì renderEMenuTable(mockEMenuItems);

});