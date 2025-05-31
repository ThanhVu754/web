document.addEventListener('DOMContentLoaded', function() {
    console.log("E-Menu Client Script Loaded!");

    const comboContainer = document.getElementById('e-menu-combos');
    const hotFoodContainer = document.getElementById('e-menu-hot-food');
    const drinksContainer = document.getElementById('e-menu-drinks');
    const snacksContainer = document.getElementById('e-menu-snacks'); // Container mới cho món ăn vặt

    const LOCAL_STORAGE_KEY_EMENU = 'sangAirEMenuData';

    // Dữ liệu mặc định nếu không có gì trong localStorage (phòng trường hợp admin chưa set)
    const defaultClientEMenuItems = [
        { id: 1, name: 'Combo Cơm Thái + Nước + Trái cây (Mặc định)', category: 'combo', imageURL: '/fontend/images/combo_com_thai.jpg', priceVND: 120000, priceUSD: 9.00, description: 'Cơm Thái cay nồng, nước suối mát lạnh và trái cây tươi.' },
        { id: 3, name: 'Phở bò (Mặc định)', category: 'do_an_nong', imageURL: '', priceVND: 80000, priceUSD: 4.00, description: 'Phở bò truyền thống với nước dùng thanh ngọt.' },
        { id: 4, name: 'Trà đào cam sả (Mặc định)', category: 'do_uong', imageURL: '', priceVND: 50000, priceUSD: 2.00, description: 'Trà đào thơm lừng kết hợp vị cam sả tươi mát.' }
    ];

    function createMenuItemCard(item) {
        const card = document.createElement('div');
        card.className = 'menu-card';

        const img = document.createElement('img');
        img.src = item.imageURL || '/public/images/placeholder-food.png'; // Ảnh placeholder nếu không có URL
        img.alt = item.name;
        img.onerror = function() { this.src = '/public/images/placeholder-food.png'; };


        const nameH3 = document.createElement('h3');
        nameH3.textContent = item.name;

        const priceVNDP = document.createElement('p');
        priceVNDP.textContent = `VNĐ: ${item.priceVND.toLocaleString('vi-VN')}`;
        
        let pricesHTML = `<p>Giá: ${item.priceVND.toLocaleString('vi-VN')} VND</p>`;
        if (item.priceUSD) {
            pricesHTML += `<p>USD: $${item.priceUSD.toFixed(2)}</p>`;
        }
        // Nếu có mô tả thì hiển thị
        let descriptionHTML = '';
        if (item.description) {
            descriptionHTML = `<p class="item-card-description">${item.description}</p>`;
        }


        const selectBtn = document.createElement('button');
        selectBtn.className = 'select-btn'; // Giả sử bạn có class này trong e_menu.css
        selectBtn.textContent = 'Chọn món';
        selectBtn.addEventListener('click', function() {
            alert(`Bạn đã chọn: ${item.name}. Chức năng này đang chờ kết nối backend!`);
        });

        card.innerHTML = `
            <img src="${item.imageURL || '/public/images/placeholder-food.png'}" alt="${item.name}" onerror="this.onerror=null;this.src='/public/images/placeholder-food.png';">
            <h3>${item.name}</h3>
            ${descriptionHTML}
            ${pricesHTML}
            <button class="select-btn" data-item-id="${item.id}">Chọn món</button>
        `;
        // Gắn sự kiện cho nút mới tạo
        card.querySelector('.select-btn').addEventListener('click', function() {
             alert(`Bạn đã chọn: ${item.name}. Chức năng này đang chờ kết nối backend!`);
        });

        return card;
    }

    function populateEMenu() {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY_EMENU);
        let menuItems = defaultClientEMenuItems; // Mặc định

        if (storedData) {
            try {
                menuItems = JSON.parse(storedData);
                console.log("Đã tải E-Menu từ localStorage (Client)", menuItems);
            } catch (e) {
                console.error("Lỗi parse E-Menu từ localStorage, sử dụng dữ liệu mặc định:", e);
                // menuItems vẫn là defaultClientEMenuItems
            }
        } else {
            console.log("Không có E-Menu trong localStorage, sử dụng dữ liệu mặc định (Client)");
        }

        // Xóa nội dung "Đang tải..."
        if(comboContainer) comboContainer.innerHTML = '';
        if(hotFoodContainer) hotFoodContainer.innerHTML = '';
        if(drinksContainer) drinksContainer.innerHTML = '';
        if(snacksContainer) snacksContainer.innerHTML = '';


        menuItems.forEach(item => {
            const cardElement = createMenuItemCard(item);
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
                case 'mon_an_vat': // Thêm case cho món ăn vặt
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

    }

    populateEMenu(); // Gọi hàm để hiển thị E-Menu
});