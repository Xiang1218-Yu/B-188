/**
 * 客户满意度调查填写页面逻辑
 * 客户无需登录，通过链接中的问卷ID参数加载并填写问卷
 */

document.addEventListener('DOMContentLoaded', () => {
    // 从 URL 参数中获取问卷ID
    const params = new URLSearchParams(window.location.search);
    const surveyId = params.get('id');

    if (!surveyId) {
        // 没有问卷ID，显示未找到提示
        showNotFound();
        return;
    }

    // 从 localStorage 加载问卷数据
    const surveys = loadSurveysFromStorage();
    const survey = surveys.find(s => s.id === surveyId);

    if (!survey) {
        // 问卷不存在
        showNotFound();
        return;
    }

    if (survey.status === 'closed') {
        // 问卷已关闭
        showNotFound();
        return;
    }

    // 渲染问卷内容
    renderSurveyForm(survey);
});

// 从 localStorage 加载问卷数据
function loadSurveysFromStorage() {
    const stored = localStorage.getItem('pdh_surveys');
    if (stored) {
        return JSON.parse(stored);
    }
    return [];
}

// 从 localStorage 加载回答数据
function loadResponsesFromStorage() {
    const stored = localStorage.getItem('pdh_survey_responses');
    if (stored) {
        return JSON.parse(stored);
    }
    return [];
}

// 保存回答数据到 localStorage
function saveResponsesToStorage(responses) {
    localStorage.setItem('pdh_survey_responses', JSON.stringify(responses));
}

// 显示问卷未找到提示
function showNotFound() {
    document.getElementById('surveyFillForm').style.display = 'none';
    document.getElementById('surveyNotFound').style.display = 'block';
}

// 渲染问卷填写表单
function renderSurveyForm(survey) {
    // 设置标题和说明
    document.getElementById('surveyFillTitle').innerText = survey.title;
    document.getElementById('surveyFillDesc').innerText = survey.description || '';

    const container = document.getElementById('surveyFillQuestions');
    container.innerHTML = '';

    // 逐题渲染
    survey.questions.forEach((question, index) => {
        const div = document.createElement('div');
        div.className = 'survey-fill-question';
        div.setAttribute('data-question-id', question.id);

        let questionHtml = `
            <div class="survey-fill-question-title">
                <span class="survey-fill-question-number">${index + 1}</span>
                <span>${question.title}</span>
                ${question.type !== 'text' ? '<span class="survey-fill-required">*</span>' : ''}
            </div>
        `;

        if (question.type === 'rating') {
            // 评分题：渲染为星级/等级选择
            questionHtml += `<div class="survey-fill-rating-group">`;
            question.options.forEach((opt, optIdx) => {
                questionHtml += `
                    <label class="survey-fill-rating-option">
                        <input type="radio" name="${question.id}" value="${opt}" ${question.type !== 'text' ? 'required' : ''}>
                        <span class="survey-fill-rating-btn">${opt}</span>
                    </label>
                `;
            });
            questionHtml += `</div>`;
        } else if (question.type === 'single') {
            // 单选题：渲染为卡片式选项
            questionHtml += `<div class="survey-fill-single-group">`;
            question.options.forEach((opt, optIdx) => {
                // 用字母序号标记选项
                const letter = String.fromCharCode(65 + optIdx);
                questionHtml += `
                    <label class="survey-fill-single-option">
                        <input type="radio" name="${question.id}" value="${opt}">
                        <span class="survey-fill-radio-dot"></span>
                        <span>${opt}</span>
                    </label>
                `;
            });
            questionHtml += `</div>`;
        } else if (question.type === 'text') {
            // 文本题：渲染为文本域
            questionHtml += `
                <textarea class="survey-fill-textarea" name="${question.id}" rows="3" placeholder="请输入您的回答..."></textarea>
            `;
        }

        div.innerHTML = questionHtml;
        container.appendChild(div);
    });
}

// 提交问卷
window.submitSurvey = function() {
    const params = new URLSearchParams(window.location.search);
    const surveyId = params.get('id');
    if (!surveyId) return;

    // 从 localStorage 加载问卷数据
    const surveys = loadSurveysFromStorage();
    const survey = surveys.find(s => s.id === surveyId);
    if (!survey) return;

    // 收集所有答案
    const answers = {};
    let allRequiredAnswered = true;

    survey.questions.forEach(question => {
        if (question.type === 'text') {
            // 文本题非必填
            const textarea = document.querySelector(`textarea[name="${question.id}"]`);
            answers[question.id] = textarea ? textarea.value.trim() : '';
        } else {
            // 评分题和单选题必填
            const selected = document.querySelector(`input[name="${question.id}"]:checked`);
            if (!selected) {
                allRequiredAnswered = false;
                // 高亮未回答的题目
                const questionDiv = document.querySelector(`[data-question-id="${question.id}"]`);
                questionDiv.classList.add('survey-fill-question-error');
            } else {
                answers[question.id] = selected.value;
                // 移除错误高亮
                const questionDiv = document.querySelector(`[data-question-id="${question.id}"]`);
                questionDiv.classList.remove('survey-fill-question-error');
            }
        }
    });

    // 校验必填项
    if (!allRequiredAnswered) {
        showToast('请完成所有必填题目', 'error');
        // 滚动到第一个未回答的题目
        const firstError = document.querySelector('.survey-fill-question-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    // 构建回答对象
    const response = {
        surveyId: surveyId,
        submittedAt: new Date().toLocaleString('zh-CN'),
        answers: answers
    };

    // 保存到 localStorage
    const responses = loadResponsesFromStorage();
    responses.push(response);
    saveResponsesToStorage(responses);

    // 显示提交成功提示
    document.getElementById('surveyFillForm').style.display = 'none';
    document.getElementById('surveySubmitted').style.display = 'block';
    showToast('问卷提交成功！', 'success');
};

// Toast 提示（与主系统共用样式）
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
    }, 3000);
}
