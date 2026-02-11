const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    testTitle: { type: String, required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    answers: [mongoose.Schema.Types.Mixed], // Поддержка как чисел, так и строк
    correctAnswers: [Number],
    mistakes: [Number],
    shuffledQuestions: [{
        text: { type: String, required: true },
        options: [{ type: String, required: true }],
        questionType: { type: String, enum: ['multiple-choice', 'open-text', 'puzzle'] },
        puzzleWords: [String],
        correctSentence: String
    }],
    // Время прохождения теста
    startTime: { type: Date },
    endTime: { type: Date },
    duration: { type: Number }, // Длительность в секундах
    timePerQuestion: [Number], // Время на каждый вопрос в секундах
    mode: { type: String, enum: ['standard', 'exam', 'practice'], default: 'standard' }, // Режим прохождения
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', ResultSchema);
