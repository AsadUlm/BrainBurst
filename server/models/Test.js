const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    // Тип вопроса: множественный выбор, открытый текст или пазл
    questionType: {
        type: String,
        enum: ['multiple-choice', 'open-text', 'puzzle'],
        default: 'multiple-choice'
    },
    // Варианты ответов (для multiple-choice и open-text)
    options: {
        type: [String],
        required: function () {
            return this.questionType !== 'puzzle';
        },
        validate: function (arr) {
            // Для пазла options не нужны
            if (this.questionType === 'puzzle') return true;
            return arr && arr.length >= 1 && arr.length <= 8;
        },
    },
    // Индекс правильного ответа (для multiple-choice)
    correctIndex: {
        type: Number,
        required: function () {
            return this.questionType === 'multiple-choice';
        }
    },
    // Массив слов в правильном порядке (для puzzle)
    puzzleWords: {
        type: [String],
        required: function () {
            return this.questionType === 'puzzle';
        },
        validate: function (arr) {
            // Для пазла нужно минимум 2 слова
            if (this.questionType === 'puzzle') {
                return arr && arr.length >= 2;
            }
            return true;
        }
    },
    // Правильное предложение (для отображения и справки)
    correctSentence: {
        type: String,
        required: function () {
            return this.questionType === 'puzzle';
        }
    },
    time: { type: Number },
});

const TestSchema = new mongoose.Schema({
    title: { type: String, required: true },
    questions: [QuestionSchema],
    timeLimit: { type: Number },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    // Настройки видимости
    isVisible: {
        type: Boolean,
        default: true
    },
    // Доступ по пользователям (если пусто - доступен всем)
    allowedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    // Доступ по датам
    availableFrom: {
        type: Date,
        default: null,
    },
    availableUntil: {
        type: Date,
        default: null,
    },
    // Настройки скрытия содержимого
    hideContent: {
        type: Boolean,
        default: false
    },
    // Количество попыток для разблокировки содержимого
    attemptsToUnlock: {
        type: Number,
        default: 0,
        min: 0
    },
    // Настройки режима практики
    practiceMode: {
        type: String,
        enum: ['enabled', 'disabled', 'locked'], // enabled - доступен всем, disabled - недоступен, locked - требует попыток
        default: 'enabled'
    },
    // Количество попыток для разблокировки режима практики
    practiceAttemptsRequired: {
        type: Number,
        default: 0,
        min: 0
    },
    // Настройки режима игры
    gameMode: {
        type: String,
        enum: ['enabled', 'disabled', 'locked'], // enabled - доступен всем, disabled - недоступен, locked - требует попыток
        default: 'enabled'
    },
    // Количество попыток для разблокировки режима игры
    gameAttemptsRequired: {
        type: Number,
        default: 0,
        min: 0
    },
    // Настройки времени для стандартного режима
    useStandardGlobalTimer: {
        type: Boolean,
        default: true
    },
    standardTimeLimit: {
        type: Number,
        default: null
    },
    standardQuestionTime: {
        type: Number,
        default: null
    },
    // Настройки времени для режима экзамена
    useExamGlobalTimer: {
        type: Boolean,
        default: true
    },
    examTimeLimit: {
        type: Number,
        default: null
    },
    examQuestionTime: {
        type: Number,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Test', TestSchema);

