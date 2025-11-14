const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');


router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const newTest = new Test(req.body);
        await newTest.save();
        res.status(201).json(newTest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const updated = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: 'Test not found' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/', async (req, res) => {
    const tests = await Test.find({}).populate('category');
    res.json(tests);
});

router.get('/:id', async (req, res) => {
    const test = await Test.findById(req.params.id).populate('category');
    if (!test) return res.status(404).json({ error: 'Test not found' });
    res.json(test);
});

// Удаление теста (только для админа)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const deleted = await Test.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Тест не найден' });
        }
        res.json({ message: 'Тест удалён' });
    } catch (error) {
        console.error('Ошибка удаления теста:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


module.exports = router;
