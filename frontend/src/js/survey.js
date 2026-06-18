/**
 * 客户满意度调查问卷系统 - 数据管理层
 * 负责问卷的创建、存储、回答收集和统计分析
 * 数据持久化使用 localStorage
 */

// ==================== 数据存储键名 ====================
const STORAGE_KEYS = {
    SURVEYS: 'pdh_surveys',
    RESPONSES: 'pdh_survey_responses'
};

// ==================== 问题类型定义 ====================
const QUESTION_TYPES = {
    RATING: 'rating',
    SINGLE: 'single',
    MULTIPLE: 'multiple',
    TEXT: 'text'
};

// ==================== 数据操作类 ====================
class SurveyManager {
    constructor() {
        this.surveys = this.loadSurveys();
        this.responses = this.loadResponses();
        this.initDefaultSurvey();
    }

    loadSurveys() {
        const data = localStorage.getItem(STORAGE_KEYS.SURVEYS);
        return data ? JSON.parse(data) : [];
    }

    loadResponses() {
        const data = localStorage.getItem(STORAGE_KEYS.RESPONSES);
        return data ? JSON.parse(data) : [];
    }

    saveSurveys() {
        localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(this.surveys));
    }

    saveResponses() {
        localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(this.responses));
    }

    generateId() {
        return 'S' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
    }

    generateShareToken() {
        return Math.random().toString(36).substr(2, 16);
    }

    initDefaultSurvey() {
        if (this.surveys.length === 0) {
            const defaultSurvey = {
                id: this.generateId(),
                title: '客户满意度调查问卷',
                description: '感谢您选择昆山飘得华电子材料有限公司！为了更好地为您提供服务，请花几分钟时间填写此问卷，您的反馈对我们非常重要。',
                shareToken: this.generateShareToken(),
                status: 'active',
                createdAt: new Date().toISOString(),
                questions: [
                    {
                        id: 'q1',
                        type: QUESTION_TYPES.RATING,
                        title: '您对我司产品质量的整体满意度如何？',
                        required: true,
                        maxRating: 5
                    },
                    {
                        id: 'q2',
                        type: QUESTION_TYPES.RATING,
                        title: '您对我司服务响应速度的满意度如何？',
                        required: true,
                        maxRating: 5
                    },
                    {
                        id: 'q3',
                        type: QUESTION_TYPES.SINGLE,
                        title: '您主要采购的产品类别是？',
                        required: true,
                        options: ['电子封装材料', '导热界面材料', '导电材料', '绝缘材料', '其他']
                    },
                    {
                        id: 'q4',
                        type: QUESTION_TYPES.MULTIPLE,
                        title: '您认为我们在哪些方面需要改进？（可多选）',
                        required: false,
                        options: ['产品质量', '交货速度', '售后服务', '价格竞争力', '技术支持', '产品种类']
                    },
                    {
                        id: 'q5',
                        type: QUESTION_TYPES.TEXT,
                        title: '您有其他什么建议或意见吗？',
                        required: false,
                        placeholder: '请在此输入您的宝贵建议...'
                    }
                ]
            };
            this.surveys.push(defaultSurvey);
            this.saveSurveys();
        }
    }

    createSurvey(surveyData) {
        const survey = {
            id: this.generateId(),
            title: surveyData.title,
            description: surveyData.description,
            shareToken: this.generateShareToken(),
            status: 'active',
            createdAt: new Date().toISOString(),
            questions: surveyData.questions.map((q, index) => ({
                id: 'q' + (index + 1),
                type: q.type,
                title: q.title,
                required: q.required || false,
                options: q.options || [],
                maxRating: q.maxRating || 5,
                placeholder: q.placeholder || ''
            }))
        };
        this.surveys.unshift(survey);
        this.saveSurveys();
        return survey;
    }

    updateSurvey(id, surveyData) {
        const index = this.surveys.findIndex(s => s.id === id);
        if (index !== -1) {
            this.surveys[index] = {
                ...this.surveys[index],
                title: surveyData.title,
                description: surveyData.description,
                questions: surveyData.questions.map((q, i) => ({
                    id: q.id || 'q' + (i + 1),
                    type: q.type,
                    title: q.title,
                    required: q.required || false,
                    options: q.options || [],
                    maxRating: q.maxRating || 5,
                    placeholder: q.placeholder || ''
                }))
            };
            this.saveSurveys();
            return this.surveys[index];
        }
        return null;
    }

    deleteSurvey(id) {
        this.surveys = this.surveys.filter(s => s.id !== id);
        this.responses = this.responses.filter(r => r.surveyId !== id);
        this.saveSurveys();
        this.saveResponses();
    }

    toggleSurveyStatus(id) {
        const survey = this.surveys.find(s => s.id === id);
        if (survey) {
            survey.status = survey.status === 'active' ? 'closed' : 'active';
            this.saveSurveys();
            return survey;
        }
        return null;
    }

    getSurveyById(id) {
        return this.surveys.find(s => s.id === id);
    }

    getSurveyByToken(token) {
        return this.surveys.find(s => s.shareToken === token && s.status === 'active');
    }

    getAllSurveys() {
        return this.surveys;
    }

    submitResponse(surveyId, answers) {
        const response = {
            id: 'R' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase(),
            surveyId: surveyId,
            answers: answers,
            submittedAt: new Date().toISOString()
        };
        this.responses.push(response);
        this.saveResponses();
        return response;
    }

    getResponsesBySurveyId(surveyId) {
        return this.responses.filter(r => r.surveyId === surveyId);
    }

    getSurveyStats(surveyId) {
        const survey = this.getSurveyById(surveyId);
        const responses = this.getResponsesBySurveyId(surveyId);

        if (!survey) return null;

        const stats = {
            totalResponses: responses.length,
            questionStats: {}
        };

        survey.questions.forEach(question => {
            const questionResponses = responses.map(r => r.answers[question.id]).filter(a => a !== undefined && a !== null && a !== '');

            stats.questionStats[question.id] = {
                question: question,
                responseCount: questionResponses.length,
                data: {}
            };

            if (question.type === QUESTION_TYPES.RATING) {
                const sum = questionResponses.reduce((acc, val) => acc + (parseInt(val) || 0), 0);
                const avg = questionResponses.length > 0 ? (sum / questionResponses.length).toFixed(2) : 0;
                const distribution = [0, 0, 0, 0, 0];
                questionResponses.forEach(val => {
                    const rating = parseInt(val);
                    if (rating >= 1 && rating <= 5) {
                        distribution[rating - 1]++;
                    }
                });
                stats.questionStats[question.id].average = avg;
                stats.questionStats[question.id].distribution = distribution;
            } else if (question.type === QUESTION_TYPES.SINGLE) {
                question.options.forEach(opt => {
                    stats.questionStats[question.id].data[opt] = {
                        count: 0,
                        percentage: 0
                    };
                });
                questionResponses.forEach(val => {
                    if (stats.questionStats[question.id].data[val]) {
                        stats.questionStats[question.id].data[val].count++;
                    }
                });
                Object.keys(stats.questionStats[question.id].data).forEach(opt => {
                    const count = stats.questionStats[question.id].data[opt].count;
                    stats.questionStats[question.id].data[opt].percentage =
                        questionResponses.length > 0 ? ((count / questionResponses.length) * 100).toFixed(1) : 0;
                });
            } else if (question.type === QUESTION_TYPES.MULTIPLE) {
                question.options.forEach(opt => {
                    stats.questionStats[question.id].data[opt] = {
                        count: 0,
                        percentage: 0
                    };
                });
                questionResponses.forEach(valArray => {
                    if (Array.isArray(valArray)) {
                        valArray.forEach(val => {
                            if (stats.questionStats[question.id].data[val]) {
                                stats.questionStats[question.id].data[val].count++;
                            }
                        });
                    }
                });
                Object.keys(stats.questionStats[question.id].data).forEach(opt => {
                    const count = stats.questionStats[question.id].data[opt].count;
                    stats.questionStats[question.id].data[opt].percentage =
                        responses.length > 0 ? ((count / responses.length) * 100).toFixed(1) : 0;
                });
            } else if (question.type === QUESTION_TYPES.TEXT) {
                stats.questionStats[question.id].textResponses = questionResponses.filter(t => t && t.trim());
            }
        });

        return stats;
    }

    getShareUrl(token) {
        return 'survey-fill.html?token=' + token;
    }
}

const surveyManager = new SurveyManager();
