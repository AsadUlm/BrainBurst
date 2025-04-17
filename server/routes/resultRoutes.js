const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Test = require('../models/Test');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Сохраняем результат
router.post('/', async (req, res) => {
    const {
        userEmail,
        testId,
        testTitle,
        score,
        total,
        answers,
        correctAnswers,
        mistakes,
    } = req.body;

    const result = new Result({
        userEmail,
        testId,
        testTitle,
        score,
        total,
        answers,
        correctAnswers,
        mistakes,
    });
    await result.save();
    res.status(201).json(result);
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
        if (!result) return res.status(404).json({ error: 'Result not found' });

        const test = await Test.findById(result.testId);
        if (!test) return res.status(404).json({ error: 'Test not found' });

        res.json({
            _id: result._id,
            testTitle: result.testTitle,
            score: result.score,
            total: result.total,
            createdAt: result.createdAt,
            answers: result.answers,
            correctAnswers: result.correctAnswers,
            questions: test.questions.map(q => ({
                text: q.text,
                options: q.options
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
