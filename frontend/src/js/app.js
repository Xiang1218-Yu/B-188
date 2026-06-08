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
                'customers': '客户管理',
                'surveys': '满意度调查'
            };
            pageTitle.innerText = titleMap[target];
            
            // 切换到问卷页面时渲染列表
            if (target === 'surveys') {
                renderSurveyTable();
            }
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
// 满意度调查问卷功能模块
// =====================================================

// --- 问卷数据状态 ---
let surveys = []; // 问卷列表
let surveyResponses = []; // 问卷回收数据
let currentSurveyId = null; // 当前操作的问卷ID
let additionalQuestionCount = 0; // 额外问题计数器
let surveyState = {
    currentPage: 1,
    itemsPerPage: 5,
    query: ''
};
let scoreDistributionChart = null; // 评分分布图表实例

// --- 初始化问卷模块 ---
document.addEventListener('DOMContentLoaded', () => {
    // 从 localStorage 加载问卷数据
    loadSurveysFromStorage();
    
    // 初始化导航标题映射
    const titleMap = {
        'dashboard': '数据总览',
        'customers': '客户管理',
        'surveys': '满意度调查'
    };
    // 注意：initNavigation 函数中已经有 titleMap，需要确保 surveys 已添加
    // 这里通过搜索框监听来初始化问卷列表
    
    // 问卷搜索监听
    const surveySearchInput = document.getElementById('surveySearch');
    if (surveySearchInput) {
        surveySearchInput.addEventListener('input', (e) => {
            surveyState.query = e.target.value;
            surveyState.currentPage = 1;
            renderSurveyTable();
        });
    }
});

// --- 从 localStorage 加载问卷数据 ---
function loadSurveysFromStorage() {
    try {
        const savedSurveys = localStorage.getItem('crm_surveys');
        const savedResponses = localStorage.getItem('crm_survey_responses');
        
        if (savedSurveys) {
            const parsed = JSON.parse(savedSurveys);
            // 数据校验：确保是数组且每个元素有基本属性
            if (Array.isArray(parsed)) {
                surveys = parsed.filter(s => s && typeof s === 'object' && s.id && s.name);
            } else {
                surveys = [];
            }
        }
        
        // 如果没有有效数据，初始化示例数据
        if (!surveys || surveys.length === 0) {
            surveys = [
                {
                    id: 'SV001',
                    name: '2026年第一季度客户满意度调查',
                    description: '感谢您参与本次满意度调查，您的反馈将帮助我们持续改进服务质量。',
                    questions: [
                        { id: 'q1', type: 'rating', text: '整体满意度评分（1-5分）' },
                        { id: 'q2', type: 'text', text: '您对我们产品最满意的地方是什么？' }
                    ],
                    createdAt: '2026-01-15 10:30:00',
                    status: 'active'
                }
            ];
            saveSurveysToStorage();
        }
        
        if (savedResponses) {
            const parsed = JSON.parse(savedResponses);
            // 数据校验
            if (Array.isArray(parsed)) {
                surveyResponses = parsed.filter(r => r && typeof r === 'object' && r.surveyId);
            } else {
                surveyResponses = [];
            }
        }
        
        // 如果没有有效回收数据，初始化示例数据
        if (!surveyResponses || surveyResponses.length === 0) {
            surveyResponses = [
                { id: 1, surveyId: 'SV001', score: 5, feedback: '产品质量很好，服务也很专业！', submittedAt: '2026-01-16 09:20:00' },
                { id: 2, surveyId: 'SV001', score: 4, feedback: '整体满意，希望交货速度能再快一些。', submittedAt: '2026-01-18 14:35:00' },
                { id: 3, surveyId: 'SV001', score: 5, feedback: '技术支持响应很快，问题解决及时。', submittedAt: '2026-01-20 11:10:00' },
                { id: 4, surveyId: 'SV001', score: 3, feedback: '产品还可以，但价格有点偏高。', submittedAt: '2026-01-22 16:45:00' },
                { id: 5, surveyId: 'SV001', score: 4, feedback: '合作愉快，期待长期合作。', submittedAt: '2026-01-23 08:50:00' }
            ];
            saveSurveyResponsesToStorage();
        }
    } catch (e) {
        console.error('加载问卷数据失败:', e);
        surveys = [];
        surveyResponses = [];
    }
}

// --- 保存问卷数据到 localStorage ---
function saveSurveysToStorage() {
    try {
        localStorage.setItem('crm_surveys', JSON.stringify(surveys));
    } catch (e) {
        console.error('保存问卷数据失败:', e);
    }
}

// --- 保存问卷回收数据到 localStorage ---
function saveSurveyResponsesToStorage() {
    try {
        localStorage.setItem('crm_survey_responses', JSON.stringify(surveyResponses));
    } catch (e) {
        console.error('保存问卷回收数据失败:', e);
    }
}

// --- 渲染问卷列表表格 ---
function renderSurveyTable() {
    const tbody = document.getElementById('surveyTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // 过滤搜索（添加防御性检查，避免数据异常时报错）
    const filtered = surveys.filter(s => {
        const surveyName = s.name || '';
        const query = surveyState.query || '';
        return surveyName.toLowerCase().includes(query.toLowerCase());
    });
    
    document.getElementById('surveyTotalCount').innerText = filtered.length;
    
    // 分页逻辑
    const start = (surveyState.currentPage - 1) * surveyState.itemsPerPage;
    const end = start + surveyState.itemsPerPage;
    const paginatedItems = filtered.slice(start, end);
    
    paginatedItems.forEach(survey => {
        // 计算该问卷的回收数量
        const responseCount = surveyResponses.filter(r => r.surveyId === survey.id).length;
        const statusClass = survey.status === 'active' ? 'active' : 'inactive';
        const statusText = survey.status === 'active' ? '进行中' : '已结束';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${survey.id}</td>
            <td><strong>${survey.name}</strong></td>
            <td>${survey.createdAt}</td>
            <td><span class="response-count">${responseCount} 份</span></td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td class="action-btns">
                <button class="edit" onclick="showSurveyLink('${survey.id}')" title="获取问卷链接">
                    <i class="fa-solid fa-link"></i>
                </button>
                <button class="edit" onclick="viewSurveyStats('${survey.id}')" title="查看统计">
                    <i class="fa-solid fa-chart-simple"></i>
                </button>
                <button class="delete" onclick="deleteSurvey('${survey.id}')" title="删除">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
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
    if (!container) return;
    
    container.innerHTML = '';
    
    // 上一页按钮
    const prevBtn = document.createElement('button');
    prevBtn.className = `page-btn ${surveyState.currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prevBtn.onclick = () => {
        if (surveyState.currentPage > 1) {
            changeSurveyPage(surveyState.currentPage - 1);
        } else {
            showToast('已经是第一页了', 'info');
        }
    };
    container.appendChild(prevBtn);
    
    // 页码按钮
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${surveyState.currentPage === i ? 'active' : ''}`;
        btn.innerText = i;
        btn.onclick = () => changeSurveyPage(i);
        container.appendChild(btn);
    }
    
    // 下一页按钮
    const nextBtn = document.createElement('button');
    nextBtn.className = `page-btn ${surveyState.currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`;
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    nextBtn.onclick = () => {
        if (surveyState.currentPage < totalPages) {
            changeSurveyPage(surveyState.currentPage + 1);
        } else {
            showToast('已经是最后一页了', 'info');
        }
    };
    container.appendChild(nextBtn);
    
    // 更新分页文本
    const rangeStart = totalItems === 0 ? 0 : (surveyState.currentPage - 1) * surveyState.itemsPerPage + 1;
    const rangeEnd = Math.min(surveyState.currentPage * surveyState.itemsPerPage, totalItems);
    const paginationText = document.querySelector('#surveys-view .pagination span:first-child');
    if (paginationText && paginationText.childNodes[0]) {
        paginationText.childNodes[0].nodeValue = `显示 ${rangeStart}-${rangeEnd} 条，共 `;
    }
}

// --- 切换问卷分页 ---
window.changeSurveyPage = function(page) {
    const filteredCount = surveys.filter(s => {
        const surveyName = s.name || '';
        const query = surveyState.query || '';
        return surveyName.toLowerCase().includes(query.toLowerCase());
    }).length;
    const totalPages = Math.ceil(filteredCount / surveyState.itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    surveyState.currentPage = page;
    renderSurveyTable();
};

// --- 打开创建问卷模态框 ---
window.openSurveyModal = function() {
    const modal = document.getElementById('surveyModal');
    if (!modal) return;
    
    // 重置表单
    document.getElementById('surveyForm').reset();
    document.getElementById('surveyId').value = '';
    additionalQuestionCount = 0;
    document.getElementById('additionalQuestions').innerHTML = '';
    
    modal.classList.add('active');
};

// --- 关闭创建问卷模态框 ---
window.closeSurveyModal = function() {
    document.getElementById('surveyModal').classList.remove('active');
};

// --- 添加额外问题 ---
window.addSurveyQuestion = function() {
    additionalQuestionCount++;
    const container = document.getElementById('additionalQuestions');
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.id = `question-${additionalQuestionCount}`;
    questionDiv.innerHTML = `
        <span class="question-number">${additionalQuestionCount + 1}.</span>
        <input type="text" class="question-input" placeholder="请输入问题内容" id="questionText-${additionalQuestionCount}">
        <span class="question-type">文本题</span>
        <button type="button" class="remove-question-btn" onclick="removeSurveyQuestion(${additionalQuestionCount})">
            <i class="fa-solid fa-trash-can"></i>
        </button>
    `;
    
    container.appendChild(questionDiv);
};

// --- 删除额外问题 ---
window.removeSurveyQuestion = function(questionId) {
    const questionEl = document.getElementById(`question-${questionId}`);
    if (questionEl) {
        questionEl.remove();
    }
};

// --- 保存问卷 ---
window.saveSurvey = function() {
    const name = document.getElementById('surveyName').value.trim();
    const description = document.getElementById('surveyDescription').value.trim();
    
    if (!name) {
        showToast('请输入问卷名称', 'error');
        return;
    }
    
    // 收集额外问题
    const questions = [
        { id: 'q1', type: 'rating', text: '整体满意度评分（1-5分）' }
    ];
    
    const questionInputs = document.querySelectorAll('#additionalQuestions .question-item');
    questionInputs.forEach((item, index) => {
        const input = item.querySelector('.question-input');
        if (input && input.value.trim()) {
            questions.push({
                id: `q${index + 2}`,
                type: 'text',
                text: input.value.trim()
            });
        }
    });
    
    // 生成问卷ID（找最大ID+1，避免删除后重复）
    let maxNum = 0;
    surveys.forEach(s => {
        const match = s.id && s.id.match(/SV(\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
        }
    });
    const newId = 'SV' + String(maxNum + 1).padStart(3, '0');
    
    // 获取当前时间
    const now = new Date();
    const createdAt = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(/\//g, '-');
    
    // 创建新问卷
    const newSurvey = {
        id: newId,
        name: name,
        description: description,
        questions: questions,
        createdAt: createdAt,
        status: 'active'
    };
    
    surveys.unshift(newSurvey);
    saveSurveysToStorage();
    
    closeSurveyModal();
    renderSurveyTable();
    showToast('问卷创建成功', 'success');
};

// --- 显示问卷链接 ---
window.showSurveyLink = function(surveyId) {
    const modal = document.getElementById('surveyLinkModal');
    if (!modal) return;
    
    currentSurveyId = surveyId;
    
    // 生成问卷链接（使用当前域名）
    const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
    const surveyLink = `${baseUrl}survey.html?id=${surveyId}`;
    
    document.getElementById('surveyLink').value = surveyLink;
    
    modal.classList.add('active');
};

// --- 关闭问卷链接模态框 ---
window.closeSurveyLinkModal = function() {
    document.getElementById('surveyLinkModal').classList.remove('active');
};

// --- 复制问卷链接 ---
window.copySurveyLink = function() {
    const linkInput = document.getElementById('surveyLink');
    linkInput.select();
    
    try {
        document.execCommand('copy');
        showToast('链接已复制到剪贴板', 'success');
    } catch (e) {
        showToast('复制失败，请手动复制', 'error');
    }
};

// --- 删除问卷确认 ---
window.deleteSurvey = function(surveyId) {
    const survey = surveys.find(s => s.id === surveyId);
    if (!survey) return;
    
    pendingDeleteId = surveyId;
    document.getElementById('confirmMessage').innerText = `确定要删除问卷"${survey.name}"吗？删除后无法恢复，相关回收数据也将被删除。`;
    document.getElementById('confirmActionBtn').innerText = '确认删除';
    document.getElementById('confirmModal').classList.add('active');
    
    // 重新设置确认按钮的点击事件
    const actionBtn = document.getElementById('confirmActionBtn');
    const newBtn = actionBtn.cloneNode(true);
    actionBtn.parentNode.replaceChild(newBtn, actionBtn);
    
    newBtn.addEventListener('click', () => {
        performDeleteSurvey(pendingDeleteId);
    });
};

// --- 执行删除问卷 ---
function performDeleteSurvey(surveyId) {
    // 删除问卷
    surveys = surveys.filter(s => s.id !== surveyId);
    // 删除相关回收数据
    surveyResponses = surveyResponses.filter(r => r.surveyId !== surveyId);
    
    saveSurveysToStorage();
    saveSurveyResponsesToStorage();
    
    renderSurveyTable();
    showToast('问卷已删除', 'warning');
    closeConfirmModal();
}

// --- 查看问卷统计 ---
window.viewSurveyStats = function(surveyId) {
    const modal = document.getElementById('surveyStatsModal');
    if (!modal) return;
    
    const survey = surveys.find(s => s.id === surveyId);
    if (!survey) {
        showToast('问卷不存在', 'error');
        return;
    }
    
    currentSurveyId = surveyId;
    
    // 设置标题
    document.getElementById('surveyStatsTitle').innerText = `${survey.name} - 统计分析`;
    
    // 获取该问卷的所有回收数据
    const responses = surveyResponses.filter(r => r.surveyId === surveyId);
    const totalResponses = responses.length;
    
    // 计算统计数据
    let avgScore = 0;
    let goodCount = 0;
    const scoreDistribution = [0, 0, 0, 0, 0]; // 1-5分的数量
    
    if (totalResponses > 0) {
        let totalScore = 0;
        responses.forEach(r => {
            const score = parseInt(r.score) || 0;
            totalScore += score;
            if (score >= 4) goodCount++;
            if (score >= 1 && score <= 5) {
                scoreDistribution[score - 1]++;
            }
        });
        avgScore = (totalScore / totalResponses).toFixed(1);
    }
    
    const goodRate = totalResponses > 0 ? Math.round((goodCount / totalResponses) * 100) : 0;
    
    // 设置统计卡片数据
    document.getElementById('statsTotalResponses').setAttribute('data-target', totalResponses);
    document.getElementById('statsAvgScore').setAttribute('data-target', avgScore);
    document.getElementById('statsGoodRate').setAttribute('data-target', goodRate);
    
    // 重置计数器并启动动画
    document.getElementById('statsTotalResponses').innerText = '0';
    document.getElementById('statsAvgScore').innerText = '0';
    document.getElementById('statsGoodRate').innerText = '0%';
    
    // 启动计数器动画
    animateCounter('statsTotalResponses', totalResponses, false);
    animateCounter('statsAvgScore', parseFloat(avgScore), true);
    animateCounter('statsGoodRate', goodRate, false, true);
    
    // 渲染评分分布图表
    renderScoreDistributionChart(scoreDistribution);
    
    // 渲染反馈列表
    renderFeedbackList(responses);
    
    modal.classList.add('active');
};

// --- 计数器动画 ---
function animateCounter(elementId, target, isFloat = false, isPercent = false) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const duration = 1500; // ms
    const steps = 60;
    const stepValue = target / steps;
    let current = 0;
    let step = 0;
    
    const timer = setInterval(() => {
        step++;
        current += stepValue;
        
        if (step >= steps) {
            current = target;
            clearInterval(timer);
        }
        
        if (isFloat) {
            element.innerText = parseFloat(current).toFixed(1);
        } else if (isPercent) {
            element.innerText = Math.round(current) + '%';
        } else {
            element.innerText = Math.ceil(current);
        }
    }, duration / steps);
}

// --- 渲染评分分布图表 ---
function renderScoreDistributionChart(distribution) {
    const ctx = document.getElementById('scoreDistributionChart');
    if (!ctx) return;
    
    // 如果已有图表实例，先销毁
    if (scoreDistributionChart) {
        scoreDistributionChart.destroy();
    }
    
    scoreDistributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1分', '2分', '3分', '4分', '5分'],
            datasets: [{
                label: '反馈数量',
                data: distribution,
                backgroundColor: [
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(234, 179, 8, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(79, 70, 229, 0.7)'
                ],
                borderColor: [
                    'rgb(239, 68, 68)',
                    'rgb(245, 158, 11)',
                    'rgb(234, 179, 8)',
                    'rgb(16, 185, 129)',
                    'rgb(79, 70, 229)'
                ],
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// --- 渲染反馈列表 ---
function renderFeedbackList(responses) {
    const container = document.getElementById('feedbackList');
    if (!container) return;
    
    if (responses.length === 0) {
        container.innerHTML = '<p class="no-data">暂无反馈数据</p>';
        return;
    }
    
    container.innerHTML = '';
    
    // 按时间倒序排列
    const sortedResponses = [...responses].sort((a, b) => 
        new Date(b.submittedAt) - new Date(a.submittedAt)
    );
    
    sortedResponses.forEach(response => {
        const feedbackItem = document.createElement('div');
        feedbackItem.className = 'feedback-item';
        
        // 生成星级显示
        let starsHtml = '';
        const score = parseInt(response.score) || 0;
        for (let i = 1; i <= 5; i++) {
            if (i <= score) {
                starsHtml += '<i class="fa-solid fa-star text-warning"></i>';
            } else {
                starsHtml += '<i class="fa-regular fa-star text-muted"></i>';
            }
        }
        
        feedbackItem.innerHTML = `
            <div class="feedback-header">
                <div class="feedback-stars">${starsHtml}</div>
                <span class="feedback-time">${response.submittedAt}</span>
            </div>
            <div class="feedback-content">
                ${response.feedback ? response.feedback : '<span class="no-feedback">用户未填写文字反馈</span>'}
            </div>
        `;
        
        container.appendChild(feedbackItem);
    });
}

// --- 关闭问卷统计模态框 ---
window.closeSurveyStatsModal = function() {
    document.getElementById('surveyStatsModal').classList.remove('active');
    // 销毁图表实例，释放内存
    if (scoreDistributionChart) {
        scoreDistributionChart.destroy();
        scoreDistributionChart = null;
    }
};
