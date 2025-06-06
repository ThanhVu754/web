// app/static/js/e_menu_script.js
document.addEventListener('DOMContentLoaded', function() {
    console.log("E-Menu Client Script Loaded - API Integrated!");

    const comboContainer = document.getElementById('e-menu-combos');
    const hotFoodContainer = document.getElementById('e-menu-hot-food');
    const drinksContainer = document.getElementById('e-menu-drinks');
    const snacksContainer = document.getElementById('e-menu-snacks');

    // --- HÀM TẠO CARD CHO MỘT MÓN ĂN ---
    function createMenuItemCard(item) {
        const card = document.createElement('div');
        card.className = 'menu-card';

        // Sử dụng image_url_full trả về từ API
        const imageUrl = item.image_url_full || '/static/images/placeholder-food.png';

        let pricesHTML = `<p>Giá: ${(item.price_vnd || 0).toLocaleString('vi-VN')} VND</p>`;
        if (item.price_usd) {
            pricesHTML += `<p>USD: $${item.price_usd.toFixed(2)}</p>`;
        }
        
        let descriptionHTML = '';
        if (item.description) {
            descriptionHTML = `<p class="item-card-description">${item.description}</p>`;
        }

        card.innerHTML = `
            <img src="${imageUrl}" alt="${item.name}" onerror="this.onerror=null;this.src='/static/images/placeholder-food.png';">
            <h3>${item.name}</h3>
            ${descriptionHTML}
            ${pricesHTML}
            <button class="select-btn" data-item-id="${item.id}" data-item-name="${item.name}">Chọn món</button>
        `;
        
        card.querySelector('.select-btn').addEventListener('click', function() {
             alert(`Bạn đã chọn: ${this.dataset.itemName}. Chức năng thêm vào đặt chỗ đang được phát triển!`);
        });

        return card;
    }

    // --- HÀM LẤY DỮ LIỆU TỪ API VÀ HIỂN THỊ ---
    async function populateEMenu() {
        // Xóa nội dung "Đang tải..."
        if(comboContainer) comboContainer.innerHTML = '';
        if(hotFoodContainer) hotFoodContainer.innerHTML = '';
        if(drinksContainer) drinksContainer.innerHTML = '';
        if(snacksContainer) snacksContainer.innerHTML = '';

        try {
            const response = await fetch('/api/menu-items'); // Gọi API của client
            const data = await response.json();
            console.log("E-Menu data from API:", data);

            if (data.success && Array.isArray(data.menu_items)) {
                let itemsFound = false;
                data.menu_items.forEach(item => {
                    const cardElement = createMenuItemCard(item);
                    itemsFound = true;
                    switch (item.category) {
                        case 'combo':
                            if(comboContainer) comboContainer.appendChild(cardElement);
                            break;
                        case 'do_an_nong':
                            if(hotFoodContainer) hotFoodContainer.appendChild(cardElement);
                            break;
                        case 'do_uong':
                            if(drinksContainer) drinksContainer.appendChild(cardElement);
                            break;
                        case 'mon_an_vat':
                            if(snacksContainer) snacksContainer.appendChild(cardElement);
                            break;
                        default:
                            console.warn("Không rõ danh mục:", item.category, "cho món:", item.name);
                    }
                });

                // Hiển thị thông báo nếu không có món nào trong một danh mục
                if(comboContainer && comboContainer.children.length === 0) comboContainer.innerHTML = '<p>Chưa có món nào trong danh mục này.</p>';
                if(hotFoodContainer && hotFoodContainer.children.length === 0) hotFoodContainer.innerHTML = '<p>Chưa có món nào trong danh mục này.</p>';
                if(drinksContainer && drinksContainer.children.length === 0) drinksContainer.innerHTML = '<p>Chưa có món nào trong danh mục này.</p>';
                if(snacksContainer && snacksContainer.children.length === 0) snacksContainer.innerHTML = '<p>Chưa có món nào trong danh mục này.</p>';

            } else {
                 console.error("API E-Menu không trả về dữ liệu thành công:", data.message);
            }
        } catch (error) {
            console.error("Lỗi khi tải E-Menu:", error);
            // Hiển thị lỗi trên tất cả các container
            const errorMsg = '<p>Không thể tải thực đơn. Vui lòng thử lại sau.</p>';
            if(comboContainer) comboContainer.innerHTML = errorMsg;
            if(hotFoodContainer) hotFoodContainer.innerHTML = errorMsg;
            if(drinksContainer) drinksContainer.innerHTML = errorMsg;
            if(snacksContainer) snacksContainer.innerHTML = errorMsg;
        }
    }

    // --- KHỞI TẠO ---
    populateEMenu();
});