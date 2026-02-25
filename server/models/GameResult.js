const mongoose = require('mongoose');

const CategoryStatsSchema = new mongoose.Schema({
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    categoryName: { type: String },
    correct: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
}, { _id: false });

const GameResultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String, required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    testTitle: { type: String, required: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', sparse: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', sparse: true },

    // Тип игры (для будущего расширения)
    gameType: {
        type: String,
        enum: ['memory-match', 'quiz', 'puzzle', 'speed-test'],
        required: true,
        default: 'memory-match'
    },

    // Основная статистика
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    accuracy: { type: Number, required: true }, // Процент правильных ответов (0-100)

    // Временные метрики
    duration: { type: Number, required: true }, // Общее время игры в секундах
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    averageTimePerQuestion: { type: Number }, // Среднее время на вопрос в секундах

    // Метрики попыток и действий
    totalMoves: { type: Number, default: 0 }, // Всего ходов/попыток
    totalAttempts: { type: Number, default: 0 }, // Количество подходов к игре

    // Достижения и серии
    bestStreak: { type: Number, default: 0 }, // Лучшая серия правильных ответов
    finalStreak: { type: Number, default: 0 }, // Финальная серия

    // Статистика по категориям
    categoryStats: [CategoryStatsSchema],

    // Специфичные данные для разных типов игр
    gameData: {
        // Для memory-match
        cardCount: { type: Number, enum: [5, 10, 15, 20] },
        sessionsCount: { type: Number }, // Количество игровых сессий

        // Для будущих типов игр
        level: { type: Number },
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },

        // Дополнительные метрики
        additionalStats: { type: mongoose.Schema.Types.Mixed }
    },

    // Детали прохождения (опционально, для анализа)
    questionDetails: [{
        questionId: { type: String },
        isCorrect: { type: Boolean },
        timeSpent: { type: Number }, // секунды
        attempts: { type: Number } // попыток на этот вопрос
    }],

    // Метаданные
    completedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

// Индексы для быстрого поиска
GameResultSchema.index({ userId: 1, completedAt: -1 });
GameResultSchema.index({ testId: 1, completedAt: -1 });
GameResultSchema.index({ userEmail: 1, completedAt: -1 });
GameResultSchema.index({ gameType: 1 });

// Виртуальное поле для процента завершения
GameResultSchema.virtual('completionPercentage').get(function () {
    return this.totalQuestions > 0
        ? Math.round((this.correctAnswers / this.totalQuestions) * 100)
        : 0;
});

// Метод для расчета точности
GameResultSchema.methods.calculateAccuracy = function () {
    if (this.totalQuestions === 0) return 0;
    return Math.round((this.correctAnswers / this.totalQuestions) * 100);
};

// Статический метод для получения статистики пользователя по игре
GameResultSchema.statics.getUserGameStats = async function (userId, testId) {
    const results = await this.find({ userId, testId }).sort({ completedAt: -1 });

    if (results.length === 0) return null;

    const totalAttempts = results.length;
    const bestScore = Math.max(...results.map(r => r.score));
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / totalAttempts;
    const bestAccuracy = Math.max(...results.map(r => r.accuracy));
    const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / totalAttempts;
    const bestTime = Math.min(...results.map(r => r.duration));
    const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / totalAttempts;
    const lastPlayed = results[0].completedAt;

    return {
        totalAttempts,
        bestScore,
        avgScore: Math.round(avgScore * 10) / 10,
        bestAccuracy: Math.round(bestAccuracy),
        avgAccuracy: Math.round(avgAccuracy),
        bestTime: Math.round(bestTime),
        avgTime: Math.round(avgTime),
        lastPlayed
    };
};

module.exports = mongoose.model('GameResult', GameResultSchema);
