const mongoose = require('mongoose');

const GameSessionSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    questionsCompleted: { type: Number, required: true },
    moves: { type: Number, required: true },
    timeElapsed: { type: Number, required: true }, // в секундах
    cardCount: { type: Number, required: true, enum: [5, 10, 15, 20] }
});

const GameProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    completedQuestionIds: [{ type: String }], // ID вопросов, которые уже прошли
    totalQuestions: { type: Number, required: true },
    currentStreak: { type: Number, default: 0 }, // Текущая серия правильных
    bestStreak: { type: Number, default: 0 }, // Лучшая серия
    totalMoves: { type: Number, default: 0 }, // Всего ходов за все время
    totalTime: { type: Number, default: 0 }, // Общее время в секундах
    sessions: [GameSessionSchema],
    lastPlayedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Индексы для быстрого поиска
GameProgressSchema.index({ userId: 1, testId: 1 }, { unique: true });

// Middleware для обновления updatedAt при изменении
GameProgressSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('GameProgress', GameProgressSchema);
