const express = require('express');
const router = express.Router();
const Test = require('../models/Test');

// Создать тест
router.post('/', async (req, res) => {
    try {
        const newTest = new Test(req.body);
        await newTest.save();
        res.status(201).json(newTest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить все тесты
router.get('/', async (req, res) => {
    const tests = await Test.find({}, 'title');
    res.json(tests);
});

// Получить конкретный тест
router.get('/:id', async (req, res) => {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ error: 'Test not found' });
    res.json(test);
});

module.exports = router;
