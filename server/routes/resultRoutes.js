const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Test = require('../models/Test');
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
            shuffledQuestions
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
            shuffledQuestions
        });

        await newResult.save();
        res.status(201).json({ message: 'Result saved successfully' });
    } catch (error) {
        console.error('Error saving result:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/', verifyToken, requireAdmin, async (req, res) => {
    const results = await Result.find().sort({ createdAt: -1 });
    res.json(results);
});

router.get('/mine', verifyToken, async (req, res) => {
    const userEmail = req.user.email;
    const results = await Result.find({ userEmail }).sort({ createdAt: -1 });
    res.json(results);
});

// Получить аналитику пользователя
router.get('/analytics', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const results = await Result.find({ userEmail }).sort({ createdAt: -1 });

        if (results.length === 0) {
            return res.json({
                totalTests: 0,
                averageScore: 0,
                totalQuestions: 0,
                correctAnswers: 0,
                incorrectAnswers: 0,
                bestScore: 0,
                worstScore: 0,
                recentResults: [],
                categoryStats: [],
                performanceData: [],
            });
        }

        // Общая статистика
        const totalTests = results.length;
        let totalScore = 0;
        let totalQuestions = 0;
        let correctAnswers = 0;
        let bestScore = 0;
        let worstScore = 100;

        // Статистика по категориям
        const categoryMap = new Map();

        // Performance data (последние 10 тестов)
        const performanceData = results.slice(0, 10).reverse().map((result, index) => {
            const percentage = result.total > 0 ? (result.score / result.total) * 100 : 0;
            totalScore += percentage;
            totalQuestions += result.total;
            correctAnswers += result.score;

            if (percentage > bestScore) bestScore = percentage;
            if (percentage < worstScore) worstScore = percentage;

            return {
                name: `Test ${index + 1}`,
                score: Math.round(percentage),
                date: result.createdAt,
                testTitle: result.testTitle,
            };
        });

        // Процесс остальных результатов для полной статистики
        results.slice(10).forEach(result => {
            const percentage = result.total > 0 ? (result.score / result.total) * 100 : 0;
            totalScore += percentage;
            totalQuestions += result.total;
            correctAnswers += result.score;

            if (percentage > bestScore) bestScore = percentage;
            if (percentage < worstScore) worstScore = percentage;
        });

        // Получаем категории тестов
        const testIds = [...new Set(results.map(r => r.testId))];
        const tests = await Test.find({ _id: { $in: testIds } }).populate('category');

        // Группируем по категориям
        results.forEach(result => {
            const test = tests.find(t => t._id.toString() === result.testId);
            if (test && test.category) {
                const categoryName = test.category.name;
                if (!categoryMap.has(categoryName)) {
                    categoryMap.set(categoryName, {
                        name: categoryName,
                        color: test.category.color,
                        tests: 0,
                        avgScore: 0,
                        totalScore: 0,
                    });
                }
                const cat = categoryMap.get(categoryName);
                cat.tests += 1;
                const percentage = result.total > 0 ? (result.score / result.total) * 100 : 0;
                cat.totalScore += percentage;
                cat.avgScore = cat.totalScore / cat.tests;
            }
        });

        const categoryStats = Array.from(categoryMap.values()).map(cat => ({
            name: cat.name,
            color: cat.color,
            tests: cat.tests,
            avgScore: Math.round(cat.avgScore),
        }));

        const averageScore = totalTests > 0 ? totalScore / totalTests : 0;
        const incorrectAnswers = totalQuestions - correctAnswers;

        // Последние 5 результатов
        const recentResults = results.slice(0, 5).map(result => ({
            _id: result._id,
            testTitle: result.testTitle,
            score: result.score,
            total: result.total,
            percentage: result.total > 0 ? Math.round((result.score / result.total) * 100) : 0,
            createdAt: result.createdAt,
        }));

        res.json({
            totalTests,
            averageScore: Math.round(averageScore * 10) / 10,
            totalQuestions,
            correctAnswers,
            incorrectAnswers,
            bestScore: Math.round(bestScore),
            worstScore: totalTests > 0 ? Math.round(worstScore) : 0,
            recentResults,
            categoryStats,
            performanceData,
        });
    } catch (error) {
        console.error('Error loading analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получить количество попыток для конкретного теста
router.get('/attempts/:testId', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const testId = req.params.testId;

        const count = await Result.countDocuments({
            userEmail,
            testId
        });

        res.json({ attempts: count });
    } catch (error) {
        console.error('Ошибка получения количества попыток:', error);
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

        res.json({
            _id: result._id,
            testTitle: result.testTitle,
            score: result.score,
            total: result.total,
            createdAt: result.createdAt,
            answers: result.answers,
            correctAnswers: result.correctAnswers,
            mistakes: result.mistakes,
            shuffledQuestions: result.shuffledQuestions, // <- Ключевой массив!
        });
    } catch (error) {
        console.error('Ошибка получения полного результата', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;
