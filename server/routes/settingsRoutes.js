const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddleware');

// Получить настройки пользователя
router.get('/', verifyToken, async (req, res) => {
    try {
        console.log('[Settings API] GET request, userId:', req.userId, 'user:', req.user);
        const user = await User.findById(req.userId).select('settings');

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        // Дефолтные настройки
        const defaultSettings = {
            disableHotkeys: false,
            autoAdvanceAfterSelect: false,
            autoAdvanceDelay: 1000,
            showKeyboardHints: true,
            confirmBeforeExit: 'if-incomplete',
            hideTimer: false,
            requireAnswerBeforeNext: false,
            returnToUnanswered: true,
            showProgressGrid: true
        };

        // Если настроек нет или они пустые, инициализируем
        if (!user.settings || Object.keys(user.settings).length === 0) {
            user.settings = defaultSettings;
            await user.save();
        }

        // Объединяем дефолтные настройки с существующими (на случай новых полей)
        const mergedSettings = { ...defaultSettings, ...user.settings.toObject() };

        res.json(mergedSettings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Ошибка при получении настроек' });
    }
});

// Обновить настройки пользователя
router.put('/', verifyToken, async (req, res) => {
    try {
        const updates = req.body;
        console.log('[Settings API] PUT request, userId:', req.userId, 'updates:', updates);

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        // Инициализируем настройки, если их нет
        if (!user.settings) {
            user.settings = {};
        }

        // Обновляем только переданные настройки
        Object.keys(updates).forEach(key => {
            user.settings[key] = updates[key];
        });

        // Важно! Помечаем subdocument как измененный для Mongoose
        user.markModified('settings');

        await user.save();
        console.log('[Settings API] Settings saved successfully');

        // Возвращаем все настройки с дефолтными значениями
        const defaultSettings = {
            disableHotkeys: false,
            autoAdvanceAfterSelect: false,
            autoAdvanceDelay: 1000,
            showKeyboardHints: true,
            confirmBeforeExit: 'if-incomplete',
            hideTimer: false,
            requireAnswerBeforeNext: false,
            returnToUnanswered: true,
            showProgressGrid: true
        };

        const mergedSettings = { ...defaultSettings, ...user.settings.toObject() };
        res.json(mergedSettings);
    } catch (error) {
        console.error('[Settings API] Error updating settings:', error);
        res.status(500).json({ message: 'Ошибка при обновлении настроек' });
    }
});

module.exports = router;
