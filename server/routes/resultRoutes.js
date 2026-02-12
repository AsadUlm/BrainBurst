const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Result = require('../models/Result');
const Test = require('../models/Test');
const User = require('../models/User');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Сохраняем результат
router.post('/', async (req, res) => {
    try {
        const {
            userEmail,
            testId,
            testTitle,
            score,
            total,
            answers,
            correctAnswers,
            mistakes,
            shuffledQuestions,
            startTime,
            endTime,
            duration,
            timePerQuestion,
            mode
        } = req.body;

        if (!userEmail || !testId || !testTitle || !answers || !correctAnswers || !mistakes || !shuffledQuestions) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newResult = new Result({
            userEmail,
            testId,
            testTitle,
            score,
            total,
            answers,
            correctAnswers,
            mistakes,
            shuffledQuestions,
            startTime,
            endTime,
            duration,
            timePerQuestion,
            mode
        });

        await newResult.save();
        res.status(201).json({ message: 'Result saved successfully' });
    } catch (error) {
        console.error('Error saving result:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        // Фильтр для исключения игровых результатов
        const results = await Result.find({ mode: { $in: ['standard', 'exam', 'practice'] } })
            .select('-shuffledQuestions -answers -correctAnswers -timePerQuestion')
            .populate({ path: 'testId', select: 'title category', populate: { path: 'category', select: 'name color' } })
            .sort({ createdAt: -1 })
            .lean();

        // Map testId to test for frontend compatibility
        const mapped = results.map(r => ({
            ...r,
            test: r.testId && typeof r.testId === 'object' ? r.testId : undefined
        }));

        res.json(mapped);
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/mine', verifyToken, async (req, res) => {
    const userEmail = req.user.email;
    // Фильтр для исключения игровых результатов
    const results = await Result.find({
        userEmail,
        mode: { $in: ['standard', 'exam', 'practice'] }
    }).sort({ createdAt: -1 });
    res.json(results);
});

// ===== Shared analytics builder =====
async function buildAnalytics(results) {
    const emptyResponse = {
        totalTests: 0,
        averageScore: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        bestScore: 0,
        worstScore: 0,
        averageTime: 0,
        totalTimeSpent: 0,
        averageTimePerQuestion: 0,
        uniqueTests: 0,
        recentResults: [],
        categoryStats: [],
        performanceData: [],
        modeStats: { standard: 0, exam: 0, practice: 0, game: 0 },
        scoreDistribution: { excellent: 0, good: 0, average: 0, poor: 0 },
        streakData: { currentStreak: 0, bestStreak: 0, passingThreshold: 70 },
        weeklyActivity: [],
    };

    if (results.length === 0) return emptyResponse;

    const totalTests = results.length;
    let totalScore = 0;
    let totalQuestions = 0;
    let correctAnswers = 0;
    let bestScore = 0;
    let worstScore = 100;
    let totalTimeSpent = 0;
    let totalQuestionsAnswered = 0;
    let totalTimeForAllQuestions = 0;

    // Mode stats
    const modeStats = { standard: 0, exam: 0, practice: 0, game: 0 };

    // Score distribution (percentage ranges)
    const scoreDistribution = { excellent: 0, good: 0, average: 0, poor: 0 };

    // Streak data
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    const PASSING_THRESHOLD = 70;

    // Unique tests
    const uniqueTestIds = new Set();

    // Weekly activity (last 8 weeks)
    const weeklyMap = new Map();
    const now = new Date();

    const categoryMap = new Map();

    // Process ALL results
    results.forEach(result => {
        const percentage = result.total > 0 ? (result.score / result.total) * 100 : 0;
        totalScore += percentage;
        totalQuestions += result.total;
        correctAnswers += result.score;

        if (percentage > bestScore) bestScore = percentage;
        if (percentage < worstScore) worstScore = percentage;

        // Time
        if (result.duration) {
            totalTimeSpent += result.duration;
        }
        if (result.timePerQuestion && Array.isArray(result.timePerQuestion)) {
            totalQuestionsAnswered += result.timePerQuestion.length;
            totalTimeForAllQuestions += result.timePerQuestion.reduce((sum, time) => sum + time, 0);
        }

        // Mode
        const mode = result.mode || 'standard';
        if (modeStats[mode] !== undefined) modeStats[mode]++;

        // Score distribution
        if (percentage >= 90) scoreDistribution.excellent++;
        else if (percentage >= 70) scoreDistribution.good++;
        else if (percentage >= 50) scoreDistribution.average++;
        else scoreDistribution.poor++;

        // Unique tests
        uniqueTestIds.add(result.testId);

        // Weekly activity (last 8 weeks)
        const resultDate = new Date(result.createdAt);
        const diffMs = now - resultDate;
        const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
        if (diffWeeks < 8) {
            const weekKey = diffWeeks;
            if (!weeklyMap.has(weekKey)) {
                weeklyMap.set(weekKey, { tests: 0, totalScore: 0 });
            }
            const week = weeklyMap.get(weekKey);
            week.tests++;
            week.totalScore += percentage;
        }
    });

    // Streak calculation (results sorted newest first, reverse for chronological)
    const chronological = [...results].reverse();
    chronological.forEach(result => {
        const percentage = result.total > 0 ? (result.score / result.total) * 100 : 0;
        if (percentage >= PASSING_THRESHOLD) {
            tempStreak++;
            if (tempStreak > bestStreak) bestStreak = tempStreak;
        } else {
            tempStreak = 0;
        }
    });
    // Current streak: count from newest going back
    currentStreak = 0;
    for (const result of results) {
        const percentage = result.total > 0 ? (result.score / result.total) * 100 : 0;
        if (percentage >= PASSING_THRESHOLD) {
            currentStreak++;
        } else {
            break;
        }
    }

    // Performance data (last 20 tests)
    const performanceData = results.slice(0, 20).reverse().map((result, index) => {
        const percentage = result.total > 0 ? (result.score / result.total) * 100 : 0;
        return {
            name: `#${index + 1}`,
            score: Math.round(percentage),
            date: result.createdAt,
            testTitle: result.testTitle,
            duration: result.duration || 0,
            mode: result.mode || 'standard',
        };
    });

    // Category stats
    const testIds = [...new Set(results.map(r => r.testId))];
    const tests = await Test.find({ _id: { $in: testIds } }).populate('category');

    results.forEach(result => {
        const test = tests.find(t => t._id.toString() === result.testId);
        if (test && test.category) {
            const categoryName = test.category.name;
            if (!categoryMap.has(categoryName)) {
                categoryMap.set(categoryName, {
                    name: categoryName,
                    color: test.category.color,
                    tests: 0,
                    totalScore: 0,
                });
            }
            const cat = categoryMap.get(categoryName);
            cat.tests += 1;
            const percentage = result.total > 0 ? (result.score / result.total) * 100 : 0;
            cat.totalScore += percentage;
        }
    });

    const categoryStats = Array.from(categoryMap.values()).map(cat => ({
        name: cat.name,
        color: cat.color,
        tests: cat.tests,
        avgScore: Math.round(cat.totalScore / cat.tests),
    }));

    const averageScore = totalTests > 0 ? totalScore / totalTests : 0;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const averageTime = totalTests > 0 ? Math.round(totalTimeSpent / totalTests) : 0;
    const averageTimePerQuestion = totalQuestionsAnswered > 0
        ? Math.round(totalTimeForAllQuestions / totalQuestionsAnswered)
        : 0;

    // Recent 5 results
    const recentResults = results.slice(0, 5).map(result => ({
        _id: result._id,
        testTitle: result.testTitle,
        score: result.score,
        total: result.total,
        percentage: result.total > 0 ? Math.round((result.score / result.total) * 100) : 0,
        createdAt: result.createdAt,
        duration: result.duration || 0,
        mode: result.mode || 'standard',
    }));

    // Weekly activity array (last 8 weeks, index 0 = current week)
    const weeklyActivity = [];
    for (let i = 7; i >= 0; i--) {
        const weekData = weeklyMap.get(i) || { tests: 0, totalScore: 0 };
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - i * 7);
        weeklyActivity.push({
            week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            tests: weekData.tests,
            avgScore: weekData.tests > 0 ? Math.round(weekData.totalScore / weekData.tests) : 0,
        });
    }

    return {
        totalTests,
        averageScore: Math.round(averageScore * 10) / 10,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        bestScore: Math.round(bestScore),
        worstScore: totalTests > 0 ? Math.round(worstScore) : 0,
        averageTime,
        totalTimeSpent,
        averageTimePerQuestion,
        uniqueTests: uniqueTestIds.size,
        recentResults,
        categoryStats,
        performanceData,
        modeStats,
        scoreDistribution,
        streakData: { currentStreak, bestStreak, passingThreshold: PASSING_THRESHOLD },
        weeklyActivity,
    };
}

// Получить аналитику пользователя
router.get('/analytics', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        // Фильтр для исключения игровых результатов
        const results = await Result.find({
            userEmail,
            mode: { $in: ['standard', 'exam', 'practice'] }
        }).sort({ createdAt: -1 });
        const analytics = await buildAnalytics(results);
        res.json(analytics);
    } catch (error) {
        console.error('Error loading analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получить список пользователей (только для админа)
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
    try {
        const users = await User.find({}, 'email _id').sort({ email: 1 });
        res.json(users);
    } catch (error) {
        console.error('Error loading users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получить аналитику конкретного пользователя (только для админа)
router.get('/analytics/:userId', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userEmail = user.email;
        // Фильтр для исключения игровых результатов
        const results = await Result.find({
            userEmail,
            mode: { $in: ['standard', 'exam', 'practice'] }
        }).sort({ createdAt: -1 });
        const analytics = await buildAnalytics(results);
        res.json(analytics);
    } catch (error) {
        console.error('Error loading user analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получить количество попыток для конкретного теста
// Считаются только стандартный и экзаменационный режимы
router.get('/attempts/:testId', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const testId = req.params.testId;

        const count = await Result.countDocuments({
            userEmail,
            testId,
            mode: { $in: ['standard', 'exam'] }
        });

        res.json({ attempts: count });
    } catch (error) {
        console.error('Ошибка получения количества попыток:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * GET /api/results/test/:testId/analytics
 * Получить аналитику для конкретного теста для текущего пользователя
 * Используется для вкладки аналитики на странице теста
 * 
 * Требует авторизации
 */
router.get('/test/:testId/analytics', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const testId = req.params.testId;

        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return res.status(400).json({ error: 'Некорректный ID теста' });
        }

        const results = await Result.find({
            userEmail,
            testId,
            mode: { $in: ['standard', 'exam', 'practice'] }
        })
            .sort({ createdAt: -1 })
            .lean();

        if (results.length === 0) {
            return res.json({
                totalAttempts: 0,
                averageScore: 0,
                bestScore: 0,
                worstScore: 0,
                averageTime: 0,
                totalTimeSpent: 0,
                modeStats: { standard: 0, exam: 0, practice: 0, game: 0 },
                progressData: [],
                questionStats: [],
                recentAttempts: [],
                improvementRate: 0,
            });
        }

        const totalAttempts = results.length;
        let totalScore = 0;
        let bestScore = 0;
        let worstScore = 100;
        let totalTimeSpent = 0;
        const modeStats = { standard: 0, exam: 0, practice: 0, game: 0 };
        const questionMap = new Map();

        results.forEach((result) => {
            const percentage = result.total > 0 ? (result.score / result.total) * 100 : 0;
            totalScore += percentage;

            if (percentage > bestScore) bestScore = percentage;
            if (percentage < worstScore) worstScore = percentage;

            if (result.duration) totalTimeSpent += result.duration;

            const mode = result.mode || 'standard';
            if (modeStats[mode] !== undefined) modeStats[mode]++;

            if (result.shuffledQuestions && result.answers && result.correctAnswers) {
                result.shuffledQuestions.forEach((question, qIndex) => {
                    const qId = question._id ? question._id.toString() : `q-${qIndex}`;

                    if (!questionMap.has(qId)) {
                        questionMap.set(qId, {
                            questionId: qId,
                            questionText: question.text,
                            correct: 0,
                            incorrect: 0,
                            totalAttempts: 0,
                            totalTime: 0,
                        });
                    }

                    const stat = questionMap.get(qId);
                    stat.totalAttempts++;

                    // Определяем правильность ответа в зависимости от типа вопроса
                    const userAnswer = result.answers[qIndex];
                    const questionType = question.questionType || 'multiple-choice';
                    let isCorrect = false;

                    if (questionType === 'puzzle') {
                        // Для puzzle сравниваем массив слов с правильным предложением
                        const userSentence = Array.isArray(userAnswer) ? userAnswer.join(' ') : '';
                        const correctSentence = question.correctSentence || (question.puzzleWords ? question.puzzleWords.join(' ') : '');
                        isCorrect = userSentence === correctSentence;
                    } else if (questionType === 'open-text' || (question.options && question.options.length === 1)) {
                        // Для открытых вопросов сравниваем текст
                        const correctAnswer = question.options && question.options[0] ? question.options[0].toLowerCase().trim() : '';
                        const userAnswerText = typeof userAnswer === 'string' ? userAnswer.toLowerCase().trim() : '';
                        isCorrect = userAnswerText === correctAnswer;
                    } else {
                        // Для множественного выбора сравниваем индексы
                        isCorrect = userAnswer === result.correctAnswers[qIndex];
                    }

                    if (isCorrect) {
                        stat.correct++;
                    } else {
                        stat.incorrect++;
                    }

                    if (result.timePerQuestion && result.timePerQuestion[qIndex] !== undefined) {
                        stat.totalTime += result.timePerQuestion[qIndex];
                    }
                });
            }
        });

        const averageScore = totalScore / totalAttempts;
        const averageTime = totalAttempts > 0 ? Math.round(totalTimeSpent / totalAttempts) : 0;

        const progressData = results
            .slice(0, 20)
            .reverse()
            .map((result, index) => ({
                attempt: totalAttempts > 20 ? totalAttempts - 20 + index + 1 : index + 1,
                score: result.total > 0 ? Math.round((result.score / result.total) * 100) : 0,
                date: result.createdAt,
                mode: result.mode || 'standard',
                duration: result.duration || 0,
            }));

        const questionStats = Array.from(questionMap.values())
            .map(stat => {
                stat.avgTime = stat.totalAttempts > 0 ? Math.round(stat.totalTime / stat.totalAttempts) : 0;
                stat.accuracy = stat.totalAttempts > 0
                    ? Math.round((stat.correct / stat.totalAttempts) * 100)
                    : 0;
                return stat;
            })
            .sort((a, b) => a.accuracy - b.accuracy);

        const recentAttempts = results.slice(0, 5).map((result, index) => ({
            attempt: totalAttempts - index,
            score: result.total > 0 ? Math.round((result.score / result.total) * 100) : 0,
            mode: result.mode || 'standard',
            date: result.createdAt,
            duration: result.duration || 0,
        }));

        let improvementRate = 0;
        if (totalAttempts >= 2) {
            const firstAttempts = results.slice(-Math.min(5, totalAttempts));
            const lastAttempts = results.slice(0, Math.min(5, totalAttempts));

            const firstAvg = firstAttempts.reduce((sum, r) => {
                const pct = r.total > 0 ? (r.score / r.total) * 100 : 0;
                return sum + pct;
            }, 0) / firstAttempts.length;

            const lastAvg = lastAttempts.reduce((sum, r) => {
                const pct = r.total > 0 ? (r.score / r.total) * 100 : 0;
                return sum + pct;
            }, 0) / lastAttempts.length;

            improvementRate = Math.round(lastAvg - firstAvg);
        }

        res.json({
            totalAttempts,
            averageScore: Math.round(averageScore * 10) / 10,
            bestScore: Math.round(bestScore),
            worstScore: totalAttempts > 0 ? Math.round(worstScore) : 0,
            averageTime,
            totalTimeSpent,
            modeStats,
            progressData,
            questionStats,
            recentAttempts,
            improvementRate,
        });
    } catch (error) {
        console.error('Ошибка получения аналитики для теста:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * GET /api/results/test/:testId
 * Получить все результаты пользователя для конкретного теста
 * Используется для отображения истории прохождения на странице теста
 * 
 * Требует авторизации
 * 
 * Response:
 * [
 *   {
 *     _id: string,
 *     score: number,
 *     totalQuestions: number,
 *     mode: 'standard' | 'exam' | 'practice' | 'game',
 *     completedAt: Date,
 *     timeTaken: number (в секундах),
 *     moves?: number (для игрового режима),
 *     gameCardCount?: number (для игрового режима)
 *   }
 * ]
 */
router.get('/test/:testId', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const testId = req.params.testId;

        // Проверка валидности ObjectId
        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return res.status(400).json({ error: 'Некорректный ID теста' });
        }

        const results = await Result.find({
            userEmail,
            testId,
            mode: { $in: ['standard', 'exam', 'practice'] }
        })
            .sort({ createdAt: -1 })
            .select('_id score total mode createdAt endTime duration moves gameCardCount')
            .lean();

        // Преобразуем данные для клиента
        const formattedResults = results.map(result => ({
            _id: result._id,
            score: result.score,
            totalQuestions: result.total,
            mode: result.mode || 'standard',
            completedAt: result.endTime || result.createdAt,
            timeTaken: result.duration,
            moves: result.moves,
            gameCardCount: result.gameCardCount
        }));

        res.json(formattedResults);
    } catch (error) {
        console.error('Ошибка получения результатов для теста:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const result = await Result.findById(req.params.id);
        if (!result) {
            return res.status(404).json({ error: 'Результат не найден' });
        }

        const test = await Test.findById(result.testId);
        if (!test) {
            return res.status(404).json({ error: 'Тест не найден' });
        }

        // Проверяем, скрыто ли содержимое и нужно ли проверять количество попыток
        // Админы всегда имеют доступ к результатам
        const isAdmin = req.user.role === 'admin';
        let canViewDetails = true;
        let currentAttempts = 0;

        if (!isAdmin && test.hideContent && test.attemptsToUnlock > 0) {
            const userEmail = req.user.email;
            currentAttempts = await Result.countDocuments({
                userEmail,
                testId: test._id,
                mode: { $in: ['standard', 'exam'] }
            });
            canViewDetails = currentAttempts >= test.attemptsToUnlock;
        }

        const response = {
            _id: result._id,
            testTitle: result.testTitle,
            score: result.score,
            total: result.total,
            createdAt: result.createdAt,
            canViewDetails,
            attemptsRequired: test.hideContent ? test.attemptsToUnlock : 0,
            currentAttempts: currentAttempts,
        };

        // Отправляем детали только если пользователь имеет доступ
        if (canViewDetails) {
            response.answers = result.answers;
            response.correctAnswers = result.correctAnswers;
            response.mistakes = result.mistakes;
            response.shuffledQuestions = result.shuffledQuestions;
        }

        res.json(response);
    } catch (error) {
        console.error('Ошибка получения полного результата', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;
