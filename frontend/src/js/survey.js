/**
 * 客户满意度调查问卷 - 客户端逻辑
 * 客户无需登录即可访问和填写问卷
 */

// --- 全局状态变量 ---
let currentSurvey = null; // 当前问卷数据
let currentScore = 0; // 当前选中的评分

// --- 页面初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    // 从URL参数获取问卷ID
    const urlParams = new URLSearchParams(window.location.search);
    const surveyId = urlParams.get('id');
    
    if (!surveyId) {
        showSurveyError();
        return;
    }
    
    // 加载问卷数据
    loadSurveyData(surveyId);
    
    // 初始化星级评分交互
    initRatingStars();
});

// --- 从 localStorage 加载问卷数据 ---
function loadSurveyData(surveyId) {
    try {
        const savedSurveys = localStorage.getItem('crm_surveys');
        const surveys = savedSurveys ? JSON.parse(savedSurveys) : [];
        
        const survey = surveys.find(s => s.id === surveyId);
        
        if (!survey) {
            showSurveyError();
            return;
        }
        
        currentSurvey = survey;
        renderSurveyContent(survey);
        
    } catch (e) {
        console.error('加载问卷数据失败:', e);
        showSurveyError();
    }
}

// --- 渲染问卷内容 ---
function renderSurveyContent(survey) {
    // 设置问卷标题和描述
    document.getElementById('surveyTitle').innerText = survey.name;
    document.getElementById('surveyDesc').innerText = survey.description || '感谢您抽出宝贵时间参与本次调查，您的反馈对我们非常重要。';
    
    // 渲染额外问题
    const extraQuestionsContainer = document.getElementById('extraQuestionsContainer');
    extraQuestionsContainer.innerHTML = '';
    
    // 过滤掉评分题（评分题默认显示），只渲染文字题
    const textQuestions = survey.questions.filter(q => q.type === 'text');
    
    textQuestions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'survey-question';
        questionDiv.innerHTML = `
            <label class="question-label">
                <span class="question-number">${index + 2}.</span>
                <span class="question-text">${question.text}</span>
            </label>
            <textarea 
                class="feedback-textarea" 
                id="feedback-${question.id}" 
                rows="4" 
                placeholder="请输入您的意见和建议..."
            ></textarea>
        `;
        extraQuestionsContainer.appendChild(questionDiv);
    });
}

// --- 初始化星级评分交互 ---
function initRatingStars() {
    const stars = document.querySelectorAll('.rating-stars .star');
    const ratingText = document.getElementById('ratingText');
    
    // 评分描述文本
    const ratingTexts = {
        1: '非常不满意',
        2: '不满意',
        3: '一般',
        4: '满意',
        5: '非常满意'
    };
    
    stars.forEach(star => {
        // 鼠标悬停效果
        star.addEventListener('mouseenter', () => {
            const value = parseInt(star.getAttribute('data-value'));
            highlightStars(value, true);
            if (ratingTexts[value]) {
                ratingText.innerText = ratingTexts[value];
            }
        });
        
        // 鼠标离开效果
        star.addEventListener('mouseleave', () => {
            highlightStars(currentScore, false);
            if (currentScore > 0 && ratingTexts[currentScore]) {
                ratingText.innerText = ratingTexts[currentScore];
            } else {
                ratingText.innerText = '请选择评分';
            }
        });
        
        // 点击选择评分
        star.addEventListener('click', () => {
            const value = parseInt(star.getAttribute('data-value'));
            currentScore = value;
            document.getElementById('satisfactionScore').value = value;
            highlightStars(value, false);
            if (ratingTexts[value]) {
                ratingText.innerText = ratingTexts[value];
            }
        });
    });
}

// --- 高亮星级 ---
function highlightStars(score, isHover = false) {
    const stars = document.querySelectorAll('.rating-stars .star');
    
    stars.forEach(star => {
        const starValue = parseInt(star.getAttribute('data-value'));
        const icon = star.querySelector('i');
        
        if (starValue <= score) {
            icon.className = 'fa-solid fa-star';
            star.classList.add('active');
            if (isHover) {
                star.classList.add('hover');
            } else {
                star.classList.remove('hover');
            }
        } else {
            icon.className = 'fa-regular fa-star';
            star.classList.remove('active', 'hover');
        }
    });
}

// --- 提交问卷 ---
function submitSurvey() {
    // 验证评分
    if (currentScore === 0) {
        showToast('请先选择满意度评分', 'error');
        return;
    }
    
    if (!currentSurvey) {
        showToast('问卷数据加载失败，请刷新页面重试', 'error');
        return;
    }
    
    // 收集文字反馈
    let feedbackText = '';
    const textQuestions = currentSurvey.questions.filter(q => q.type === 'text');
    
    if (textQuestions.length > 0) {
        const feedbackParts = [];
        textQuestions.forEach((q, index) => {
            const textarea = document.getElementById(`feedback-${q.id}`);
            if (textarea && textarea.value.trim()) {
                feedbackParts.push(`${q.text}：${textarea.value.trim()}`);
            }
        });
        feedbackText = feedbackParts.join('\n');
    }
    
    // 获取当前时间
    const now = new Date();
    const submittedAt = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(/\//g, '-');
    
    // 创建新的回复记录
    const newResponse = {
        id: Date.now(), // 使用时间戳作为ID
        surveyId: currentSurvey.id,
        score: currentScore,
        feedback: feedbackText,
        submittedAt: submittedAt
    };
    
    // 保存到 localStorage
    try {
        const savedResponses = localStorage.getItem('crm_survey_responses');
        const responses = savedResponses ? JSON.parse(savedResponses) : [];
        
        responses.push(newResponse);
        localStorage.setItem('crm_survey_responses', JSON.stringify(responses));
        
        // 显示成功页面
        showSurveySuccess();
        
    } catch (e) {
        console.error('保存问卷数据失败:', e);
        showToast('提交失败，请稍后重试', 'error');
    }
}

// --- 显示提交成功页面 ---
function showSurveySuccess() {
    document.getElementById('surveyContent').style.display = 'none';
    document.getElementById('surveySuccess').style.display = 'block';
    document.getElementById('submittedScore').innerText = currentScore;
}

// --- 显示问卷错误页面 ---
function showSurveyError() {
    document.getElementById('surveyContent').style.display = 'none';
    document.getElementById('surveySuccess').style.display = 'none';
    document.getElementById('surveyError').style.display = 'block';
}

// --- Toast 提示系统 ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info-circle';
    if(type === 'success') icon = 'check-circle';
    if(type === 'error') icon = 'exclamation-circle';
    if(type === 'warning') icon = 'triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid fa-${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);

    // 自动移除
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
