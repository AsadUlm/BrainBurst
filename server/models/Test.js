const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: {
        type: [String],
        required: true,
        validate: (arr) => arr.length >= 1 && arr.length <= 8,
    },
    correctIndex: { type: Number, required: true },
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Test', TestSchema);

