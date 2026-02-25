const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { verifyToken, requireAdmin, requireTeacher } = require('../middleware/authMiddleware');

// GET /api/categories - Получить категории
router.get('/', optionalAuth, async (req, res) => {
    try {
        const userRole = req.user?.role;
        const userId = req.user?.userId;
        let query = {};

        if (userRole === 'teacher') {
            // Teacher sees only their categories
            query.ownerId = userId;
        } else if (userRole === 'admin') {
            // Admin sees all categories
        } else {
            // Students can fetch categories associated with their assignments if needed, 
            // but for now, they might not need direct access. Reverting to all categories for backward compatibility 
            // where tests don't have categories, or only showing ones with assignments.
            // Let's allow fetching all categories for now, or just the global ones (without ownerId) 
            // plus those used in their active classes. To simplify, allow all read, since tests are restricted.
        }

        const categories = await Category.find(query).sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения категорий' });
    }
});

// Middleware для опциональной авторизации (если его тут нет, нужно добавить)
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        try {
            const decoded = jwt.verify(token, 'super-secret-key'); // !! Взять из .env в реальном проекте
            req.user = decoded;
        } catch (err) { }
    }
    next();
}

// POST /api/categories - Создать категорию (teacher или admin)
router.post('/', verifyToken, requireTeacher, async (req, res) => {
    try {
        const { name, description, color } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Название категории обязательно' });
        }

        const category = new Category({
            name,
            description,
            color: color || '#1976d2',
            ownerId: req.user.userId
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

// PUT /api/categories/:id - Обновить категорию (teacher или admin)
router.put('/:id', verifyToken, requireTeacher, async (req, res) => {
    try {
        const { name, description, color } = req.body;

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ error: 'Категория не найдена' });
        }

        if (req.user.role !== 'admin' && category.ownerId && category.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        category.name = name || category.name;
        category.description = description !== undefined ? description : category.description;
        category.color = color || category.color;

        await category.save();

        res.json(category);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка обновления категории' });
    }
});

// DELETE /api/categories/:id - Удалить категорию (teacher или admin)
router.delete('/:id', verifyToken, requireTeacher, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ error: 'Категория не найдена' });
        }

        if (req.user.role !== 'admin' && category.ownerId && category.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        await Category.findByIdAndDelete(req.params.id);

        res.json({ message: 'Категория удалена' });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка удаления категории' });
    }
});

module.exports = router;
