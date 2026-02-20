const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const Test = require('../models/Test');

const router = express.Router();
const JWT_SECRET = 'super-secret-key'; // ❗в .env в будущем

// Получить список всех пользователей (для админа)
router.get('/users', verifyToken, async (req, res) => {
    try {
        const users = await User.find({}, 'email role _id');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Регистрация
router.post('/register', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json({ message: 'Пользователь зарегистрирован' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Вход
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Неверный email или пароль' });

    const token = jwt.sign({ id: user._id, userId: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // Логика проверки новых уведомлений
    const lastCheck = user.lastNotificationCheck || new Date(0); // Если нет даты, проверяем всё
    const now = new Date();

    // Считаем новые тесты
    const newTestsCount = await Test.countDocuments({
        isVisible: true,
        // 1. Критерий новизны: создан недавно ИЛИ стал доступен недавно ИЛИ был обновлен (например, дали доступ)
        $or: [
            { createdAt: { $gt: lastCheck } },
            { updatedAt: { $gt: lastCheck } },
            { availableFrom: { $gt: lastCheck, $lte: now } }
        ],
        // 2. Критерий доступа: доступен всем (пустой массив) ИЛИ пользователю разрешен доступ
        $and: [
            {
                $or: [
                    { allowedUsers: { $size: 0 } },
                    { allowedUsers: user._id }
                ]
            },
            // 3. Критерий актуальности: тест не просрочен
            {
                $or: [
                    { availableUntil: null },
                    { availableUntil: { $gt: now } }
                ]
            }
        ]
    });

    // Обновляем дату последней проверки
    user.lastNotificationCheck = now;
    await user.save();

    res.json({ token, role: user.role, email: user.email, newTestsCount });
});

// Получить профиль текущего пользователя
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Потратить гем (для подсказки)
router.post('/spend-gem', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

        if (user.gems < 1) {
            return res.status(400).json({ error: 'Недостаточно гемов' });
        }

        user.gems -= 1;
        await user.save();

        res.json({ success: true, gems: user.gems });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Начислить гемы (админ)
router.post('/add-gems', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { email, amount } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

        const val = parseFloat(amount);
        if (isNaN(val)) return res.status(400).json({ error: 'Неверное количество' });

        user.gems = (user.gems || 0) + val;
        await user.save();

        res.json({ success: true, gems: user.gems });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
