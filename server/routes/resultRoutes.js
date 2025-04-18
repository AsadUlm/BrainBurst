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
            shuffledOptions,
        } = req.body;

        if (!userEmail || !testId || !testTitle || !answers || !correctAnswers || !mistakes || !shuffledOptions) {
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
            shuffledOptions,
        });

        await newResult.save();
        res.status(201).json({ message: 'Result saved successfully' });
    } catch (error) {
        console.error('Error saving result:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Админ получает все результаты
router.get('/', verifyToken, requireAdmin, async (req, res) => {
    const results = await Result.find().sort({ createdAt: -1 });
    res.json(results);
});

router.get('/mine', verifyToken, async (req, res) => {
    const userEmail = req.user.email;
    const results = await Result.find({ userEmail }).sort({ createdAt: -1 });
    res.json(results);
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
            shuffledOptions: result.shuffledOptions || [],
            questions: test.questions.map(q => ({
                text: q.text,
                options: q.options
            })),
        });
    } catch (error) {
        console.error('Ошибка получения полного результата', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;
