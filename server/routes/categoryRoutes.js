const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// GET /api/categories - Получить все категории (доступно всем)
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения категорий' });
    }
});

// POST /api/categories - Создать категорию (только админ)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, color } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Название категории обязательно' });
        }

        const category = new Category({
            name,
            description,
            color: color || '#1976d2',
        });

        await category.save();
        res.status(201).json(category);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Категория с таким названием уже существует' });
        }
        res.status(500).json({ error: 'Ошибка создания категории' });
    }
});

// PUT /api/categories/:id - Обновить категорию (только админ)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, color } = req.body;

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, description, color },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ error: 'Категория не найдена' });
        }

        res.json(category);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка обновления категории' });
    }
});

// DELETE /api/categories/:id - Удалить категорию (только админ)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({ error: 'Категория не найдена' });
        }

        res.json({ message: 'Категория удалена' });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка удаления категории' });
    }
});

module.exports = router;
