/**
 * 客户填写端逻辑（公共页面 survey.html）
 * --------------------------------------------------
 * 1. 通过 URL 中的 ?id=xxx 找到对应问卷；
 * 2. 客户无需登录即可填写；
 * 3. 提交结果存入 localStorage 的 crm_survey_responses 列表，
 *    管理员在 CRM 后台“满意度调查”页面可查看汇总。
 * 注：因为本系统为纯前端 Demo，使用 localStorage 模拟数据上报。
 *     实际生产中将 saveResponse() 改为调用后端 API 即可。
 */

const SURVEY_STORE_KEY = 'crm_surveys';
const RESPONSE_STORE_KEY = 'crm_survey_responses';

// 当前问卷对象
let currentSurvey = null;

// 入口
document.addEventListener('DOMContentLoaded', () => {
    const id = getQueryParam('id');
    const card = document.getElementById('surveyCard');

    if (!id) {
        card.innerHTML = renderError('缺少问卷 ID', '请检查链接是否完整');
        return;
    }

    // 从本地存储中读取问卷
    const surveys = JSON.parse(localStorage.getItem(SURVEY_STORE_KEY) || '[]');
    currentSurvey = surveys.find(s => s.id === id);

    if (!currentSurvey) {
        card.innerHTML = renderError('问卷不存在或已被删除', '请联系发送方核对链接');
        return;
    }

    renderSurvey(currentSurvey);
});

/**
 * 从 URL 中读取查询参数
 */
function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
}

/**
 * 渲染错误占位
 */
function renderError(title, desc) {
    return `
        <div class="public-error">
            <i class="fa-solid fa-circle-exclamation"></i>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(desc)}</p>
        </div>
    `;
}

/**
 * 渲染问卷内容
 */
function renderSurvey(survey) {
    const card = document.getElementById('surveyCard');
    let html = `
        <div class="public-header">
            <div class="logo-icon"><i class="fa-solid fa-clipboard-question"></i></div>
            <h1>${escapeHtml(survey.title)}</h1>
            ${survey.description ? `<p class="desc">${escapeHtml(survey.description)}</p>` : ''}
        </div>
        <form id="publicSurveyForm" class="public-form">
            <div class="form-group">
                <label>您的称呼（选填）</label>
                <input type="text" name="__respondent" placeholder="便于我们回访">
            </div>
    `;

    // 渲染每一道题
    survey.questions.forEach((q, idx) => {
        html += `<div class="form-group public-question">
            <label><span class="q-no">${idx + 1}.</span> ${escapeHtml(q.text)}</label>`;
        if (q.type === 'rating') {
            // 评分题：1~5 星
            html += '<div class="rating-row" data-qid="' + q.id + '">';
            for (let i = 1; i <= 5; i++) {
                html += `<button type="button" class="star-btn" data-value="${i}" title="${i} 分">
                            <i class="fa-regular fa-star"></i>
                         </button>`;
            }
            html += '<input type="hidden" name="' + q.id + '" required></div>';
        } else if (q.type === 'choice') {
            // 单选题
            html += '<div class="choice-row">';
            (q.options || []).forEach((opt, i) => {
                html += `<label class="choice-label">
                    <input type="radio" name="${q.id}" value="${escapeHtml(opt)}" ${i === 0 ? 'required' : ''}>
                    <span>${escapeHtml(opt)}</span>
                </label>`;
            });
            html += '</div>';
        } else {
            // 文本题
            html += `<textarea name="${q.id}" rows="3" placeholder="请输入您的回答"></textarea>`;
        }
        html += '</div>';
    });

    html += `
            <button type="submit" class="btn-primary btn-block">
                <i class="fa-solid fa-paper-plane"></i> 提交问卷
            </button>
        </form>
    `;

    card.innerHTML = html;

    // 绑定评分交互
    card.querySelectorAll('.rating-row').forEach(row => {
        const buttons = row.querySelectorAll('.star-btn');
        const hidden = row.querySelector('input[type="hidden"]');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const v = Number(btn.dataset.value);
                hidden.value = v;
                buttons.forEach(b => {
                    const i = b.querySelector('i');
                    if (Number(b.dataset.value) <= v) {
                        i.classList.remove('fa-regular');
                        i.classList.add('fa-solid', 'active');
                    } else {
                        i.classList.add('fa-regular');
                        i.classList.remove('fa-solid', 'active');
                    }
                });
            });
        });
    });

    // 提交
    document.getElementById('publicSurveyForm').addEventListener('submit', handleSubmit);
}

/**
 * 处理提交
 */
function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const answers = {};
    let missing = null;

    // 收集每一题的回答
    currentSurvey.questions.forEach(q => {
        if (q.type === 'choice') {
            const checked = form.querySelector(`input[name="${q.id}"]:checked`);
            if (!checked) {
                missing = q.text;
                return;
            }
            answers[q.id] = checked.value;
        } else if (q.type === 'rating') {
            const v = form.querySelector(`input[name="${q.id}"]`).value;
            if (!v) {
                missing = q.text;
                return;
            }
            answers[q.id] = Number(v);
        } else {
            const val = form.querySelector(`textarea[name="${q.id}"]`).value.trim();
            answers[q.id] = val;
        }
    });

    if (missing) {
        showToast('请完成题目：' + missing, 'error');
        return;
    }

    saveResponse({
        surveyId: currentSurvey.id,
        respondent: form.querySelector('input[name="__respondent"]').value.trim() || '匿名客户',
        answers,
        submittedAt: Date.now()
    });

    // 显示成功界面
    document.getElementById('surveyCard').innerHTML = `
        <div class="public-success">
            <div class="success-icon"><i class="fa-solid fa-circle-check"></i></div>
            <h2>提交成功</h2>
            <p>感谢您的反馈！我们会持续改进产品与服务。</p>
        </div>
    `;
}

/**
 * 保存提交结果到 localStorage（模拟后端收集）
 */
function saveResponse(record) {
    const list = JSON.parse(localStorage.getItem(RESPONSE_STORE_KEY) || '[]');
    list.push(record);
    localStorage.setItem(RESPONSE_STORE_KEY, JSON.stringify(list));
}

/**
 * Toast 提示
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    toast.innerHTML = `<i class="fa-solid fa-${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
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
