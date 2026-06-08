/**
 * Application Logic for Kunshan Piaodhua CRM
 * Handles Navigation, Data Management, Charts, and UI Interactions.
 */

// --- State and Mock Data ---
let customers = [
    { id: 1001, name: "上海精密电子科技有限公司", contact: "张墙", phone: "13800138000", region: "华东区", status: "Active" },
    { id: 1002, name: "苏州高新材料研究所", contact: "李娜", phone: "0512-68888888", region: "华东区", status: "Active" },
    { id: 1003, name: "深圳宏大智能装备", contact: "王强", phone: "13912345678", region: "华南区", status: "Inactive" },
    { id: 1004, name: "北京微芯半导体", contact: "赵敏", phone: "18600001111", region: "华北区", status: "Active" },
    { id: 1005, name: "TechGiant Global", contact: "Mike Smith", phone: "+1 202-555-0123", region: "海外", status: "Active" },
    // Mock More Data for Pagination
    { id: 1006, name: "南京紫金科技", contact: "孙权", phone: "13300002222", region: "华东区", status: "Active" },
    { id: 1007, name: "广州光电技术", contact: "刘备", phone: "13400003333", region: "华南区", status: "Active" },
    { id: 1008, name: "成都未来实验室", contact: "诸葛亮", phone: "13500004444", region: "华西区", status: "Inactive" },
    { id: 1009, name: "武汉光谷创新", contact: "周瑜", phone: "13600005555", region: "华中区", status: "Active" },
    { id: 1010, name: "西安航天动力", contact: "曹操", phone: "13700006666", region: "西北区", status: "Active" },
    { id: 1011, name: "杭州智汇云", contact: "鲁肃", phone: "13800007777", region: "华东区", status: "Active" },
    { id: 1012, name: "青岛海洋科技", contact: "关羽", phone: "13900008888", region: "华北区", status: "Inactive" }
];

let state = {
    currentPage: 1,
    itemsPerPage: 5,
    query: ''
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    // Set User Source
    const userName = localStorage.getItem('userName');
    if (userName) {
        document.querySelector('.user-info h4').innerText = userName;
    }

    initNavigation();
    initDashboard();
    renderCustomerTable();
    initCounters();
    initMobileMenu();
    
    // Set Date
    const today = new Date();
    document.getElementById('currentDate').innerText = today.toLocaleDateString('zh-CN', { 
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
    });

    // Search Listener
    document.getElementById('customerSearch').addEventListener('input', (e) => {
        state.query = e.target.value;
        state.currentPage = 1; // Reset to page 1 on search
        renderCustomerTable();
    });

    // Profile Click Feedback
    document.querySelector('.user-info-group').addEventListener('click', () => {
        showToast('用户中心正在开发中...', 'info');
    });

    // Logout Listener
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent bubbling if container has click
        logout();
    });

    // Pagination Feedback (Delegated in renderPagination now)
});


// --- Mobile Navigation ---
function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    
    // Create Overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    function toggleMenu() {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('active');
    }

    btn.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);
    
    // Close on nav item click
    sidebar.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if(window.innerWidth <= 768) {
                toggleMenu();
            }
        });
    });
}


// --- Navigation ---
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('pageTitle');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const target = item.getAttribute('data-tab');
            if (!target) return; // For dummy links

            e.preventDefault();
            
            // Update Nav State
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Update View
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(`${target}-view`).classList.add('active');

            // Update Title
            const titleMap = {
                'dashboard': '数据总览',
                'customers': '客户管理'
            };
            pageTitle.innerText = titleMap[target];
        });
    });
}

// --- Dashboard Functions ---
function initDashboard() {
    // Sales Chart (Line)
    const ctxSales = document.getElementById('salesChart').getContext('2d');
    new Chart(ctxSales, {
        type: 'line',
        data: {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
            datasets: [{
                label: '销售额 (万元)',
                data: [45, 52, 48, 64, 58, 68],
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // Customer Chart (Doughnut)
    const ctxCust = document.getElementById('customerChart').getContext('2d');
    new Chart(ctxCust, {
        type: 'doughnut',
        data: {
            labels: ['华东区', '华南区', '华北区', '海外'],
            datasets: [{
                data: [45, 25, 20, 10],
                backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#64748b']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function initCounters() {
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const duration = 2000; // ms
        const increment = target / (duration / 20);
        
        let current = 0;
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.innerText = Math.ceil(current);
                setTimeout(updateCounter, 20);
            } else {
                counter.innerText = target;
            }
        };
        updateCounter();
    });
}

// --- Customer Management ---
function renderCustomerTable() {
    const tbody = document.getElementById('customerTableBody');
    tbody.innerHTML = '';
    
    // Filter
    const filtered = customers.filter(c => 
        c.name.includes(state.query) || c.contact.includes(state.query)
    );

    document.getElementById('totalCount').innerText = filtered.length;

    // Pagination Logic
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    const paginatedItems = filtered.slice(start, end);

    paginatedItems.forEach(c => {
        const tr = document.createElement('tr');
        const statusClass = c.status === 'Active' ? 'active' : 'inactive';
        const statusText = c.status === 'Active' ? '合作中' : '已暂停';
        
        tr.innerHTML = `
            <td>#${c.id}</td>
            <td><strong>${c.name}</strong></td>
            <td>${c.contact}</td>
            <td>${c.phone}</td>
            <td>${c.region}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td class="action-btns">
                <button class="edit" onclick="openModal('edit', ${c.id})" title="编辑"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="delete" onclick="deleteCustomer(${c.id})" title="删除"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderPagination(filtered.length);
}

function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);
    const container = document.querySelector('.page-btns');
    container.innerHTML = '';

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.className = `page-btn ${state.currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prevBtn.onclick = () => {
        if (state.currentPage === 1) {
            showToast('已经是第一页了', 'info');
        } else {
            changePage(state.currentPage - 1);
        }
    };
    container.appendChild(prevBtn);

    // Number Buttons
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${state.currentPage === i ? 'active' : ''}`;
        btn.innerText = i;
        btn.onclick = () => changePage(i);
        container.appendChild(btn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = `page-btn ${state.currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`;
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    nextBtn.onclick = () => {
        if (state.currentPage === totalPages || totalPages === 0) {
            showToast('已经是最后一页了', 'info');
        } else {
            changePage(state.currentPage + 1);
        }
    };
    container.appendChild(nextBtn);

    // Update Text info
    const rangeStart = totalItems === 0 ? 0 : (state.currentPage - 1) * state.itemsPerPage + 1;
    const rangeEnd = Math.min(state.currentPage * state.itemsPerPage, totalItems);
    
    // Find text node in pagination container
    const paginationText = document.querySelector('.pagination span:first-child');
    // We need to keep the structure: <span>显示 1-10 条，共 <span id="totalCount">...</span> 条</span>
    // Easier to just update the text content if structure allows, but totalCount span is inside.
    // Let's rebuild the logic slightly or just update the text part.
    // Actually the span contains the totalCount span. 
    // Let's rewrite the span safely.
    paginationText.childNodes[0].nodeValue = `显示 ${rangeStart}-${rangeEnd} 条，共 `;
}

window.changePage = function(page) {
    const filteredCount = customers.filter(c => 
        c.name.includes(state.query) || c.contact.includes(state.query)
    ).length;
    const totalPages = Math.ceil(filteredCount / state.itemsPerPage);

    if (page < 1 || page > totalPages) return;
    
    state.currentPage = page;
    renderCustomerTable();
};

// --- Modal & Forms ---
let isEditing = false; // Add or Edit mode

window.openModal = function(mode, id = null) {
    const modal = document.getElementById('customerModal');
    const form = document.getElementById('customerForm');
    const title = document.getElementById('modalTitle');

    modal.classList.add('active');
    
    if (mode === 'edit' && id) {
        isEditing = true;
        title.innerText = '编辑客户信息';
        const customer = customers.find(c => c.id === id);
        
        // Populate Form
        document.getElementById('customerId').value = customer.id;
        document.getElementById('companyName').value = customer.name;
        document.getElementById('contact').value = customer.contact;
        document.getElementById('phone').value = customer.phone;
        document.getElementById('region').value = customer.region;
        
        // Update Custom Select UI
        document.querySelector('.custom-select .trigger-text').innerText = customer.region || '请选择区域';
        document.querySelectorAll('.custom-option').forEach(opt => {
            if(opt.dataset.value === customer.region) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
        
        // Radio value
        const radios = document.getElementsByName('status');
        radios.forEach(r => {
            if (r.value === customer.status) r.checked = true;
        });

    } else {
        form.reset();
        document.getElementById('customerId').value = '';
        
        // Reset Custom Select UI
        document.getElementById('region').value = '华东区'; // Default
        document.querySelector('.custom-select .trigger-text').innerText = '华东区';
        document.querySelectorAll('.custom-option').forEach(opt => {
            opt.classList.remove('selected');
            if(opt.dataset.value === '华东区') opt.classList.add('selected');
        });
    }
};

window.closeModal = function() {
    document.getElementById('customerModal').classList.remove('active');
};

// --- Custom Select Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.custom-select-wrapper');
    const select = wrapper.querySelector('.custom-select');
    const options = wrapper.querySelectorAll('.custom-option');
    const input = document.getElementById('region');
    const triggerText = wrapper.querySelector('.trigger-text');

    if (!wrapper || !select) return;

    // Toggle Dropdown
    select.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop bubbling to document
        select.classList.toggle('open');
    });

    // Select Option
    options.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = option.getAttribute('data-value');
            const text = option.innerText;

            // Update State
            input.value = value;
            triggerText.innerText = text;

            // Update Visuals
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');

            // Close
            select.classList.remove('open');
        });
    });

    // Close on Outside Click
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            select.classList.remove('open');
        }
    });
});

window.saveCustomer = function() {
    const id = document.getElementById('customerId').value;
    const name = document.getElementById('companyName').value;
    const contact = document.getElementById('contact').value;
    const phone = document.getElementById('phone').value;
    const region = document.getElementById('region').value;
    const status = document.querySelector('input[name="status"]:checked').value;

    if(!name || !contact || !phone) {
        showToast('请填写完整信息', 'error');
        return;
    }

    if (isEditing && id) {
        // Update
        const index = customers.findIndex(c => c.id == id);
        if (index !== -1) {
            customers[index] = { ...customers[index], name, contact, phone, region, status };
            showToast('客户信息已更新', 'success');
        }
    } else {
        // Create
        const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1001;
        customers.unshift({ id: newId, name, contact, phone, region, status });
        showToast('新客户已添加', 'success');
    }

    closeModal();
    renderCustomerTable();
};

// --- Custom Confirmation Modal ---
let pendingDeleteId = null;

window.openConfirmModal = function(id) {
    pendingDeleteId = id;
    document.getElementById('confirmModal').classList.add('active');
    
    // Set up action button
    const actionBtn = document.getElementById('confirmActionBtn');
    // Clear previous listeners to prevent stacking
    const newBtn = actionBtn.cloneNode(true);
    actionBtn.parentNode.replaceChild(newBtn, actionBtn);
    
    newBtn.addEventListener('click', () => {
        if(pendingDeleteId) {
            performDelete(pendingDeleteId);
        }
    });
};

window.closeConfirmModal = function() {
    document.getElementById('confirmModal').classList.remove('active');
    pendingDeleteId = null;
};

// Start Delete Flow
window.deleteCustomer = function(id) {
    openConfirmModal(id);
};

// Actual Delete Operation
function performDelete(id) {
    customers = customers.filter(c => c.id !== id);
    renderCustomerTable();
    showToast('客户已删除', 'warning');
    closeConfirmModal();
}

// --- Logout ---
window.logout = function() {
    showToast("您已退出登录")
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = 'login.html';
};


// --- Toast System ---
window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info-circle';
    if(type === 'success') icon = 'check-circle';
    if(type === 'error') icon = 'exclamation-circle';
    if(type === 'warning') icon = 'triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid fa-${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};
