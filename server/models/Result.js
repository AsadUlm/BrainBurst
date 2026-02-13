const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
    clientResultId: { type: String, unique: true, sparse: true }, // Уникальный ID от клиента для защиты от дублирования
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
    mode: { type: String, enum: ['standard', 'exam', 'practice', 'game'], default: 'standard' }, // Режим прохождения
    // Дополнительные поля для режима игры
    moves: { type: Number }, // Количество ходов в игре
    gameCardCount: { type: Number }, // Количество карточек в игре (5, 10, 15, 20)
    questionsCompleted: { type: Number }, // Количество вопросов, завершенных в этой игровой сессии
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', ResultSchema);
