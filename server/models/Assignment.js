const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    title: {
        type: String,
        required: false // Optional, fallbacks to test title if not provided
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    },
    dueDate: {
        type: Date,
        default: null
    },
    attemptsAllowed: {
        type: Number,
        default: null
    },
    rewardPolicy: {
        type: String,
        default: null
    },
    maxScore: {
        type: Number,
        default: 100
    },
    // Переопределение настроек теста для конкретного назначения
    settingsOverrides: {
        timeLimit: {
            type: Number,
            default: null
        },
        attemptsAllowed: {
            type: Number, // Deprecated, kept for backward compatibility
            default: null
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);
