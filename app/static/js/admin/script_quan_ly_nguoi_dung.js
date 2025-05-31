document.addEventListener('DOMContentLoaded', function() {
    console.log("User Management Script Loaded with Enhanced Validation!");

    const addUserBtn = document.getElementById('addUserBtn');
    const userFormModal = document.getElementById('userFormModal');
    const closeUserModalBtn = document.getElementById('closeUserModalBtn');
    const userForm = document.getElementById('userForm');
    const userModalTitle = document.getElementById('userModalTitle');
    const usersTableBody = document.getElementById('usersTableBody');
    // const saveUserBtn = document.getElementById('saveUserBtn'); // Không cần nếu listener gắn vào form
    const cancelUserFormBtn = document.getElementById('cancelUserFormBtn');
    const userSearchInput = document.getElementById('userSearchInput');
    const userStatusFilter = document.getElementById('userStatusFilter');
    const applyUserFilterBtn = document.getElementById('applyUserFilterBtn');
    const hiddenUserId = document.getElementById('userId'); 

    let editingUserId = null;

    let mockUsers = [
        { id: 1, fullName: 'Nguyễn Văn Admin', email: 'admin@sangair.com', phone: '0901234567', registeredDate: '2024-01-15', status: 'active', role: 'admin' },
        { id: 2, fullName: 'Trần Thị Khách Hàng', email: 'khachhang@example.com', phone: '0912345678', registeredDate: '2024-03-20', status: 'active', role: 'customer' },
        { id: 3, fullName: 'Lê Văn Bị Khóa', email: 'lockeduser@example.com', phone: '0987654321', registeredDate: '2024-02-10', status: 'locked', role: 'customer' },
        { id: 4, fullName: 'Phạm Thị Chờ', email: 'pending@example.com', phone: '0977123789', registeredDate: '2024-05-01', status: 'pending', role: 'customer' }
    ];

    const statusUserMapping = {
        "active": { text: "Hoạt động", class: "status-active" },
        "locked": { text: "Bị khóa", class: "status-locked" },
        "pending": { text: "Chờ kích hoạt", class: "status-pending" }
    };

    // --- Helper Functions for Validation ---
    function displayValidationError(inputId, message) {
        let errorElement = document.getElementById(inputId + '-error');
        const inputElement = document.getElementById(inputId);
        if (!inputElement) return; // Thoát nếu không tìm thấy input

        if (!errorElement && inputElement.parentElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'validation-error-message'; 
            errorElement.id = inputId + '-error';
            // Chèn ngay sau input, hoặc sau một wrapper của input nếu có
            inputElement.insertAdjacentElement('afterend', errorElement);
        }
        if (errorElement) {
            errorElement.textContent = message;
        }
         // Tùy chọn: Thêm class lỗi vào input để style viền đỏ
        // inputElement.classList.add('has-error');
    }

    function clearValidationErrors(form) {
        form.querySelectorAll('.validation-error-message').forEach(el => el.textContent = '');
        // Tùy chọn: Xóa class lỗi khỏi các input
        // form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isValidPhone(phone) {
        if (!phone) return true; 
        const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})\b$/; // Regex cơ bản cho SĐT Việt Nam
        return phoneRegex.test(phone);
    }


    // --- Hiển thị danh sách người dùng ---
    function renderUsersTable(usersToRender) {
        if (!usersTableBody) return;
        usersTableBody.innerHTML = ''; 
        if (!usersToRender || usersToRender.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có người dùng nào.</td></tr>';
            return;
        }
        usersToRender.forEach(user => {
            const row = usersTableBody.insertRow();
            const statusInfo = statusUserMapping[user.status] || { text: user.status, class: '' };
            const lockButtonText = user.status === 'locked' ? 'Mở khóa' : 'Khóa';
            const lockButtonClass = user.status === 'locked' ? 'unlock' : '';
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.fullName}</td>
                <td>${user.email}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>${user.registeredDate}</td>
                <td><span class="status-user ${statusInfo.class}">${statusInfo.text}</span></td>
                <td class="btn-action-group">
                    <button class="btn btn-sm btn-edit-user" data-user-id="${user.id}"><i class="fas fa-edit"></i> Sửa</button>
                    <button class="btn btn-sm btn-lock-user ${lockButtonClass}" data-user-id="${user.id}" data-current-status="${user.status}"><i class="fas ${user.status === 'locked' ? 'fa-unlock' : 'fa-lock'}"></i> ${lockButtonText}</button>
                    <button class="btn btn-sm btn-delete-user" data-user-id="${user.id}"><i class="fas fa-trash"></i> Xóa</button>
                </td>
            `;
        });
        attachActionListenersToUserTable();
    }

    // --- Gắn Listener cho các nút trong bảng Users ---
    function attachActionListenersToUserTable() {
        usersTableBody.querySelectorAll('.btn-edit-user').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.dataset.userId);
                openUserModal("Chỉnh sửa thông tin người dùng", userId);
            });
        });
        usersTableBody.querySelectorAll('.btn-lock-user').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.dataset.userId);
                const currentStatus = this.dataset.currentStatus;
                const newStatus = currentStatus === 'locked' ? 'active' : 'locked';
                const actionText = currentStatus === 'locked' ? 'mở khóa' : 'khóa';
                if (confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản người dùng ID ${userId} không?`)) {
                    const userIndex = mockUsers.findIndex(u => u.id === userId);
                    if (userIndex > -1) {
                        mockUsers[userIndex].status = newStatus;
                        renderUsersTable(mockUsers);
                        alert(`Đã ${actionText} tài khoản ID ${userId}.`);
                    }
                }
            });
        });
        usersTableBody.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.dataset.userId);
                 if (confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN người dùng ID ${userId} không? Thao tác này không thể hoàn tác!`)) {
                    mockUsers = mockUsers.filter(u => u.id !== userId);
                    alert(`Đã xóa người dùng ID ${userId}`);
                    renderUsersTable(mockUsers);
                }
            });
        });
    }

    // --- Mở/Đóng Modal ---
    function openUserModal(title = "Thêm người dùng mới", userId = null) {
        if (!userFormModal || !userModalTitle || !userForm) return;
        userModalTitle.textContent = title;
        userForm.reset(); 
        clearValidationErrors(userForm); 
        hiddenUserId.value = ''; 
        editingUserId = null;

        const passwordInput = document.getElementById('userPassword'); 

        if (userId) { 
            const userToEdit = mockUsers.find(u => u.id === userId);
            if (userToEdit) {
                editingUserId = userId;
                hiddenUserId.value = userId;
                document.getElementById('userFullName').value = userToEdit.fullName;
                document.getElementById('userEmail').value = userToEdit.email;
                document.getElementById('userPhone').value = userToEdit.phone || '';
                document.getElementById('userStatus').value = userToEdit.status;
                if (passwordInput) passwordInput.placeholder = "Để trống nếu không đổi mật khẩu";
            } else {
                 alert("Không tìm thấy người dùng để sửa!");
                 return; 
            }
        } else { 
             if (passwordInput) passwordInput.placeholder = "Nhập mật khẩu (ít nhất 6 ký tự)";
        }
        userFormModal.style.display = 'flex';
    }

    function closeUserModal() {
        if (userFormModal) userFormModal.style.display = 'none';
    }

    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => openUserModal("Thêm người dùng mới"));
    }
    if (closeUserModalBtn) {
        closeUserModalBtn.addEventListener('click', closeUserModal);
    }
    if (cancelUserFormBtn) {
        cancelUserFormBtn.addEventListener('click', closeUserModal);
    }
    window.addEventListener('click', function(event) {
        if (event.target == userFormModal) {
            closeUserModal();
        }
    });

    // --- Xử lý Form Thêm/Sửa Người Dùng với VALIDATE CHI TIẾT HƠN ---
    if (userForm) {
        userForm.addEventListener('submit', function(event) {
            event.preventDefault();
            clearValidationErrors(userForm); 
            let isValid = true;

            const fullNameInput = document.getElementById('userFullName');
            const emailInput = document.getElementById('userEmail');
            const phoneInput = document.getElementById('userPhone');
            const statusInput = document.getElementById('userStatus');
            const passwordInput = document.getElementById('userPassword');
            
            const fullName = fullNameInput.value.trim();
            const email = emailInput.value.trim();
            const phone = phoneInput.value.trim();
            const status = statusInput.value;
            const password = passwordInput.value; 
            const currentUserId = editingUserId ? parseInt(editingUserId) : null;

            if (fullName === '') {
                displayValidationError('userFullName', 'Họ và tên là bắt buộc.');
                isValid = false;
            }

            if (email === '') {
                displayValidationError('userEmail', 'Email là bắt buộc.');
                isValid = false;
            } else if (!isValidEmail(email)) {
                displayValidationError('userEmail', 'Định dạng email không hợp lệ.');
                isValid = false;
            } else {
                const emailExists = mockUsers.some(user => user.email.toLowerCase() === email.toLowerCase() && user.id !== currentUserId);
                if (emailExists) {
                    displayValidationError('userEmail', 'Email này đã được sử dụng.');
                    isValid = false;
                }
            }

            if (phone !== '' && !isValidPhone(phone)) {
                displayValidationError('userPhone', 'Số điện thoại không hợp lệ (VD: 09xxxxxxxx).');
                isValid = false;
            }

            if (!currentUserId && password === '') { 
                displayValidationError('userPassword', 'Mật khẩu là bắt buộc khi thêm người dùng mới.');
                isValid = false;
            } else if (password !== '' && password.length < 6) { 
                displayValidationError('userPassword', 'Mật khẩu phải có ít nhất 6 ký tự.');
                isValid = false;
            }
            
            if (!isValid) {
                return; 
            }

            const userData = {
                id: currentUserId,
                fullName: fullName,
                email: email,
                phone: phone,
                status: status,
            };

            if (currentUserId) { 
                const index = mockUsers.findIndex(u => u.id === currentUserId);
                if (index !== -1) {
                    const updatedData = { ...mockUsers[index], ...userData };
                    if (password) { 
                        updatedData.password = password; 
                        console.log("Mật khẩu sẽ được cập nhật (Lưu ý: Chỉ demo, cần hash ở backend)");
                    }
                    mockUsers[index] = updatedData;
                    alert("Đã cập nhật thông tin người dùng!");
                }
            } else { 
                userData.id = mockUsers.length > 0 ? Math.max(...mockUsers.map(u => u.id)) + 1 : 1;
                userData.registeredDate = new Date().toISOString().split('T')[0]; 
                userData.role = 'customer'; 
                userData.password = password; 
                mockUsers.push(userData);
                alert("Đã thêm người dùng mới thành công!");
            }
            
            renderUsersTable(mockUsers);
            closeUserModal();
        });
    }

    // --- Lọc và Tìm kiếm Người dùng ---
    function filterAndSearchUsers() {
        const searchTerm = userSearchInput ? userSearchInput.value.toLowerCase().trim() : '';
        const statusTerm = userStatusFilter ? userStatusFilter.value : '';
        const filteredUsers = mockUsers.filter(user => {
            const matchesSearch = searchTerm === '' ||
                                  user.fullName.toLowerCase().includes(searchTerm) ||
                                  user.email.toLowerCase().includes(searchTerm) ||
                                  (user.phone && user.phone.toLowerCase().includes(searchTerm));
            const matchesStatus = statusTerm === '' || user.status === statusTerm;
            return matchesSearch && matchesStatus;
        });
        renderUsersTable(filteredUsers);
    }

    if (applyUserFilterBtn) applyUserFilterBtn.addEventListener('click', filterAndSearchUsers);
    
    // --- Khởi tạo ban đầu ---
    renderUsersTable(mockUsers);

});