const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
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

module.exports = router;
