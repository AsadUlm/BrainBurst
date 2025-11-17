const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Middleware для опциональной авторизации
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = 'super-secret-key';

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (err) {
            // Токен невалидный, но это не ошибка - пользователь просто неавторизован
        }
    }
    next();
};


router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        // Гарантируем что isVisible установлен (по умолчанию true)
        const testData = {
            ...req.body,
            isVisible: req.body.isVisible !== undefined ? req.body.isVisible : true
        };
        const newTest = new Test(testData);
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


router.get('/', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId; // Получаем ID пользователя из токена (если есть)
        const isAdmin = req.user?.role === 'admin';

        let tests;

        if (isAdmin) {
            // Админы видят все тесты
            tests = await Test.find({}).populate('category');
        } else {
            // Обычные пользователи видят только доступные тесты
            const now = new Date();

            // Более гибкий запрос - если поле isVisible не существует или true
            const query = {
                $or: [
                    { isVisible: { $exists: false } }, // Старые тесты без поля isVisible
                    { isVisible: true }                // Новые тесты с isVisible = true
                ]
            };

            tests = await Test.find(query).populate('category');

            // Фильтруем по датам
            tests = tests.filter(test => {
                // Если availableFrom установлено - проверяем что уже доступен
                if (test.availableFrom && new Date(test.availableFrom) > now) {
                    return false;
                }
                // Если availableUntil установлено - проверяем что еще доступен
                if (test.availableUntil && new Date(test.availableUntil) < now) {
                    return false;
                }
                return true;
            });

            // Фильтруем по разрешенным пользователям
            tests = tests.filter(test => {
                // Если allowedUsers пустой или не существует - доступен всем
                if (!test.allowedUsers || test.allowedUsers.length === 0) {
                    return true;
                }
                // Если есть ограничения - проверяем авторизованного пользователя
                if (!userId) {
                    return false; // Неавторизованные не видят тесты с ограничениями
                }
                // Проверяем, есть ли пользователь в списке разрешенных
                return test.allowedUsers.some(id => id.toString() === userId.toString());
            });
        }

        res.json(tests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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
