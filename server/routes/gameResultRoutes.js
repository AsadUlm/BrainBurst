const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const GameResult = require('../models/GameResult');
const Test = require('../models/Test');
const User = require('../models/User');
const Category = require('../models/Category');
const { verifyToken, requireAdmin, requireTeacher } = require('../middleware/authMiddleware');

// Сохранить результат игры
router.post('/', verifyToken, async (req, res) => {
    try {
        const {
            testId,
            testTitle,
            gameType,
            score,
            totalQuestions,
            correctAnswers,
            duration,
            startTime,
            endTime,
            totalMoves,
            totalAttempts,
            bestStreak,
            finalStreak,
            categoryStats,
            gameData,
            questionDetails,
            assignmentId,
            classId
        } = req.body;

        const userId = req.user.userId;
        const userEmail = req.user.email;

        // Валидация обязательных полей
        if (!testId || !testTitle || !gameType || score === undefined || !totalQuestions || correctAnswers === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Расчет точности
        const accuracy = totalQuestions > 0
            ? Math.round((correctAnswers / totalQuestions) * 100)
            : 0;

        // Расчет среднего времени на вопрос
        const averageTimePerQuestion = totalQuestions > 0 && duration
            ? Math.round(duration / totalQuestions)
            : 0;

        const newGameResult = new GameResult({
            userId,
            userEmail,
            testId,
            testTitle,
            gameType,
            score,
            totalQuestions,
            correctAnswers,
            accuracy,
            duration: duration || 0,
            startTime: startTime || new Date(),
            endTime: endTime || new Date(),
            averageTimePerQuestion,
            totalMoves: totalMoves || 0,
            totalAttempts: totalAttempts || 1,
            bestStreak: bestStreak || 0,
            finalStreak: finalStreak || 0,
            categoryStats: categoryStats || [],
            gameData: gameData || {},
            questionDetails: questionDetails || [],
            assignmentId,
            classId
        });

        await newGameResult.save();
        res.status(201).json({
            message: 'Game result saved successfully',
            resultId: newGameResult._id
        });
    } catch (error) {
        console.error('Error saving game result:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получить все игровые результаты (только для админа)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { gameType, testId, userId, limit } = req.query;

        const filter = {};
        if (gameType) filter.gameType = gameType;
        if (testId) filter.testId = testId;
        if (userId) filter.userId = userId;

        let query = GameResult.find(filter)
            .populate({ path: 'userId', select: 'name email' })
            .populate({ path: 'testId', select: 'title category', populate: { path: 'category', select: 'name color' } })
            .sort({ completedAt: -1 });

        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const results = await query.lean();

        res.json(results);
    } catch (error) {
        console.error('Error fetching game results:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получить мои игровые результаты
router.get('/assignment/:assignmentId', verifyToken, requireTeacher, async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const results = await GameResult.find({ assignmentId })
            .populate({ path: 'userId', select: 'name email' })
            .sort({ completedAt: -1 })
            .lean();
        res.json(results);
    } catch (error) {
        console.error('Error fetching game results for assignment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получить мои игровые результаты
router.get('/mine', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { gameType, testId } = req.query;

        const filter = { userId };
        if (gameType) filter.gameType = gameType;
        if (testId) filter.testId = testId;

        const results = await GameResult.find(filter)
            .populate({ path: 'testId', select: 'title category', populate: { path: 'category', select: 'name color' } })
            .sort({ completedAt: -1 })
            .lean();

        // Маппинг для совместимости с фронтендом
        const mapped = results.map(r => ({
            ...r,
            test: r.testId && typeof r.testId === 'object' ? r.testId : undefined,
            createdAt: r.completedAt // Для совместимости
        }));

        res.json(mapped);
    } catch (error) {
        console.error('Error fetching user game results:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получить детали конкретного игрового результата
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const isAdmin = req.user.role === 'admin';

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid result ID' });
        }

        const result = await GameResult.findById(id)
            .populate({ path: 'testId', select: 'title category', populate: { path: 'category', select: 'name color' } })
            .lean();

        if (!result) {
            return res.status(404).json({ error: 'Game result not found' });
        }

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

        // Проверка прав доступа
        if (!isAdmin && !isTeacher && result.userId.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Маппинг для совместимости
        const mapped = {
            ...result,
            test: result.testId && typeof result.testId === 'object' ? result.testId : undefined,
            createdAt: result.completedAt
        };

        res.json(mapped);
    } catch (error) {
        console.error('Error fetching game result details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получить статистику по конкретной игре/тесту
router.get('/stats/:testId', verifyToken, async (req, res) => {
    try {
        const { testId } = req.params;
        const userId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return res.status(400).json({ error: 'Invalid test ID' });
        }

        const stats = await GameResult.getUserGameStats(userId, testId);

        if (!stats) {
            return res.status(404).json({ message: 'No game results found for this test' });
        }

        res.json(stats);
    } catch (error) {
        console.error('Error fetching game stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получить общую статистику по играм для пользователя
router.get('/analytics/mine', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { gameType } = req.query;

        const filter = { userId };
        if (gameType) filter.gameType = gameType;

        const results = await GameResult.find(filter)
            .populate({ path: 'testId', select: 'title category' })
            .sort({ completedAt: -1 })
            .lean();

        if (results.length === 0) {
            return res.json({
                totalGames: 0,
                totalTime: 0,
                averageScore: 0,
                averageAccuracy: 0,
                bestScore: 0,
                bestAccuracy: 0,
                totalCorrectAnswers: 0,
                totalQuestions: 0,
                gamesPerType: {},
                recentResults: []
            });
        }

        // Вычисление статистики
        const totalGames = results.length;
        const totalTime = results.reduce((sum, r) => sum + (r.duration || 0), 0);
        const totalScore = results.reduce((sum, r) => sum + r.score, 0);
        const totalAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0);
        const bestScore = Math.max(...results.map(r => r.score));
        const bestAccuracy = Math.max(...results.map(r => r.accuracy));
        const totalCorrectAnswers = results.reduce((sum, r) => sum + r.correctAnswers, 0);
        const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);
        const bestStreak = Math.max(...results.map(r => r.bestStreak || 0));
        const totalMoves = results.reduce((sum, r) => sum + (r.totalMoves || 0), 0);
        const averageTime = totalGames > 0 ? Math.round(totalTime / totalGames) : 0;

        // Количество игр по типам
        const gamesPerType = results.reduce((acc, r) => {
            acc[r.gameType] = (acc[r.gameType] || 0) + 1;
            return acc;
        }, {});

        // Последние 10 результатов для графиков
        const recentGames = results.slice(0, 10).map(r => ({
            _id: r._id,
            testId: r.testId?._id || r.testId,
            testTitle: r.testId?.title || 'Unknown',
            gameType: r.gameType,
            score: r.score,
            totalQuestions: r.totalQuestions,
            correctAnswers: r.correctAnswers,
            accuracy: r.accuracy,
            duration: r.duration,
            bestStreak: r.bestStreak || 0,
            finalStreak: r.finalStreak || 0,
            totalMoves: r.totalMoves || 0,
            createdAt: r.completedAt
        }));

        res.json({
            totalGames,
            totalTime,
            averageTime,
            averageScore: Math.round((totalScore / totalGames) * 10) / 10,
            averageAccuracy: Math.round(totalAccuracy / totalGames),
            bestScore,
            bestAccuracy,
            bestStreak,
            totalMoves,
            totalCorrectAnswers,
            totalQuestions,
            gamesPerType,
            recentGames
        });
    } catch (error) {
        console.error('Error fetching game analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получить статистику по всем играм (для админа)
router.get('/analytics/all', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { gameType, startDate, endDate } = req.query;

        const filter = {};
        if (gameType) filter.gameType = gameType;
        if (startDate || endDate) {
            filter.completedAt = {};
            if (startDate) filter.completedAt.$gte = new Date(startDate);
            if (endDate) filter.completedAt.$lte = new Date(endDate);
        }

        const results = await GameResult.find(filter)
            .populate({ path: 'testId', select: 'title category' })
            .populate({ path: 'userId', select: 'name email' })
            .lean();

        if (results.length === 0) {
            return res.json({
                totalGames: 0,
                uniquePlayers: 0,
                uniqueTests: 0,
                averageScore: 0,
                averageAccuracy: 0,
                totalTime: 0,
                gamesPerType: {},
                topPlayers: [],
                popularTests: []
            });
        }

        const totalGames = results.length;
        const uniquePlayers = new Set(results.map(r => r.userId?._id?.toString())).size;
        const uniqueTests = new Set(results.map(r => r.testId?._id?.toString())).size;
        const totalScore = results.reduce((sum, r) => sum + r.score, 0);
        const totalAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0);
        const totalTime = results.reduce((sum, r) => sum + (r.duration || 0), 0);

        // Игры по типам
        const gamesPerType = results.reduce((acc, r) => {
            acc[r.gameType] = (acc[r.gameType] || 0) + 1;
            return acc;
        }, {});

        // Топ игроков
        const playerStats = {};
        results.forEach(r => {
            const playerId = r.userId?._id?.toString();
            if (!playerId) return;

            if (!playerStats[playerId]) {
                playerStats[playerId] = {
                    userId: playerId,
                    userName: r.userId?.name || 'Unknown',
                    userEmail: r.userId?.email || '',
                    gamesPlayed: 0,
                    totalScore: 0,
                    averageAccuracy: 0
                };
            }
            playerStats[playerId].gamesPlayed++;
            playerStats[playerId].totalScore += r.score;
            playerStats[playerId].averageAccuracy += r.accuracy;
        });

        const topPlayers = Object.values(playerStats)
            .map(p => ({
                ...p,
                averageAccuracy: Math.round(p.averageAccuracy / p.gamesPlayed)
            }))
            .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
            .slice(0, 10);

        // Популярные тесты
        const testStats = {};
        results.forEach(r => {
            const testId = r.testId?._id?.toString();
            if (!testId) return;

            if (!testStats[testId]) {
                testStats[testId] = {
                    testId,
                    testTitle: r.testId?.title || 'Unknown',
                    timesPlayed: 0,
                    averageScore: 0,
                    averageAccuracy: 0
                };
            }
            testStats[testId].timesPlayed++;
            testStats[testId].averageScore += r.score;
            testStats[testId].averageAccuracy += r.accuracy;
        });

        const popularTests = Object.values(testStats)
            .map(t => ({
                ...t,
                averageScore: Math.round((t.averageScore / t.timesPlayed) * 10) / 10,
                averageAccuracy: Math.round(t.averageAccuracy / t.timesPlayed)
            }))
            .sort((a, b) => b.timesPlayed - a.timesPlayed)
            .slice(0, 10);

        res.json({
            totalGames,
            uniquePlayers,
            uniqueTests,
            averageScore: Math.round((totalScore / totalGames) * 10) / 10,
            averageAccuracy: Math.round(totalAccuracy / totalGames),
            totalTime,
            gamesPerType,
            topPlayers,
            popularTests
        });
    } catch (error) {
        console.error('Error fetching game analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Удалить игровой результат (только для админа)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid result ID' });
        }

        const result = await GameResult.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ error: 'Game result not found' });
        }

        res.json({ message: 'Game result deleted successfully' });
    } catch (error) {
        console.error('Error deleting game result:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получить аналитику завершенных игр для конкретного пользователя (только админ)
router.get('/analytics/user/:userId', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { gameType } = req.query;

        const filter = { userId };
        if (gameType) filter.gameType = gameType;

        const results = await GameResult.find(filter)
            .populate({ path: 'testId', select: 'title category' })
            .sort({ completedAt: -1 })
            .lean();

        if (results.length === 0) {
            return res.json({
                totalGames: 0,
                totalTime: 0,
                averageTime: 0,
                averageScore: 0,
                averageAccuracy: 0,
                bestScore: 0,
                bestAccuracy: 0,
                bestStreak: 0,
                totalMoves: 0,
                totalCorrectAnswers: 0,
                totalQuestions: 0,
                gamesPerType: {},
                recentGames: []
            });
        }

        // Вычисление статистики
        const totalGames = results.length;
        const totalTime = results.reduce((sum, r) => sum + (r.duration || 0), 0);
        const totalScore = results.reduce((sum, r) => sum + r.score, 0);
        const totalAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0);
        const bestScore = Math.max(...results.map(r => r.score));
        const bestAccuracy = Math.max(...results.map(r => r.accuracy));
        const totalCorrectAnswers = results.reduce((sum, r) => sum + r.correctAnswers, 0);
        const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);
        const bestStreak = Math.max(...results.map(r => r.bestStreak || 0));
        const totalMoves = results.reduce((sum, r) => sum + (r.totalMoves || 0), 0);
        const averageTime = totalGames > 0 ? Math.round(totalTime / totalGames) : 0;

        // Количество игр по типам
        const gamesPerType = results.reduce((acc, r) => {
            acc[r.gameType] = (acc[r.gameType] || 0) + 1;
            return acc;
        }, {});

        // Последние 10 результатов для графиков
        const recentGames = results.slice(0, 10).map(r => ({
            _id: r._id,
            testId: r.testId?._id || r.testId,
            testTitle: r.testId?.title || 'Unknown',
            gameType: r.gameType,
            score: r.score,
            totalQuestions: r.totalQuestions,
            correctAnswers: r.correctAnswers,
            accuracy: r.accuracy,
            duration: r.duration,
            bestStreak: r.bestStreak || 0,
            finalStreak: r.finalStreak || 0,
            totalMoves: r.totalMoves || 0,
            createdAt: r.completedAt
        }));

        res.json({
            totalGames,
            totalTime,
            averageTime,
            averageScore: Math.round((totalScore / totalGames) * 10) / 10,
            averageAccuracy: Math.round(totalAccuracy / totalGames),
            bestScore,
            bestAccuracy,
            bestStreak,
            totalMoves,
            totalCorrectAnswers,
            totalQuestions,
            gamesPerType,
            recentGames
        });
    } catch (error) {
        console.error('Error fetching user game analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
