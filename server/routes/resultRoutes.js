const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Result = require('../models/Result');
const GameResult = require('../models/GameResult');
const Test = require('../models/Test');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const AssignmentProgress = require('../models/AssignmentProgress');
const Notification = require('../models/Notification');
const { verifyToken, requireAdmin, requireTeacher } = require('../middleware/authMiddleware');

// Сохраняем результат
router.post('/', async (req, res) => {
    try {
        const {
            clientResultId,
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
            hintsUsed,
            mode,
            assignmentId,
            classId
        } = req.body;

        if (!userEmail || !testId || !testTitle || !answers || !correctAnswers || !mistakes || !shuffledQuestions) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Проверка на дубликат по clientResultId
        if (clientResultId) {
            const existingResult = await Result.findOne({ clientResultId });
            if (existingResult) {
                console.log('[ResultRoutes] Duplicate result detected, clientResultId:', clientResultId);
                return res.status(200).json({
                    message: 'Result already exists',
                    duplicate: true,
                    resultId: existingResult._id
                });
            }
        }

        const newResult = new Result({
            clientResultId,
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
            hintsUsed,
            mode,
            assignmentId,
            classId
        });

        await newResult.save();
        console.log('[ResultRoutes] Result saved successfully, clientResultId:', clientResultId);

        // Обновляем AssignmentProgress, если это выполнение назначения
        if (assignmentId && classId) {
            try {
                const user = await User.findOne({ email: userEmail });
                const assignment = await Assignment.findById(assignmentId);

                if (user && assignment) {
                    const progress = await AssignmentProgress.findOne({
                        assignmentId,
                        studentId: user._id
                    });

                    if (progress && mode === 'exam') {
                        // Оцениваем статус для блокировок (хотя фронтенд не должен дать отправить)
                        const terminalStatuses = ['graded', 'excused', 'blocked'];
                        if (!terminalStatuses.includes(progress.status)) {
                            progress.status = 'submitted';
                            progress.attemptCount += 1;
                            progress.submittedAt = new Date();
                            progress.lastAttemptAt = new Date();

                            // Evaluate rewardPolicy BEFORE updating bestScore
                            if (assignment.rewardPolicy && score !== undefined && total > 0) {
                                const policy = assignment.rewardPolicy.trim();
                                const match = policy.match(/(score|percentage)\s*(>=|>|==|=)\s*(\d+)(?:\s*\?\s*(\w+))?/i);

                                if (match) {
                                    const variable = match[1].toLowerCase();
                                    const operator = match[2];
                                    const threshold = parseInt(match[3], 10);
                                    let rewardAmount = 0.1; // Default reward

                                    if (match[4]) {
                                        const parsedAmount = parseInt(match[4], 10);
                                        if (!isNaN(parsedAmount)) rewardAmount = parsedAmount;
                                    }

                                    const currentValue = variable === 'score' ? score : (score / total) * 100;
                                    const prevBestScore = progress.bestScore !== null ? progress.bestScore : -1;
                                    const prevValue = variable === 'score' ? prevBestScore : (prevBestScore / total) * 100;

                                    let currentMet = false;
                                    let prevMet = false;

                                    if (operator === '>') { currentMet = currentValue > threshold; prevMet = prevValue > threshold; }
                                    else if (operator === '>=') { currentMet = currentValue >= threshold; prevMet = prevValue >= threshold; }
                                    else if (operator === '==' || operator === '=') { currentMet = currentValue == threshold; prevMet = prevValue == threshold; }

                                    // Give reward only if newly met (prev best score didn't meet it)
                                    if (currentMet && !prevMet) {
                                        user.gems = (user.gems || 0) + Math.max(0, rewardAmount);
                                        await user.save();
                                        console.log(`[ResultRoutes] Reward policy met: gave ${rewardAmount} gems to user ${user.email}`);

                                        try {
                                            await Notification.create({
                                                user: user._id,
                                                type: 'gem',
                                                title: 'Награда получена!',
                                                message: `Вы получили ${rewardAmount} гемов за тест "${testTitle}"!`,
                                                relatedId: assignment._id
                                            });
                                        } catch (notifyErr) {
                                            console.error('Ошибка создания уведомления о награде:', notifyErr);
                                        }
                                    }
                                }
                            }

                            // Если в тесте есть счет, обновляем bestScore
                            if (score !== undefined) {
                                if (progress.bestScore === null || score > progress.bestScore) {
                                    progress.bestScore = score;
                                }
                            }

                            await progress.save();
                        }
                    }
                }
            } catch (progErr) {
                console.error('[ResultRoutes] Error updating AssignmentProgress:', progErr);
            }
        }

        res.status(201).json({ message: 'Result saved successfully', resultId: newResult._id });
    } catch (error) {
        console.error('Error saving result:', error);

        // Обработка ошибки дублирования (на случай race condition)
        if (error.code === 11000 && error.keyPattern?.clientResultId) {
            console.log('[ResultRoutes] Duplicate key error for clientResultId');
            return res.status(200).json({
                message: 'Result already exists',
                duplicate: true
            });
        }

        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, search, category, mode } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const validModes = ['standard', 'exam', 'practice'];
        const query = {};

        if (mode && validModes.includes(mode)) {
            query.mode = mode;
        } else {
            query.mode = { $in: validModes };
        }

        if (search) {
            query.$or = [
                { userEmail: { $regex: search, $options: 'i' } },
                { testTitle: { $regex: search, $options: 'i' } }
            ];
        }

        if (category && category !== 'all') {
            const tests = await Test.find({ category }).select('_id');
            const testIds = tests.map(t => t._id);
            query.testId = { $in: testIds };
        }

        const count = await Result.countDocuments(query);

        // Фильтр для исключения игровых результатов
        const results = await Result.find(query)
            .select('-shuffledQuestions -answers -correctAnswers -timePerQuestion')
            .populate({ path: 'testId', select: 'title category', populate: { path: 'category', select: 'name color' } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Map testId to test for frontend compatibility
        const mapped = results.map(r => ({
            ...r,
            test: r.testId && typeof r.testId === 'object' ? r.testId : undefined
        }));

        res.json({
            results: mapped,
            pagination: {
                totalResults: count,
                totalPages: Math.ceil(count / parseInt(limit)),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получить сгруппированную статистику по тестам для левой панели
router.get('/mine/groups', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const groups = await Result.aggregate([
            { $match: { userEmail, mode: { $in: ['standard', 'exam', 'practice'] } } },
            {
                $group: {
                    _id: "$testTitle",
                    count: { $sum: 1 },
                    lastAttempt: { $max: "$createdAt" },
                    testId: { $first: "$testId" },
                    bestScore: { $max: { $cond: [{ $gt: ["$total", 0] }, { $multiply: [{ $divide: ["$score", "$total"] }, 100] }, 0] } },
                    avgScore: { $avg: { $cond: [{ $gt: ["$total", 0] }, { $multiply: [{ $divide: ["$score", "$total"] }, 100] }, 0] } },
                    // Дополнительные данные для статистики
                    totalAttempts: { $sum: 1 },
                    totalTotal: { $first: "$total" }, // Предполагаем total одинаковый, берем первый
                    bestTime: { $min: { $cond: [{ $gt: ["$duration", 0] }, "$duration", null] } },
                    avgTime: { $avg: { $cond: [{ $gt: ["$duration", 0] }, "$duration", null] } }
                }
            },
            { $sort: { lastAttempt: -1 } }
        ]);

        // Преобразуем формат для фронтенда
        const formattedGroups = groups.map(g => ({
            testTitle: g._id,
            count: g.count,
            lastAttempt: g.lastAttempt,
            testId: g.testId,
            stats: {
                attempts: g.totalAttempts,
                bestScore: Math.round(g.bestScore || 0),
                avgScore: Math.round(g.avgScore || 0),
                total: g.totalTotal || 0,
                avgTime: Math.round(g.avgTime || 0),
                bestTime: g.bestTime || 0
            }
        }));

        res.json(formattedGroups);
    } catch (error) {
        console.error('Error fetching result groups:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получить результаты с пагинацией
router.get('/mine', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const { page = 1, limit = 20, testTitle, sortBy = 'date' } = req.query;

        const query = {
            userEmail,
            mode: { $in: ['standard', 'exam', 'practice'] }
        };

        if (testTitle && testTitle !== '__all__') {
            query.testTitle = testTitle;
        }

        const sortOption = sortBy === 'score'
            ? { score: -1, createdAt: -1 }
            : { createdAt: -1 };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitParsed = parseInt(limit);

        // Используем projection для оптимизации (исключаем тяжелые поля)
        // answers, shuffledQuestions, mistakes, correctAnswers не нужны для списка
        const results = await Result.find(query)
            .select('_id testTitle score total mode createdAt duration testId startTime endTime hintsUsed')
            .sort(sortOption)
            .skip(skip)
            .limit(limitParsed)
            .lean();

        const count = await Result.countDocuments(query);

        res.json({
            results,
            pagination: {
                totalResults: count,
                totalPages: Math.ceil(count / limitParsed),
                currentPage: parseInt(page),
                limit: limitParsed
            }
        });
    } catch (error) {
        console.error('Error fetching mine results:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===== Shared analytics builder =====
async function buildAnalytics(results, gameResults = []) {
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

    if (results.length === 0 && gameResults.length === 0) return emptyResponse;

    const normalizedResults = [
        ...results.map(result => {
            const percentage = result.total > 0 ? (result.score / result.total) * 100 : 0;
            const totalQuestions = result.total || 0;
            const correctAnswers = result.score || 0;
            const duration = result.duration || 0;
            const timePerQuestion = Array.isArray(result.timePerQuestion) ? result.timePerQuestion : [];

            return {
                _id: result._id,
                testId: result.testId,
                testTitle: result.testTitle,
                mode: result.mode || 'standard',
                createdAt: result.createdAt,
                percentage,
                totalQuestions,
                correctAnswers,
                duration,
                timeSpentForQuestions: timePerQuestion.reduce((sum, time) => sum + time, 0),
                questionsAnsweredForTime: timePerQuestion.length,
                displayScore: result.score || 0,
                displayTotal: result.total || 0,
            };
        }),
        ...gameResults.map(game => {
            const totalQuestions = game.totalQuestions || 0;
            const correctAnswers = game.correctAnswers || 0;
            const percentage = typeof game.accuracy === 'number'
                ? game.accuracy
                : (totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0);
            const duration = game.duration || 0;

            return {
                _id: game._id,
                testId: game.testId,
                testTitle: game.testTitle || 'Game',
                mode: 'game',
                createdAt: game.completedAt || game.createdAt,
                percentage,
                totalQuestions,
                correctAnswers,
                duration,
                timeSpentForQuestions: duration,
                questionsAnsweredForTime: totalQuestions,
                displayScore: correctAnswers,
                displayTotal: totalQuestions,
            };
        }),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalTests = normalizedResults.length;
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

    // Process ALL results (tests + games)
    normalizedResults.forEach(result => {
        const percentage = result.percentage;
        totalScore += percentage;
        totalQuestions += result.totalQuestions;
        correctAnswers += result.correctAnswers;

        if (percentage > bestScore) bestScore = percentage;
        if (percentage < worstScore) worstScore = percentage;

        // Time
        if (result.duration) {
            totalTimeSpent += result.duration;
        }
        if (result.questionsAnsweredForTime > 0) {
            totalQuestionsAnswered += result.questionsAnsweredForTime;
            totalTimeForAllQuestions += result.timeSpentForQuestions;
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
    const chronological = [...normalizedResults].reverse();
    chronological.forEach(result => {
        const percentage = result.percentage;
        if (percentage >= PASSING_THRESHOLD) {
            tempStreak++;
            if (tempStreak > bestStreak) bestStreak = tempStreak;
        } else {
            tempStreak = 0;
        }
    });
    // Current streak: count from newest going back
    currentStreak = 0;
    for (const result of normalizedResults) {
        const percentage = result.percentage;
        if (percentage >= PASSING_THRESHOLD) {
            currentStreak++;
        } else {
            break;
        }
    }

    // Performance data (last 20 tests)
    const performanceData = normalizedResults.slice(0, 20).reverse().map((result, index) => {
        return {
            name: `#${index + 1}`,
            score: Math.round(result.percentage),
            date: result.createdAt,
            testTitle: result.testTitle,
            duration: result.duration || 0,
            mode: result.mode || 'standard',
        };
    });

    // Category stats
    const testIds = [...new Set(normalizedResults.map(r => r.testId).filter(Boolean))];
    const tests = await Test.find({ _id: { $in: testIds } })
        .select('category')
        .populate('category');

    normalizedResults.forEach(result => {
        const currentTestId = typeof result.testId === 'string'
            ? result.testId
            : result.testId?.toString();
        const test = tests.find(t => t._id.toString() === currentTestId);
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
            cat.totalScore += result.percentage;
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
    const recentResults = normalizedResults.slice(0, 5).map(result => ({
        _id: result._id,
        testTitle: result.testTitle,
        score: result.displayScore,
        total: result.displayTotal,
        percentage: Math.round(result.percentage),
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
        })
            .select('_id testId testTitle score total mode createdAt duration timePerQuestion')
            .sort({ createdAt: -1 });
        const gameResults = await GameResult.find({ userId: req.user.userId })
            .select('_id testId testTitle score totalQuestions correctAnswers accuracy duration completedAt createdAt')
            .sort({ completedAt: -1 })
            .lean();
        const analytics = await buildAnalytics(results, gameResults);
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
        })
            .select('_id testId testTitle score total mode createdAt duration timePerQuestion')
            .sort({ createdAt: -1 });
        const gameResults = await GameResult.find({ userId: user._id })
            .select('_id testId testTitle score totalQuestions correctAnswers accuracy duration completedAt createdAt')
            .sort({ completedAt: -1 })
            .lean();
        const analytics = await buildAnalytics(results, gameResults);
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
            .select('_id score total mode createdAt duration timePerQuestion answers correctAnswers mistakes shuffledQuestions')
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
// Получить все результаты пользователя для конкретного теста
// Используется для отображения истории прохождения на странице теста
router.get('/test/:testId', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const testId = req.params.testId;
        const { page = 1, limit = 20 } = req.query;

        // Проверка валидности ObjectId
        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return res.status(400).json({ error: 'Некорректный ID теста' });
        }

        const query = {
            userEmail,
            testId,
            mode: { $in: ['standard', 'exam', 'practice'] }
        };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitParsed = parseInt(limit);

        const results = await Result.find(query)
            .sort({ createdAt: -1 })
            .select('_id score total mode createdAt endTime duration moves gameCardCount')
            .skip(skip)
            .limit(limitParsed)
            .lean();

        const count = await Result.countDocuments(query);

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

        res.json({
            results: formattedResults,
            pagination: {
                totalResults: count,
                totalPages: Math.ceil(count / limitParsed),
                currentPage: parseInt(page),
                limit: limitParsed
            }
        });
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
        const userEmail = req.user.email;
        let isTeacher = false;

        if (result.assignmentId) {
            const Assignment = require('../models/Assignment');
            const ClassModel = require('../models/Class');
            const assignment = await Assignment.findById(result.assignmentId);
            if (assignment) {
                const cls = await ClassModel.findById(assignment.classId);
                const currentUserId = req.userId || (req.user && req.user.id);
                if (cls && cls.teacherId && currentUserId && cls.teacherId.toString() === currentUserId.toString()) {
                    isTeacher = true;
                }
            }
        }

        // Проверяем принадлежность
        if (!isAdmin && !isTeacher && result.userEmail !== userEmail) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        let canViewDetails = true;
        let currentAttempts = 0;

        // Только для студента проверяем условия hideContent
        if (!isAdmin && !isTeacher && test.hideContent && test.attemptsToUnlock > 0) {
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
            response.hintsUsed = result.hintsUsed;
        }

        res.json(response);
    } catch (error) {
        console.error('Ошибка получения полного результата', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


// Удалить результат (только для админа)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await Result.findById(req.params.id);
        if (!result) {
            return res.status(404).json({ error: 'Result not found' });
        }

        await Result.findByIdAndDelete(req.params.id);
        res.json({ message: 'Result deleted successfully' });
    } catch (error) {
        console.error('Error deleting result:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * [Teacher] Получить результаты конкретного назначения (Assignment)
 */
router.get('/assignment/:assignmentId', verifyToken, requireTeacher, async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const results = await Result.find({ assignmentId }).sort({ createdAt: -1 });
        res.json(results);
    } catch (err) {
        console.error('Ошибка получения результатов назначения:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;

