/**
 * 问卷填写页面逻辑
 * 负责加载问卷、渲染问题、收集答案并提交
 */

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        showError('问卷链接无效', '请检查您访问的链接是否正确。');
        return;
    }

    const survey = surveyManager.getSurveyByToken(token);
    if (!survey) {
        showError('问卷不存在或已关闭', '该问卷可能已被删除或停止收集反馈。');
        return;
    }

    renderSurvey(survey);
});

function renderSurvey(survey) {
    const container = document.getElementById('surveyContent');
    const answers = {};

    let html = `
        <div class="survey-card-header">
            <h2>${escapeHtml(survey.title)}</h2>
            <p>${escapeHtml(survey.description)}</p>
        </div>
        <div class="survey-progress">
            <div class="survey-progress-bar" id="progressBar"></div>
        </div>
        <form id="surveyForm">
            <div class="survey-body">
    `;

    survey.questions.forEach((question, index) => {
        html += `<div class="question-block" data-question-id="${question.id}" data-required="${question.required}">`;
        html += `<div class="question-title">`;
        html += `<span class="question-number">${index + 1}</span>`;
        html += escapeHtml(question.title);
        if (question.required) {
            html += `<span class="required">*</span>`;
        }
        html += `</div>`;

        if (question.type === QUESTION_TYPES.RATING) {
            html += renderRatingQuestion(question, index);
        } else if (question.type === QUESTION_TYPES.SINGLE) {
            html += renderSingleQuestion(question);
        } else if (question.type === QUESTION_TYPES.MULTIPLE) {
            html += renderMultipleQuestion(question);
        } else if (question.type === QUESTION_TYPES.TEXT) {
            html += renderTextQuestion(question);
        }

        html += `</div>`;
    });

    html += `
            </div>
            <div class="survey-footer">
                <button type="submit" class="btn-submit">
                    <i class="fa-solid fa-paper-plane"></i> 提交问卷
                </button>
            </div>
        </form>
    `;

    container.innerHTML = html;

    initFormEvents(survey);
}

function renderRatingQuestion(question, index) {
    let html = `<div class="rating-stars" data-question-id="${question.id}">`;
    for (let i = 1; i <= (question.maxRating || 5); i++) {
        html += `<span class="rating-star" data-value="${i}"><i class="fa-solid fa-star"></i></span>`;
    }
    html += `</div>`;
    html += `<div class="rating-labels">
        <span>非常不满意</span>
        <span>非常满意</span>
    </div>`;
    return html;
}

function renderSingleQuestion(question) {
    let html = `<div class="option-list" data-question-id="${question.id}" data-type="single">`;
    question.options.forEach((option, optIndex) => {
        html += `
            <label class="option-item" data-value="${escapeHtml(option)}">
                <input type="radio" name="${question.id}" value="${escapeHtml(option)}">
                <span class="option-radio"></span>
                <span class="option-text">${escapeHtml(option)}</span>
            </label>
        `;
    });
    html += `</div>`;
    return html;
}

function renderMultipleQuestion(question) {
    let html = `<div class="option-list" data-question-id="${question.id}" data-type="multiple">`;
    question.options.forEach((option, optIndex) => {
        html += `
            <label class="option-item" data-value="${escapeHtml(option)}">
                <input type="checkbox" name="${question.id}" value="${escapeHtml(option)}">
                <span class="option-check"></span>
                <span class="option-text">${escapeHtml(option)}</span>
            </label>
        `;
    });
    html += `</div>`;
    return html;
}

function renderTextQuestion(question) {
    return `<textarea class="text-input" data-question-id="${question.id}" placeholder="${escapeHtml(question.placeholder || '请输入您的回答...')}"></textarea>`;
}

function initFormEvents(survey) {
    const answers = {};

    document.querySelectorAll('.rating-stars').forEach(starsContainer => {
        const stars = starsContainer.querySelectorAll('.rating-star');
        const questionId = starsContainer.dataset.questionId;

        stars.forEach(star => {
            star.addEventListener('click', () => {
                const value = parseInt(star.dataset.value);
                answers[questionId] = value;

                stars.forEach((s, i) => {
                    if (i < value) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
                updateProgress(survey, answers);
            });

            star.addEventListener('mouseenter', () => {
                const value = parseInt(star.dataset.value);
                stars.forEach((s, i) => {
                    if (i < value) {
                        s.style.color = '#fbbf24';
                    } else {
                        s.style.color = '#d1d5db';
                    }
                });
            });

            star.addEventListener('mouseleave', () => {
                const selectedValue = answers[questionId] || 0;
                stars.forEach((s, i) => {
                    if (i < selectedValue) {
                        s.style.color = '#fbbf24';
                    } else {
                        s.style.color = '#d1d5db';
                    }
                });
            });
        });
    });

    document.querySelectorAll('.option-list[data-type="single"]').forEach(list => {
        const questionId = list.dataset.questionId;
        const items = list.querySelectorAll('.option-item');

        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                items.forEach(i => {
                    i.classList.remove('selected');
                    i.querySelector('input').checked = false;
                });
                item.classList.add('selected');
                answers[questionId] = item.dataset.value;
                item.querySelector('input').checked = true;
                updateProgress(survey, answers);
            });
        });
    });

    document.querySelectorAll('.option-list[data-type="multiple"]').forEach(list => {
        const questionId = list.dataset.questionId;
        const items = list.querySelectorAll('.option-item');

        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const isSelected = item.classList.contains('selected');
                if (isSelected) {
                    item.classList.remove('selected');
                    item.querySelector('input').checked = false;
                } else {
                    item.classList.add('selected');
                    item.querySelector('input').checked = true;
                }

                const selected = [];
                items.forEach(i => {
                    if (i.classList.contains('selected')) {
                        selected.push(i.dataset.value);
                    }
                });
                answers[questionId] = selected;
                updateProgress(survey, answers);
            });
        });
    });

    document.querySelectorAll('.text-input').forEach(textarea => {
        const questionId = textarea.dataset.questionId;
        textarea.addEventListener('input', () => {
            answers[questionId] = textarea.value;
            updateProgress(survey, answers);
        });
    });

    document.getElementById('surveyForm').addEventListener('submit', (e) => {
        e.preventDefault();

        let isValid = true;
        survey.questions.forEach(q => {
            if (q.required) {
                const answer = answers[q.id];
                if (answer === undefined || answer === null || answer === '' ||
                    (Array.isArray(answer) && answer.length === 0)) {
                    isValid = false;
                    const block = document.querySelector(`[data-question-id="${q.id}"]`);
                    if (block) {
                        block.style.borderLeft = '4px solid #ef4444';
                        block.style.paddingLeft = '12px';
                        block.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }
        });

        if (!isValid) {
            showToast('请填写所有必填项', 'error');
            return;
        }

        surveyManager.submitResponse(survey.id, answers);
        showThankYou();
    });

    updateProgress(survey, answers);
}

function updateProgress(survey, answers) {
    const requiredQuestions = survey.questions.filter(q => q.required);
    let answered = 0;

    requiredQuestions.forEach(q => {
        const answer = answers[q.id];
        if (answer !== undefined && answer !== null && answer !== '' &&
            !(Array.isArray(answer) && answer.length === 0)) {
            answered++;
        }
    });

    const progress = requiredQuestions.length > 0 ? (answered / requiredQuestions.length) * 100 : 100;
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = progress + '%';
    }
}

function showThankYou() {
    const container = document.getElementById('surveyContent');
    container.innerHTML = `
        <div class="thank-you-page">
            <div class="thank-you-icon">
                <i class="fa-solid fa-check"></i>
            </div>
            <h2>感谢您的反馈！</h2>
            <p>您的回答已成功提交。<br>我们非常重视您的意见，这将帮助我们不断改进产品和服务质量。</p>
        </div>
    `;
}

function showError(title, message) {
    const container = document.getElementById('surveyContent');
    container.innerHTML = `
        <div class="error-page">
            <div class="error-icon">
                <i class="fa-solid fa-circle-xmark"></i>
            </div>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid fa-${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
