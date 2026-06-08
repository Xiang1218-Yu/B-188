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
    renderSurveyList();
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

            if (target === 'surveys') {
                renderSurveyList();
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

// ==================== 问卷管理系统 ====================
let editingQuestions = [];

window.renderSurveyList = function() {
    const surveys = surveyManager.getAllSurveys();
    const listContainer = document.getElementById('surveyList');
    
    let totalResponses = 0;
    let totalRatingSum = 0;
    let totalRatingCount = 0;

    surveys.forEach(s => {
        const resps = surveyManager.getResponsesBySurveyId(s.id);
        totalResponses += resps.length;
        
        s.questions.forEach(q => {
            if (q.type === QUESTION_TYPES.RATING) {
                resps.forEach(r => {
                    if (r.answers[q.id]) {
                        totalRatingSum += parseInt(r.answers[q.id]) || 0;
                        totalRatingCount++;
                    }
                });
            }
        });
    });

    document.getElementById('surveyTotalCount').innerText = surveys.length;
    document.getElementById('surveyActiveCount').innerText = surveys.filter(s => s.status === 'active').length;
    document.getElementById('surveyResponseCount').innerText = totalResponses;
    document.getElementById('surveyAvgRating').innerText = totalRatingCount > 0 ? (totalRatingSum / totalRatingCount).toFixed(1) : '0.0';

    if (surveys.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-clipboard-list"></i>
                <p>暂无问卷，点击上方按钮创建第一个问卷</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = surveys.map(survey => {
        const responses = surveyManager.getResponsesBySurveyId(survey.id);
        const createdDate = new Date(survey.createdAt).toLocaleDateString('zh-CN');
        const statusClass = survey.status === 'active' ? 'active' : 'closed';
        const statusText = survey.status === 'active' ? '进行中' : '已关闭';
        const shareUrl = surveyManager.getShareUrl(survey.shareToken);
        
        let previewQuestions = survey.questions.slice(0, 3).map(q => {
            const typeLabels = { rating: '评分', single: '单选', multiple: '多选', text: '文本' };
            return `<span style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:0.75rem;">${typeLabels[q.type]}</span>`;
        }).join(' ');

        return `
            <div class="survey-card-item ${survey.status === 'closed' ? 'closed' : ''}">
                <div class="survey-card-header">
                    <div>
                        <div class="survey-card-title">${escapeHtml(survey.title)}</div>
                        <div class="survey-card-desc">${escapeHtml(survey.description).substring(0, 100)}${survey.description.length > 100 ? '...' : ''}</div>
                    </div>
                    <span class="survey-status ${statusClass}">${statusText}</span>
                </div>
                <div class="survey-card-meta">
                    <span><i class="fa-solid fa-calendar"></i> 创建于 ${createdDate}</span>
                    <span><i class="fa-solid fa-question-circle"></i> ${survey.questions.length} 个问题</span>
                    <span><i class="fa-solid fa-reply"></i> ${responses.length} 份回答</span>
                    <span style="margin-left:auto;">问题类型: ${previewQuestions}</span>
                </div>
                <div class="survey-card-actions">
                    <button class="btn-sm btn-outline btn-outline-primary" onclick="openShareModal('${survey.shareToken}')">
                        <i class="fa-solid fa-share-nodes"></i> 分享链接
                    </button>
                    <button class="btn-sm btn-outline" onclick="window.open('${shareUrl}', '_blank')">
                        <i class="fa-solid fa-eye"></i> 预览问卷
                    </button>
                    <button class="btn-sm btn-outline btn-outline-success" onclick="viewSurveyStats('${survey.id}')">
                        <i class="fa-solid fa-chart-bar"></i> 查看统计
                    </button>
                    <button class="btn-sm btn-outline" onclick="editSurvey('${survey.id}')">
                        <i class="fa-solid fa-pen-to-square"></i> 编辑
                    </button>
                    <button class="btn-sm btn-outline" onclick="toggleSurveyStatus('${survey.id}')">
                        <i class="fa-solid fa-power-off"></i> ${survey.status === 'active' ? '关闭' : '开启'}
                    </button>
                    <button class="btn-sm btn-outline btn-outline-danger" onclick="deleteSurveyConfirm('${survey.id}')">
                        <i class="fa-solid fa-trash"></i> 删除
                    </button>
                </div>
            </div>
        `;
    }).join('');
};

window.openSurveyEditor = function(surveyId = null) {
    const modal = document.getElementById('surveyEditorModal');
    const titleEl = document.getElementById('surveyEditorTitle');
    const titleInput = document.getElementById('surveyTitle');
    const descInput = document.getElementById('surveyDescription');
    const idInput = document.getElementById('editSurveyId');

    editingQuestions = [];

    if (surveyId) {
        const survey = surveyManager.getSurveyById(surveyId);
        if (!survey) return;
        titleEl.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> 编辑问卷';
        titleInput.value = survey.title;
        descInput.value = survey.description;
        idInput.value = surveyId;
        editingQuestions = JSON.parse(JSON.stringify(survey.questions));
    } else {
        titleEl.innerHTML = '<i class="fa-solid fa-clipboard-list"></i> 创建问卷';
        titleInput.value = '';
        descInput.value = '';
        idInput.value = '';
        editingQuestions = [
            { id: 'q1', type: 'rating', title: '您对我们的服务整体满意度如何？', required: true, maxRating: 5 }
        ];
    }

    renderQuestionEditor();
    modal.classList.add('active');
};

window.editSurvey = function(surveyId) {
    openSurveyEditor(surveyId);
};

window.closeSurveyEditor = function() {
    document.getElementById('surveyEditorModal').classList.remove('active');
};

window.addQuestionToEditor = function() {
    const typeNames = { rating: '评分题', single: '单选题', multiple: '多选题', text: '文本题' };
    const type = prompt('请选择问题类型:\n1 - 评分题\n2 - 单选题\n3 - 多选题\n4 - 文本题', '1');
    
    let qType = 'rating';
    if (type === '2') qType = 'single';
    else if (type === '3') qType = 'multiple';
    else if (type === '4') qType = 'text';

    editingQuestions.push({
        id: 'q' + (editingQuestions.length + 1),
        type: qType,
        title: '',
        required: false,
        options: (qType === 'single' || qType === 'multiple') ? ['选项1', '选项2'] : [],
        maxRating: 5,
        placeholder: ''
    });
    renderQuestionEditor();
};

window.renderQuestionEditor = function() {
    const container = document.getElementById('questionEditorList');
    const typeNames = { rating: '评分题', single: '单选题', multiple: '多选题', text: '文本题' };

    container.innerHTML = editingQuestions.map((q, index) => {
        let optionsHtml = '';
        if (q.type === 'single' || q.type === 'multiple') {
            optionsHtml = `<div class="option-editor-list">`;
            q.options.forEach((opt, optIndex) => {
                optionsHtml += `
                    <div class="option-editor-item">
                        <input type="text" value="${escapeHtml(opt)}" placeholder="选项 ${optIndex + 1}" onchange="updateQuestionOption(${index}, ${optIndex}, this.value)">
                        <button type="button" class="btn-sm btn-outline btn-outline-danger" onclick="removeQuestionOption(${index}, ${optIndex})" title="删除选项">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                `;
            });
            optionsHtml += `
                <button type="button" class="btn-sm btn-outline" onclick="addQuestionOption(${index})" style="margin-top:0.25rem;">
                    <i class="fa-solid fa-plus"></i> 添加选项
                </button>
            </div>`;
        }

        return `
            <div class="question-editor-item">
                <div class="question-editor-header">
                    <span class="question-editor-title">问题 ${index + 1} · ${typeNames[q.type]}</span>
                    <div class="question-editor-actions">
                        <button type="button" title="上移" onclick="moveQuestion(${index}, -1)" ${index === 0 ? 'disabled' : ''}>
                            <i class="fa-solid fa-chevron-up"></i>
                        </button>
                        <button type="button" title="下移" onclick="moveQuestion(${index}, 1)" ${index === editingQuestions.length - 1 ? 'disabled' : ''}>
                            <i class="fa-solid fa-chevron-down"></i>
                        </button>
                        <button type="button" class="danger" title="删除" onclick="removeQuestion(${index})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="form-group" style="margin-bottom: 0.5rem;">
                    <input type="text" value="${escapeHtml(q.title)}" placeholder="请输入问题标题" 
                           onchange="updateQuestionField(${index}, 'title', this.value)" style="width:100%; padding:0.625rem; border:1px solid var(--border-color); border-radius:var(--radius-md);">
                </div>
                <label class="checkbox-label">
                    <input type="checkbox" ${q.required ? 'checked' : ''} onchange="updateQuestionField(${index}, 'required', this.checked)">
                    必填项
                </label>
                ${optionsHtml}
            </div>
        `;
    }).join('');
};

window.updateQuestionField = function(qIndex, field, value) {
    editingQuestions[qIndex][field] = value;
};

window.updateQuestionOption = function(qIndex, optIndex, value) {
    editingQuestions[qIndex].options[optIndex] = value;
};

window.addQuestionOption = function(qIndex) {
    editingQuestions[qIndex].options.push('新选项');
    renderQuestionEditor();
};

window.removeQuestionOption = function(qIndex, optIndex) {
    if (editingQuestions[qIndex].options.length <= 1) {
        showToast('至少保留一个选项', 'warning');
        return;
    }
    editingQuestions[qIndex].options.splice(optIndex, 1);
    renderQuestionEditor();
};

window.moveQuestion = function(qIndex, direction) {
    const newIndex = qIndex + direction;
    if (newIndex < 0 || newIndex >= editingQuestions.length) return;
    [editingQuestions[qIndex], editingQuestions[newIndex]] = [editingQuestions[newIndex], editingQuestions[qIndex]];
    renderQuestionEditor();
};

window.removeQuestion = function(qIndex) {
    if (editingQuestions.length <= 1) {
        showToast('至少保留一个问题', 'warning');
        return;
    }
    editingQuestions.splice(qIndex, 1);
    renderQuestionEditor();
};

window.saveSurveyFromEditor = function() {
    const title = document.getElementById('surveyTitle').value.trim();
    const description = document.getElementById('surveyDescription').value.trim();
    const editId = document.getElementById('editSurveyId').value;

    if (!title) {
        showToast('请填写问卷标题', 'error');
        return;
    }

    const validQuestions = editingQuestions.filter(q => q.title.trim());
    if (validQuestions.length === 0) {
        showToast('请至少添加一个有效问题', 'error');
        return;
    }

    const surveyData = { title, description, questions: validQuestions };

    if (editId) {
        surveyManager.updateSurvey(editId, surveyData);
        showToast('问卷已更新', 'success');
    } else {
        surveyManager.createSurvey(surveyData);
        showToast('问卷已创建', 'success');
    }

    closeSurveyEditor();
    renderSurveyList();
};

window.toggleSurveyStatus = function(surveyId) {
    surveyManager.toggleSurveyStatus(surveyId);
    renderSurveyList();
    showToast('问卷状态已更新', 'success');
};

window.deleteSurveyConfirm = function(surveyId) {
    const survey = surveyManager.getSurveyById(surveyId);
    if (!survey) return;
    
    document.getElementById('confirmMessage').innerText = `确定要删除问卷"${survey.title}"吗？所有回答数据也将被删除。`;
    document.getElementById('confirmModal').classList.add('active');
    
    const actionBtn = document.getElementById('confirmActionBtn');
    const newBtn = actionBtn.cloneNode(true);
    actionBtn.parentNode.replaceChild(newBtn, actionBtn);
    newBtn.onclick = () => {
        surveyManager.deleteSurvey(surveyId);
        closeConfirmModal();
        renderSurveyList();
        showToast('问卷已删除', 'warning');
    };
};

window.openShareModal = function(token) {
    const shareUrl = window.location.origin + window.location.pathname.replace('index.html', '') + surveyManager.getShareUrl(token);
    document.getElementById('shareLinkInput').value = shareUrl;
    document.getElementById('shareLinkModal').classList.add('active');
};

window.closeShareModal = function() {
    document.getElementById('shareLinkModal').classList.remove('active');
};

window.copyShareLink = function() {
    const input = document.getElementById('shareLinkInput');
    input.select();
    document.execCommand('copy');
    showToast('链接已复制到剪贴板', 'success');
};

window.viewSurveyStats = function(surveyId) {
    const stats = surveyManager.getSurveyStats(surveyId);
    if (!stats) return;

    const survey = surveyManager.getSurveyById(surveyId);
    const container = document.getElementById('surveyStatsContent');

    let totalRatingAvg = 0;
    let ratingCount = 0;
    Object.values(stats.questionStats).forEach(qs => {
        if (qs.question.type === QUESTION_TYPES.RATING && qs.average) {
            totalRatingAvg += parseFloat(qs.average);
            ratingCount++;
        }
    });
    const overallAvg = ratingCount > 0 ? (totalRatingAvg / ratingCount).toFixed(2) : '0.00';

    let html = `
        <div class="stats-overview">
            <div class="stats-overview-card">
                <div class="value">${stats.totalResponses}</div>
                <div class="label">总回答数</div>
            </div>
            <div class="stats-overview-card">
                <div class="value">${overallAvg}</div>
                <div class="label">平均评分</div>
            </div>
            <div class="stats-overview-card">
                <div class="value">${survey.questions.length}</div>
                <div class="label">问题数量</div>
            </div>
        </div>
    `;

    survey.questions.forEach(question => {
        const qs = stats.questionStats[question.id];
        html += `<div class="stat-question-block">`;
        html += `<div class="stat-question-title">${escapeHtml(question.title)}</div>`;

        if (question.type === QUESTION_TYPES.RATING) {
            html += `<div class="average-rating">
                <span class="value">${qs.average}</span>
                <span class="stars">${'★'.repeat(Math.round(qs.average))}${'☆'.repeat(5 - Math.round(qs.average))}</span>
                <span style="font-size:0.8rem;color:var(--text-muted);">${qs.responseCount} 人评分</span>
            </div>`;
            html += `<div>`;
            for (let i = 5; i >= 1; i--) {
                const count = qs.distribution[i - 1] || 0;
                const pct = qs.responseCount > 0 ? (count / qs.responseCount * 100) : 0;
                html += `
                    <div class="rating-bars">
                        <span class="rating-label">${i} 星</span>
                        <div class="rating-bar-container">
                            <div class="rating-bar" style="width: ${pct}%"></div>
                        </div>
                        <span class="rating-count">${count}</span>
                    </div>
                `;
            }
            html += `</div>`;
        } else if (question.type === QUESTION_TYPES.SINGLE || question.type === QUESTION_TYPES.MULTIPLE) {
            const label = question.type === QUESTION_TYPES.SINGLE ? '选择' : '选择';
            question.options.forEach(opt => {
                const data = qs.data[opt] || { count: 0, percentage: 0 };
                html += `
                    <div class="percentage-bar-item">
                        <div class="percentage-bar-header">
                            <span>${escapeHtml(opt)}</span>
                            <span>${data.count} 人 (${data.percentage}%)</span>
                        </div>
                        <div class="percentage-bar-container">
                            <div class="percentage-bar" style="width: ${data.percentage}%"></div>
                        </div>
                    </div>
                `;
            });
        } else if (question.type === QUESTION_TYPES.TEXT) {
            const texts = qs.textResponses || [];
            if (texts.length === 0) {
                html += `<p style="color:var(--text-muted); font-size:0.875rem;">暂无文字反馈</p>`;
            } else {
                html += `<p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.5rem;">${texts.length} 条文字反馈</p>`;
                html += `<div class="text-response-list">`;
                texts.forEach(t => {
                    html += `<div class="text-response-item">${escapeHtml(t)}</div>`;
                });
                html += `</div>`;
            }
        }

        html += `</div>`;
    });

    if (stats.totalResponses === 0) {
        html = `
            <div class="empty-state">
                <i class="fa-solid fa-chart-bar"></i>
                <p>暂无回答数据，分享问卷链接后即可查看统计</p>
            </div>
        `;
    }

    container.innerHTML = html;
    document.getElementById('surveyStatsModal').classList.add('active');
};

window.closeSurveyStats = function() {
    document.getElementById('surveyStatsModal').classList.remove('active');
};

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
