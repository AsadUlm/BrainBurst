const express = require('express');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Get notifications
router.get('/', verifyToken, async (req, res) => {
    try {
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
