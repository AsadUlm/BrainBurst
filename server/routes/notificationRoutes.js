const express = require('express');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Test = require('../models/Test');
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper to check for new tests and create notifications
async function checkNewTests(user) {
    const lastCheck = user.lastNotificationCheck || new Date(0);
    const now = new Date();

    const newTests = await Test.find({
        isVisible: true,
        $or: [
            { createdAt: { $gt: lastCheck } },
            { updatedAt: { $gt: lastCheck } }, // Updated: use updatedAt to catch changes
            { availableFrom: { $gt: lastCheck, $lte: now } } // Became available since last check
        ],
        $and: [
            {
                $or: [
                    { allowedUsers: { $size: 0 } }, // Public
                    { allowedUsers: user._id } // Specific access
                ]
            },
            {
                $or: [
                    { availableUntil: null }, // No expiry
                    { availableUntil: { $gt: now } } // Not expired
                ]
            }
        ]
    }).populate('category');

    if (newTests.length > 0) {
        const notifications = newTests.map(test => ({
            user: user._id,
            type: 'test',
            title: 'Новый тест доступен!',
            message: `Тест "${test.title}"${test.category ? ` (Категория: ${test.category.name})` : ''} теперь доступен для прохождения.`,
            relatedId: test._id,
            createdAt: now
        }));

        // Use insertMany for efficiency, catch errors (e.g. duplicates if logic flaws)
        try {
            await Notification.insertMany(notifications);
        } catch (e) {
            console.error('Error creating test notifications:', e);
        }

        user.lastNotificationCheck = now;
        await user.save();
    }
}

// Get notifications
router.get('/', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (user) {
            try {
                await checkNewTests(user);
            } catch (e) {
                console.error('[Notification] Error checking new tests:', e);
            }
        }

        const notifications = await Notification.find({ user: new mongoose.Types.ObjectId(req.userId) })
            .sort({ createdAt: -1 }) // Newest first
            .limit(50);

        const unreadCount = await Notification.countDocuments({ user: new mongoose.Types.ObjectId(req.userId), isRead: false });

        res.json({ notifications, unreadCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark single notification as read (DELETE it)
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            user: new mongoose.Types.ObjectId(req.userId)
        });
        res.json(notification);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark all as read (DELETE all)
router.put('/read-all', verifyToken, async (req, res) => {
    try {
        await Notification.deleteMany({
            user: new mongoose.Types.ObjectId(req.userId)
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
