const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Category = require('../models/Category');
const Test = require('../models/Test');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.post('/migrate-ownership', verifyToken, requireAdmin, async (req, res) => {
    try {
        // Find a default teacher or admin to assign ownership to
        let defaultOwner = await User.findOne({ role: 'teacher' });
        if (!defaultOwner) {
            defaultOwner = await User.findOne({ role: 'admin' });
        }

        if (!defaultOwner) {
            return res.status(404).json({ error: 'No teacher or admin user found to assign ownership to.' });
        }

        const ownerId = defaultOwner._id;

        // Update all categories without an ownerId
        const categoriesResult = await Category.updateMany(
            { ownerId: { $exists: false } },
            { $set: { ownerId } }
        );

        // Update all tests without an ownerId
        const testsResult = await Test.updateMany(
            { ownerId: { $exists: false } },
            { $set: { ownerId } }
        );

        res.json({
            message: 'Ownership migration completed successfully.',
            defaultOwnerAssigned: ownerId,
            categoriesUpdated: categoriesResult.nModified || categoriesResult.modifiedCount || 0,
            testsUpdated: testsResult.nModified || testsResult.modifiedCount || 0
        });

    } catch (err) {
        console.error('Migration error:', err);
        res.status(500).json({ error: 'Failed to migrate ownership' });
    }
});

module.exports = router;
