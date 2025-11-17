const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddleware');

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

    const token = jwt.sign({ userId: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, role: user.role, email: user.email, });
});

module.exports = router;
