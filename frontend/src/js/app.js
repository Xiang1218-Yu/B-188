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

    // 问卷搜索监听：实时过滤问卷标题
    const surveySearchInput = document.getElementById('surveySearch');
    if (surveySearchInput) {
        surveySearchInput.addEventListener('input', (e) => {
            surveyState.query = e.target.value;
            renderSurveyTable();
        });
    }

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

            // 切换到满意度调查时刷新表格
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


/* ==========================================================
 * 满意度调查问卷模块
 * 功能说明：
 *   1. 管理员可在“满意度调查”页面创建问卷（含若干题目）
 *   2. 保存后生成可分享的公共链接（survey.html?id=xxx）
 *   3. 客户无需登录，打开链接即可填写并提交
 *   4. 提交结果通过 localStorage 持久化，模拟“后台收集”
 *   5. 管理员可在列表中查看每份问卷的统计结果
 *   注：因当前为纯前端项目，使用 localStorage 作为持久化存储；
 *       所有问卷与回收数据在浏览器端共享同一个域。
 * ========================================================== */

// LocalStorage 键名
const SURVEY_STORE_KEY = 'crm_surveys';
const RESPONSE_STORE_KEY = 'crm_survey_responses';

// 问卷模块状态
let surveys = [];               // 问卷列表
let responses = [];             // 提交记录列表
let surveyState = { query: '' };// 搜索关键字

/**
 * 从 localStorage 中加载问卷与回执数据
 */
function loadSurveyData() {
    try {
        surveys = JSON.parse(localStorage.getItem(SURVEY_STORE_KEY) || '[]');
        responses = JSON.parse(localStorage.getItem(RESPONSE_STORE_KEY) || '[]');
    } catch (e) {
        surveys = [];
        responses = [];
    }
}

/**
 * 将问卷数据持久化到 localStorage
 */
function persistSurveys() {
    localStorage.setItem(SURVEY_STORE_KEY, JSON.stringify(surveys));
}

/**
 * 渲染问卷列表表格
 */
function renderSurveyTable() {
    loadSurveyData();
    const tbody = document.getElementById('surveyTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // 根据搜索关键字过滤
    const list = surveys.filter(s =>
        !surveyState.query || (s.title || '').includes(surveyState.query)
    );

    if (list.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem;">
                暂无问卷，点击右上角“创建问卷”开始
            </td></tr>`;
        return;
    }

    list.forEach(s => {
        // 统计该问卷的回收数量
        const count = responses.filter(r => r.surveyId === s.id).length;
        const link = buildSurveyLink(s.id);
        // 兼容老数据：未设置 status 视为开启
        const isClosed = s.status === 'closed';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${s.id}</td>
            <td>
                <strong>${escapeHtml(s.title)}</strong>
                <span class="status-badge ${isClosed ? 'inactive' : 'active'}" style="margin-left:0.5rem;">
                    ${isClosed ? '已关闭' : '进行中'}
                </span>
            </td>
            <td>${(s.questions || []).length}</td>
            <td><span class="status-badge ${count > 0 ? 'active' : 'inactive'}">${count}</span></td>
            <td>${formatTime(s.createdAt)}</td>
            <td>
                <a href="${link}" target="_blank" class="link-cell" title="${link}">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> 打开
                </a>
            </td>
            <td class="action-btns">
                <button class="edit" title="编辑问卷" onclick="openSurveyModal('${s.id}')">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="edit" title="复制链接" onclick="showShareLink('${s.id}')">
                    <i class="fa-solid fa-share-nodes"></i>
                </button>
                <button class="edit" title="查看统计" onclick="openStatsModal('${s.id}')">
                    <i class="fa-solid fa-chart-column"></i>
                </button>
                <button class="${isClosed ? 'edit' : 'delete'}"
                    title="${isClosed ? '重新开启' : '关闭问卷'}"
                    onclick="toggleSurveyStatus('${s.id}')">
                    <i class="fa-solid ${isClosed ? 'fa-lock-open' : 'fa-lock'}"></i>
                </button>
                <button class="delete" title="删除" onclick="deleteSurvey('${s.id}')">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * 切换问卷的开启 / 关闭状态
 * 关闭后客户访问填写链接时不允许再提交
 */
window.toggleSurveyStatus = function (id) {
    loadSurveyData();
    const s = surveys.find(it => it.id === id);
    if (!s) return;
    s.status = s.status === 'closed' ? 'open' : 'closed';
    persistSurveys();
    renderSurveyTable();
    showToast(s.status === 'closed' ? '问卷已关闭，停止收集回执' : '问卷已重新开启', 'success');
};

/**
 * 构造问卷分享链接（基于当前域名 + survey.html）
 * @param {string} id 问卷 id
 */
function buildSurveyLink(id) {
    const base = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
    return `${base}survey.html?id=${encodeURIComponent(id)}`;
}

// 当前正在编辑的问卷 id；为空表示新建
let editingSurveyId = null;

/**
 * 打开问卷创建/编辑弹窗
 * @param {string} [id] 传入 id 则进入编辑模式，否则为新建
 */
window.openSurveyModal = function (id) {
    loadSurveyData();
    editingSurveyId = id || null;
    const list = document.getElementById('questionList');
    list.innerHTML = '';

    // 修改弹窗标题与按钮文案
    const header = document.querySelector('#surveyModal .modal-header h3');
    const saveBtn = document.querySelector('#surveyModal .modal-footer .btn-primary');

    if (editingSurveyId) {
        const s = surveys.find(it => it.id === editingSurveyId);
        if (!s) {
            showToast('问卷不存在', 'error');
            return;
        }
        if (header) header.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> 编辑满意度调查问卷';
        if (saveBtn) saveBtn.innerText = '保存修改';

        document.getElementById('surveyTitle').value = s.title || '';
        document.getElementById('surveyDesc').value = s.description || '';
        // 渲染所有已有题目
        (s.questions || []).forEach(q => addQuestion(q.text, q.type, q.options || []));
    } else {
        if (header) header.innerHTML = '<i class="fa-solid fa-clipboard-question"></i> 创建满意度调查问卷';
        if (saveBtn) saveBtn.innerText = '保存并生成链接';

        document.getElementById('surveyTitle').value = '';
        document.getElementById('surveyDesc').value = '';
        // 默认插入两道常见题
        addQuestion('您对我们产品的整体满意度？', 'rating');
        addQuestion('请留下您的建议或意见', 'text');
    }
    document.getElementById('surveyModal').classList.add('active');
};

window.closeSurveyModal = function () {
    document.getElementById('surveyModal').classList.remove('active');
    editingSurveyId = null;
};

/**
 * 在问卷创建弹窗中追加一道题目
 * @param {string} text     题目内容（可选）
 * @param {string} type     题目类型 rating | choice | text
 * @param {string[]} options 单选题的选项数组（可选）
 */
window.addQuestion = function (text = '', type = 'rating', options = []) {
    const list = document.getElementById('questionList');
    const idx = list.children.length;
    const item = document.createElement('div');
    item.className = 'question-item';
    item.innerHTML = `
        <div class="question-row">
            <span class="q-index">Q${idx + 1}</span>
            <input type="text" class="q-text" placeholder="请输入问题" value="${escapeHtml(text)}">
            <select class="q-type">
                <option value="rating" ${type === 'rating' ? 'selected' : ''}>评分(1-5)</option>
                <option value="choice" ${type === 'choice' ? 'selected' : ''}>单选</option>
                <option value="text" ${type === 'text' ? 'selected' : ''}>文本</option>
            </select>
            <button type="button" class="q-remove" title="删除题目">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <!-- 选项可视化容器：每个选项一个独立输入框 -->
        <div class="q-options-box" style="display:${type === 'choice' ? 'block' : 'none'};">
            <div class="q-options-list"></div>
            <button type="button" class="q-add-option">
                <i class="fa-solid fa-plus"></i> 添加选项
            </button>
        </div>
    `;
    list.appendChild(item);

    const optionsBox = item.querySelector('.q-options-box');
    const optionsList = item.querySelector('.q-options-list');
    const addOptionBtn = item.querySelector('.q-add-option');

    // 单选项渲染：每行一个可视化 chip + 删除按钮
    function appendOption(value = '') {
        const row = document.createElement('div');
        row.className = 'q-option-row';
        row.innerHTML = `
            <span class="q-option-bullet"><i class="fa-regular fa-circle-dot"></i></span>
            <input type="text" class="q-option-input" placeholder="请输入选项内容" value="${escapeHtml(value)}">
            <button type="button" class="q-option-remove" title="删除选项">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        row.querySelector('.q-option-remove').addEventListener('click', () => row.remove());
        optionsList.appendChild(row);
    }

    // 初始化已有选项；若类型为 choice 但无数据，给出默认两条
    if (type === 'choice') {
        if (options && options.length) {
            options.forEach(o => appendOption(o));
        } else {
            appendOption('非常满意');
            appendOption('满意');
        }
    }

    // 添加选项按钮
    addOptionBtn.addEventListener('click', () => appendOption(''));

    // 删除题目
    item.querySelector('.q-remove').addEventListener('click', () => {
        item.remove();
        Array.from(list.children).forEach((node, i) => {
            node.querySelector('.q-index').innerText = `Q${i + 1}`;
        });
    });

    // 切换类型时显示/隐藏选项区域；切到 choice 且无选项时初始化
    item.querySelector('.q-type').addEventListener('change', (e) => {
        const v = e.target.value;
        optionsBox.style.display = v === 'choice' ? 'block' : 'none';
        if (v === 'choice' && optionsList.children.length === 0) {
            appendOption('非常满意');
            appendOption('满意');
        }
    });
};

/**
 * 保存问卷：根据是否处于编辑模式选择新建 / 更新
 */
window.saveSurvey = function () {
    const title = document.getElementById('surveyTitle').value.trim();
    const desc = document.getElementById('surveyDesc').value.trim();
    if (!title) {
        showToast('请填写问卷标题', 'error');
        return;
    }

    // 收集所有问题
    const items = document.querySelectorAll('#questionList .question-item');
    const questions = [];
    for (let i = 0; i < items.length; i++) {
        const qText = items[i].querySelector('.q-text').value.trim();
        const qType = items[i].querySelector('.q-type').value;
        if (!qText) {
            showToast(`第 ${i + 1} 题题目不能为空`, 'error');
            return;
        }
        const q = { id: 'q_' + (i + 1), text: qText, type: qType };
        if (qType === 'choice') {
            const optionInputs = items[i].querySelectorAll('.q-option-input');
            q.options = Array.from(optionInputs)
                .map(inp => inp.value.trim())
                .filter(Boolean);
            if (q.options.length < 2) {
                showToast(`第 ${i + 1} 题至少配置两个选项`, 'error');
                return;
            }
        }
        questions.push(q);
    }

    if (questions.length === 0) {
        showToast('请至少添加一道题目', 'error');
        return;
    }

    if (editingSurveyId) {
        // 编辑模式：更新原问卷，保留 id 与原创建时间
        const idx = surveys.findIndex(s => s.id === editingSurveyId);
        if (idx === -1) {
            showToast('问卷不存在或已被删除', 'error');
            return;
        }
        surveys[idx] = {
            ...surveys[idx],
            title,
            description: desc,
            questions,
            updatedAt: Date.now()
        };
        persistSurveys();
        closeSurveyModal();
        renderSurveyTable();
        showToast('问卷已更新', 'success');
        return;
    }

    // 新建模式
    const id = 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    surveys.unshift({
        id,
        title,
        description: desc,
        questions,
        status: 'open',
        createdAt: Date.now()
    });
    persistSurveys();

    closeSurveyModal();
    renderSurveyTable();
    showShareLink(id);
    showToast('问卷已创建', 'success');
};

/**
 * 删除问卷以及该问卷对应的提交记录
 */
window.deleteSurvey = function (id) {
    pendingDeleteId = id;
    document.getElementById('confirmModal').classList.add('active');
    document.getElementById('confirmMessage').innerText = '确定要删除该问卷及其全部回收数据吗？';

    const actionBtn = document.getElementById('confirmActionBtn');
    const newBtn = actionBtn.cloneNode(true);
    actionBtn.parentNode.replaceChild(newBtn, actionBtn);

    newBtn.addEventListener('click', () => {
        surveys = surveys.filter(s => s.id !== id);
        responses = responses.filter(r => r.surveyId !== id);
        localStorage.setItem(SURVEY_STORE_KEY, JSON.stringify(surveys));
        localStorage.setItem(RESPONSE_STORE_KEY, JSON.stringify(responses));
        renderSurveyTable();
        showToast('问卷已删除', 'warning');
        closeConfirmModal();
    });
};

/**
 * 展示分享链接弹窗
 */
window.showShareLink = function (id) {
    const link = buildSurveyLink(id);
    document.getElementById('shareLinkInput').value = link;
    document.getElementById('shareModal').classList.add('active');
};

window.closeShareModal = function () {
    document.getElementById('shareModal').classList.remove('active');
};

/**
 * 复制分享链接到剪贴板
 */
window.copyShareLink = function () {
    const input = document.getElementById('shareLinkInput');
    input.select();
    input.setSelectionRange(0, 99999);
    try {
        // 优先使用现代 API
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(input.value);
        } else {
            document.execCommand('copy');
        }
        showToast('链接已复制', 'success');
    } catch (e) {
        showToast('复制失败，请手动复制', 'error');
    }
};

/**
 * 打开问卷统计弹窗，展示提交概况和每题统计
 */
window.openStatsModal = function (id) {
    loadSurveyData();
    const survey = surveys.find(s => s.id === id);
    if (!survey) {
        showToast('问卷不存在', 'error');
        return;
    }
    const list = responses.filter(r => r.surveyId === id);
    document.getElementById('statsTitle').innerText = survey.title;

    const body = document.getElementById('statsBody');

    if (list.length === 0) {
        body.innerHTML = `
            <div style="text-align:center;padding:2rem;color:var(--text-muted);">
                <i class="fa-solid fa-inbox" style="font-size:2rem;"></i>
                <p style="margin-top:0.75rem;">暂未收到任何回执</p>
            </div>`;
        document.getElementById('statsModal').classList.add('active');
        return;
    }

    // 概览卡片
    let html = `
        <div class="stats-summary">
            <div><span>已回收</span><strong>${list.length}</strong></div>
            <div><span>题目数</span><strong>${survey.questions.length}</strong></div>
            <div><span>最近提交</span><strong>${formatTime(list[list.length - 1].submittedAt)}</strong></div>
        </div>
    `;

    // 每题统计
    survey.questions.forEach(q => {
        html += `<div class="stats-question"><h4>${escapeHtml(q.text)}</h4>`;
        const answers = list.map(r => r.answers[q.id]).filter(v => v !== undefined && v !== '');

        if (q.type === 'rating') {
            // 评分：求平均与各档分布
            const nums = answers.map(Number).filter(n => !isNaN(n));
            const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : '-';
            const dist = [1, 2, 3, 4, 5].map(score => nums.filter(n => n === score).length);
            const max = Math.max(...dist, 1);
            html += `<p class="stats-meta">平均分：<strong>${avg}</strong> · 有效回答 ${nums.length}</p>`;
            html += '<div class="bar-chart">';
            dist.forEach((c, i) => {
                const w = Math.round((c / max) * 100);
                html += `
                    <div class="bar-row">
                        <span class="bar-label">${i + 1} 分</span>
                        <div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div>
                        <span class="bar-count">${c}</span>
                    </div>`;
            });
            html += '</div>';
        } else if (q.type === 'choice') {
            // 单选：统计选项次数
            const counts = {};
            (q.options || []).forEach(o => counts[o] = 0);
            answers.forEach(a => {
                if (counts[a] !== undefined) counts[a]++;
                else counts[a] = (counts[a] || 0) + 1;
            });
            const max = Math.max(...Object.values(counts), 1);
            html += '<div class="bar-chart">';
            Object.keys(counts).forEach(opt => {
                const w = Math.round((counts[opt] / max) * 100);
                html += `
                    <div class="bar-row">
                        <span class="bar-label">${escapeHtml(opt)}</span>
                        <div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div>
                        <span class="bar-count">${counts[opt]}</span>
                    </div>`;
            });
            html += '</div>';
        } else {
            // 文本：列出回答
            html += '<ul class="text-answers">';
            answers.forEach(a => {
                html += `<li>${escapeHtml(a)}</li>`;
            });
            if (answers.length === 0) html += '<li class="empty">暂无文本回答</li>';
            html += '</ul>';
        }
        html += '</div>';
    });

    body.innerHTML = html;
    document.getElementById('statsModal').classList.add('active');
};

window.closeStatsModal = function () {
    document.getElementById('statsModal').classList.remove('active');
};

/**
 * 格式化时间戳
 */
function formatTime(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    const pad = n => (n < 10 ? '0' + n : '' + n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 转义 HTML，防止 XSS
 */
function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

