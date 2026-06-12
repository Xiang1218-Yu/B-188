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
    initSurveyModule();
    
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

    // 问卷搜索监听
    document.getElementById('surveySearch').addEventListener('input', (e) => {
        surveyState.query = e.target.value;
        surveyState.currentPage = 1;
        renderSurveyTable();
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
                'customers': '客户管理',
                'surveys': '满意度调查'
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


// =====================================================
// 满意度调查模块
// =====================================================

// --- 问卷数据和状态 ---
// 从 localStorage 加载问卷数据，若无则使用示例数据
function loadSurveys() {
    const stored = localStorage.getItem('pdh_surveys');
    if (stored) {
        return JSON.parse(stored);
    }
    // 默认示例问卷数据
    return [
        {
            id: 'SV001',
            title: '2026年Q1客户满意度调查',
            description: '感谢您选择PDH Electronic，我们非常重视您的反馈，请花几分钟完成此问卷。',
            status: 'active',
            createdAt: '2026-03-15',
            questions: [
                { id: 'q1', type: 'rating', title: '您对我们产品质量的总体满意度', options: ['非常不满意','不满意','一般','满意','非常满意'] },
                { id: 'q2', type: 'rating', title: '您对我们售后服务响应速度的满意度', options: ['非常不满意','不满意','一般','满意','非常满意'] },
                { id: 'q3', type: 'rating', title: '您对我们产品性价比的评价', options: ['非常不满意','不满意','一般','满意','非常满意'] },
                { id: 'q4', type: 'single', title: '您是否会向同行推荐我们的产品？', options: ['一定会','可能会','不确定','应该不会','一定不会'] },
                { id: 'q5', type: 'text', title: '您对我们有哪些改进建议？' }
            ]
        },
        {
            id: 'SV002',
            title: '新产品试用反馈问卷',
            description: '请针对您近期试用的纳米涂层产品填写反馈，帮助我们改进产品。',
            status: 'closed',
            createdAt: '2026-02-01',
            questions: [
                { id: 'q1', type: 'rating', title: '试用产品的整体体验如何？', options: ['非常不满意','不满意','一般','满意','非常满意'] },
                { id: 'q2', type: 'single', title: '您是否愿意购买该产品？', options: ['愿意','需要考虑','不愿意'] },
                { id: 'q3', type: 'text', title: '请描述您在使用过程中遇到的问题' }
            ]
        }
    ];
}

// 从 localStorage 加载问卷回答数据
function loadSurveyResponses() {
    const stored = localStorage.getItem('pdh_survey_responses');
    if (stored) {
        return JSON.parse(stored);
    }
    // 默认示例回答数据
    return [
        { surveyId: 'SV001', submittedAt: '2026-03-16 10:23', answers: { q1: '满意', q2: '非常满意', q3: '一般', q4: '一定会', q5: '希望增加更多规格选择' } },
        { surveyId: 'SV001', submittedAt: '2026-03-17 14:05', answers: { q1: '非常满意', q2: '满意', q3: '满意', q4: '可能会', q5: '交货周期可以再缩短一些' } },
        { surveyId: 'SV001', submittedAt: '2026-03-18 09:12', answers: { q1: '一般', q2: '不满意', q3: '一般', q4: '不确定', q5: '售后响应太慢了' } },
        { surveyId: 'SV001', submittedAt: '2026-03-19 16:40', answers: { q1: '满意', q2: '满意', q3: '满意', q4: '一定会', q5: '' } },
        { surveyId: 'SV001', submittedAt: '2026-03-20 11:55', answers: { q1: '非常满意', q2: '非常满意', q3: '非常满意', q4: '一定会', q5: '继续保持优质服务' } },
        { surveyId: 'SV002', submittedAt: '2026-02-05 08:30', answers: { q1: '满意', q2: '愿意', q3: '暂无问题' } },
        { surveyId: 'SV002', submittedAt: '2026-02-06 15:22', answers: { q1: '一般', q2: '需要考虑', q3: '涂层附着力不够' } }
    ];
}

// 保存问卷数据到 localStorage
function saveSurveysToStorage() {
    localStorage.setItem('pdh_surveys', JSON.stringify(surveys));
}

// 保存回答数据到 localStorage
function saveResponsesToStorage() {
    localStorage.setItem('pdh_survey_responses', JSON.stringify(surveyResponses));
}

let surveys = loadSurveys();
let surveyResponses = loadSurveyResponses();

// 问卷列表分页和搜索状态
let surveyState = {
    currentPage: 1,
    itemsPerPage: 5,
    query: ''
};

// 当前创建问卷时的临时题目列表
let tempQuestions = [];

// 当前是否为编辑模式
let isEditingSurvey = false;

// 正在编辑的问卷ID
let editingSurveyId = null;

// --- 初始化问卷模块 ---
function initSurveyModule() {
    renderSurveyTable();
}

// --- 渲染问卷列表表格 ---
function renderSurveyTable() {
    const tbody = document.getElementById('surveyTableBody');
    tbody.innerHTML = '';

    // 根据搜索关键词过滤
    const filtered = surveys.filter(s =>
        s.title.includes(surveyState.query)
    );

    document.getElementById('surveyTotalCount').innerText = filtered.length;

    // 分页逻辑
    const start = (surveyState.currentPage - 1) * surveyState.itemsPerPage;
    const end = start + surveyState.itemsPerPage;
    const paginatedItems = filtered.slice(start, end);

    paginatedItems.forEach(s => {
        const tr = document.createElement('tr');
        // 统计该问卷的回收量
        const responseCount = surveyResponses.filter(r => r.surveyId === s.id).length;
        // 状态显示
        const statusClass = s.status === 'active' ? 'active' : 'inactive';
        const statusText = s.status === 'active' ? '进行中' : '已关闭';

        tr.innerHTML = `
            <td>#${s.id}</td>
            <td><strong>${s.title}</strong></td>
            <td>${s.questions.length}</td>
            <td>${responseCount}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${s.createdAt}</td>
            <td class="action-btns">
                <button class="edit" onclick="openSurveyEditModal('${s.id}')" title="编辑问卷"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="edit" onclick="openSurveySendModal('${s.id}')" title="发送问卷"><i class="fa-solid fa-paper-plane"></i></button>
                <button class="edit" onclick="openSurveyStatsModal('${s.id}')" title="查看统计"><i class="fa-solid fa-chart-bar"></i></button>
                <button class="edit" onclick="toggleSurveyStatus('${s.id}')" title="${s.status === 'active' ? '关闭问卷' : '开启问卷'}"><i class="fa-solid fa-${s.status === 'active' ? 'pause' : 'play'}"></i></button>
                <button class="delete" onclick="deleteSurvey('${s.id}')" title="删除"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderSurveyPagination(filtered.length);
}

// --- 渲染问卷分页 ---
function renderSurveyPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / surveyState.itemsPerPage);
    const container = document.getElementById('surveyPageBtns');
    container.innerHTML = '';

    // 上一页按钮
    const prevBtn = document.createElement('button');
    prevBtn.className = `page-btn ${surveyState.currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prevBtn.onclick = () => {
        if (surveyState.currentPage > 1) {
            surveyState.currentPage--;
            renderSurveyTable();
        }
    };
    container.appendChild(prevBtn);

    // 页码按钮
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${surveyState.currentPage === i ? 'active' : ''}`;
        btn.innerText = i;
        btn.onclick = () => {
            surveyState.currentPage = i;
            renderSurveyTable();
        };
        container.appendChild(btn);
    }

    // 下一页按钮
    const nextBtn = document.createElement('button');
    nextBtn.className = `page-btn ${surveyState.currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`;
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    nextBtn.onclick = () => {
        if (surveyState.currentPage < totalPages) {
            surveyState.currentPage++;
            renderSurveyTable();
        }
    };
    container.appendChild(nextBtn);

    // 更新分页文字
    const rangeStart = totalItems === 0 ? 0 : (surveyState.currentPage - 1) * surveyState.itemsPerPage + 1;
    const rangeEnd = Math.min(surveyState.currentPage * surveyState.itemsPerPage, totalItems);
    const paginationText = document.querySelector('#surveys-view .pagination span:first-child');
    paginationText.childNodes[0].nodeValue = `显示 ${rangeStart}-${rangeEnd} 条，共 `;
}

// --- 创建问卷弹窗 ---
window.openSurveyCreateModal = function() {
    isEditingSurvey = false;
    editingSurveyId = null;

    const modal = document.getElementById('surveyCreateModal');
    modal.classList.add('active');

    // 更新弹窗标题为创建模式
    document.getElementById('surveyModalTitle').innerHTML = '<i class="fa-solid fa-clipboard-list" style="color:var(--primary);"></i> 创建满意度问卷';

    // 重置表单
    document.getElementById('surveyTitle').value = '';
    document.getElementById('surveyDesc').value = '';

    // 初始化默认题目（满意度调查常用题目模板）
    tempQuestions = [
        { id: generateQuestionId(), type: 'rating', title: '您对我们产品/服务的总体满意度', options: ['非常不满意','不满意','一般','满意','非常满意'] },
        { id: generateQuestionId(), type: 'text', title: '您对我们有哪些改进建议？' }
    ];
    renderTempQuestions();
};

// --- 编辑问卷弹窗 ---
window.openSurveyEditModal = function(surveyId) {
    const survey = surveys.find(s => s.id === surveyId);
    if (!survey) return;

    isEditingSurvey = true;
    editingSurveyId = surveyId;

    const modal = document.getElementById('surveyCreateModal');
    modal.classList.add('active');

    // 更新弹窗标题为编辑模式
    document.getElementById('surveyModalTitle').innerHTML = '<i class="fa-solid fa-pen-to-square" style="color:var(--primary);"></i> 编辑满意度问卷';

    // 回填表单数据
    document.getElementById('surveyTitle').value = survey.title;
    document.getElementById('surveyDesc').value = survey.description || '';

    // 将问卷题目转换为临时题目格式
    tempQuestions = survey.questions.map(q => ({
        id: generateQuestionId(),
        type: q.type,
        title: q.title,
        options: q.options ? [...q.options] : []
    }));
    renderTempQuestions();
};

window.closeSurveyCreateModal = function() {
    document.getElementById('surveyCreateModal').classList.remove('active');
};

// 生成题目临时ID
function generateQuestionId() {
    return 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
}

// --- 渲染创建问卷中的题目列表 ---
function renderTempQuestions() {
    const container = document.getElementById('surveyQuestionsContainer');
    container.innerHTML = '';

    tempQuestions.forEach((q, index) => {
        const div = document.createElement('div');
        div.className = 'survey-question-item';
        div.innerHTML = `
            <div class="survey-question-header">
                <span class="survey-question-number">第 ${index + 1} 题</span>
                <div class="survey-question-actions">
                    <button type="button" onclick="moveSurveyQuestion(${index}, -1)" title="上移" ${index === 0 ? 'disabled' : ''}><i class="fa-solid fa-arrow-up"></i></button>
                    <button type="button" onclick="moveSurveyQuestion(${index}, 1)" title="下移" ${index === tempQuestions.length - 1 ? 'disabled' : ''}><i class="fa-solid fa-arrow-down"></i></button>
                    <button type="button" onclick="removeSurveyQuestion(${index})" title="删除题目"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
            <div class="form-group">
                <label>题目标题</label>
                <input type="text" value="${q.title}" onchange="updateTempQuestionTitle(${index}, this.value)" placeholder="请输入题目标题">
            </div>
            <div class="form-group">
                <label>题目类型</label>
                <select onchange="updateTempQuestionType(${index}, this.value)">
                    <option value="rating" ${q.type === 'rating' ? 'selected' : ''}>评分题（满意度等级）</option>
                    <option value="single" ${q.type === 'single' ? 'selected' : ''}>单选题</option>
                    <option value="text" ${q.type === 'text' ? 'selected' : ''}>文本题（开放问答）</option>
                </select>
            </div>
            ${q.type !== 'text' ? `
            <div class="form-group">
                <label>选项（每行一个）</label>
                <textarea rows="${Math.min(q.options.length, 6)}" onchange="updateTempQuestionOptions(${index}, this.value)" placeholder="每行输入一个选项">${q.options.join('\n')}</textarea>
            </div>
            ` : ''}
        `;
        container.appendChild(div);
    });
}

// 添加新题目
window.addSurveyQuestion = function() {
    tempQuestions.push({
        id: generateQuestionId(),
        type: 'rating',
        title: '',
        options: ['非常不满意','不满意','一般','满意','非常满意']
    });
    renderTempQuestions();
    // 滚动到底部
    const container = document.getElementById('surveyQuestionsContainer');
    container.lastElementChild.scrollIntoView({ behavior: 'smooth' });
};

// 删除题目
window.removeSurveyQuestion = function(index) {
    tempQuestions.splice(index, 1);
    renderTempQuestions();
};

// 移动题目顺序
window.moveSurveyQuestion = function(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= tempQuestions.length) return;
    // 交换位置
    [tempQuestions[index], tempQuestions[newIndex]] = [tempQuestions[newIndex], tempQuestions[index]];
    renderTempQuestions();
};

// 更新题目标题
window.updateTempQuestionTitle = function(index, value) {
    tempQuestions[index].title = value;
};

// 更新题目类型
window.updateTempQuestionType = function(index, value) {
    tempQuestions[index].type = value;
    // 如果切换到评分题，设置默认选项
    if (value === 'rating') {
        tempQuestions[index].options = ['非常不满意','不满意','一般','满意','非常满意'];
    } else if (value === 'single') {
        tempQuestions[index].options = ['选项1','选项2','选项3'];
    }
    renderTempQuestions();
};

// 更新题目选项
window.updateTempQuestionOptions = function(index, value) {
    tempQuestions[index].options = value.split('\n').filter(o => o.trim() !== '');
};

// --- 保存问卷 ---
window.saveSurvey = function() {
    const title = document.getElementById('surveyTitle').value.trim();
    const desc = document.getElementById('surveyDesc').value.trim();

    // 校验标题
    if (!title) {
        showToast('请填写问卷标题', 'error');
        return;
    }

    // 校验题目完整性
    for (let i = 0; i < tempQuestions.length; i++) {
        if (!tempQuestions[i].title.trim()) {
            showToast(`第 ${i + 1} 题标题不能为空`, 'error');
            return;
        }
        if (tempQuestions[i].type !== 'text' && tempQuestions[i].options.length === 0) {
            showToast(`第 ${i + 1} 题至少需要一个选项`, 'error');
            return;
        }
    }

    if (tempQuestions.length === 0) {
        showToast('请至少添加一道题目', 'error');
        return;
    }

    if (isEditingSurvey && editingSurveyId) {
        // 编辑模式：更新已有问卷
        const index = surveys.findIndex(s => s.id === editingSurveyId);
        if (index !== -1) {
            surveys[index].title = title;
            surveys[index].description = desc;
            surveys[index].questions = tempQuestions.map((q, i) => ({
                id: 'q' + (i + 1),
                type: q.type,
                title: q.title,
                options: q.type !== 'text' ? q.options : undefined
            }));
            saveSurveysToStorage();
            closeSurveyCreateModal();
            renderSurveyTable();
            showToast('问卷已更新', 'success');
        }
    } else {
        // 创建模式：新建问卷
        const newId = 'SV' + String(surveys.length + 1).padStart(3, '0');

        const survey = {
            id: newId,
            title: title,
            description: desc,
            status: 'active',
            createdAt: new Date().toLocaleDateString('zh-CN'),
            questions: tempQuestions.map((q, i) => ({
                id: 'q' + (i + 1),
                type: q.type,
                title: q.title,
                options: q.type !== 'text' ? q.options : undefined
            }))
        };

        surveys.unshift(survey);
        saveSurveysToStorage();
        closeSurveyCreateModal();
        renderSurveyTable();
        showToast('问卷创建成功', 'success');
    }

    // 重置编辑状态
    isEditingSurvey = false;
    editingSurveyId = null;
};

// --- 发送问卷弹窗 ---
window.openSurveySendModal = function(surveyId) {
    const modal = document.getElementById('surveySendModal');
    modal.classList.add('active');

    // 生成问卷链接（指向 survey.html 并附带问卷ID参数）
    const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
    const link = baseUrl + 'survey.html?id=' + surveyId;
    document.getElementById('surveyLinkInput').value = link;
};

window.closeSurveySendModal = function() {
    document.getElementById('surveySendModal').classList.remove('active');
};

// 复制问卷链接到剪贴板
window.copySurveyLink = function() {
    const input = document.getElementById('surveyLinkInput');
    input.select();
    document.execCommand('copy');
    showToast('链接已复制到剪贴板', 'success');
};

// --- 切换问卷状态（开启/关闭） ---
window.toggleSurveyStatus = function(surveyId) {
    const survey = surveys.find(s => s.id === surveyId);
    if (!survey) return;
    survey.status = survey.status === 'active' ? 'closed' : 'active';
    saveSurveysToStorage();
    renderSurveyTable();
    showToast(survey.status === 'active' ? '问卷已开启' : '问卷已关闭', 'success');
};

// --- 删除问卷 ---
window.deleteSurvey = function(surveyId) {
    // 使用确认弹窗
    pendingDeleteId = surveyId;
    document.getElementById('confirmModal').classList.add('active');
    document.getElementById('confirmMessage').innerText = '确定要删除该问卷吗？所有相关回答数据也将被删除。';

    const actionBtn = document.getElementById('confirmActionBtn');
    const newBtn = actionBtn.cloneNode(true);
    actionBtn.parentNode.replaceChild(newBtn, actionBtn);

    newBtn.addEventListener('click', () => {
        // 删除问卷
        surveys = surveys.filter(s => s.id !== pendingDeleteId);
        // 同时删除该问卷的所有回答
        surveyResponses = surveyResponses.filter(r => r.surveyId !== pendingDeleteId);
        saveSurveysToStorage();
        saveResponsesToStorage();
        renderSurveyTable();
        closeConfirmModal();
        showToast('问卷已删除', 'warning');
    });
};

// --- 问卷统计弹窗 ---
window.openSurveyStatsModal = function(surveyId) {
    const modal = document.getElementById('surveyStatsModal');
    modal.classList.add('active');

    const survey = surveys.find(s => s.id === surveyId);
    if (!survey) return;

    // 获取该问卷的所有回答
    const responses = surveyResponses.filter(r => r.surveyId === surveyId);
    const content = document.getElementById('surveyStatsContent');

    // 构建统计内容
    let html = `
        <div class="survey-stats-header">
            <h2>${survey.title}</h2>
            <div class="survey-stats-summary">
                <div class="survey-stat-item">
                    <span class="survey-stat-value">${responses.length}</span>
                    <span class="survey-stat-label">总回收量</span>
                </div>
                <div class="survey-stat-item">
                    <span class="survey-stat-value">${survey.questions.length}</span>
                    <span class="survey-stat-label">题目数</span>
                </div>
                <div class="survey-stat-item">
                    <span class="survey-stat-value">${survey.status === 'active' ? '进行中' : '已关闭'}</span>
                    <span class="survey-stat-label">状态</span>
                </div>
            </div>
        </div>
    `;

    // 逐题统计
    survey.questions.forEach((question, qIndex) => {
        html += `<div class="survey-stats-question">`;
        html += `<h4>${qIndex + 1}. ${question.title}</h4>`;

        if (question.type === 'text') {
            // 文本题：列出所有回答
            html += `<div class="survey-text-answers">`;
            const textAnswers = responses.map(r => r.answers[question.id]).filter(a => a && a.trim());
            if (textAnswers.length === 0) {
                html += `<p class="no-data">暂无回答</p>`;
            } else {
                textAnswers.forEach(answer => {
                    html += `<div class="survey-text-answer-item"><i class="fa-solid fa-quote-left"></i> ${answer}</div>`;
                });
            }
            html += `</div>`;
        } else {
            // 评分题/单选题：统计各选项的选择人数和占比
            const optionCounts = {};
            const optionList = question.options || [];
            optionList.forEach(opt => { optionCounts[opt] = 0; });

            responses.forEach(r => {
                const answer = r.answers[question.id];
                if (answer && optionCounts.hasOwnProperty(answer)) {
                    optionCounts[answer]++;
                } else if (answer) {
                    optionCounts[answer] = (optionCounts[answer] || 0) + 1;
                }
            });

            const total = responses.length || 1; // 防止除零

            html += `<div class="survey-option-stats">`;
            optionList.forEach(opt => {
                const count = optionCounts[opt] || 0;
                const percent = Math.round((count / total) * 100);
                // 根据选项在列表中的位置确定颜色
                const colorIndex = optionList.indexOf(opt);
                const barColor = getBarColor(colorIndex, optionList.length);

                html += `
                    <div class="survey-option-row">
                        <span class="survey-option-label">${opt}</span>
                        <div class="survey-option-bar-bg">
                            <div class="survey-option-bar" style="width:${percent}%;background:${barColor};"></div>
                        </div>
                        <span class="survey-option-count">${count}票 (${percent}%)</span>
                    </div>
                `;
            });
            html += `</div>`;
        }

        html += `</div>`;
    });

    content.innerHTML = html;
};

window.closeSurveyStatsModal = function() {
    document.getElementById('surveyStatsModal').classList.remove('active');
};

// 根据选项索引获取柱状图颜色
function getBarColor(index, total) {
    // 使用预定义的渐变色系
    const colors = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#10b981', '#f59e0b', '#ef4444', '#64748b'];
    return colors[index % colors.length];
}
