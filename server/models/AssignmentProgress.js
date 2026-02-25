const mongoose = require('mongoose');

const assignmentProgressSchema = new mongoose.Schema({
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['assigned', 'in_progress', 'submitted', 'blocked', 'graded', 'excused'],
        default: 'assigned'
    },
    attemptCount: {
        type: Number,
        default: 0
    },
    bestScore: {
        type: Number,
        default: null
    },
    startedAt: {
        type: Date,
        default: null
    },
    submittedAt: {
        type: Date,
        default: null
    },
    lastAttemptAt: {
        type: Date,
        default: null
    },
    teacherComment: {
        type: String,
        default: null
    },
    gradedAt: {
        type: Date,
        default: null
    },
    excusedAt: {
        type: Date,
        default: null
    },
    blockedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Ensure unique progress tracking per student per assignment
assignmentProgressSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

// Static method to compute dynamic status
assignmentProgressSchema.statics.computeStatus = function (progress, assignment) {
    if (!progress || !assignment) return null;

    const storedStatus = progress.status;

    // Terminal statuses ignore overdue rules
    if (['submitted', 'graded', 'excused', 'blocked'].includes(storedStatus)) {
        return storedStatus;
    }

    // Check if overdue
    if (assignment.dueDate) {
        const dueDate = new Date(assignment.dueDate);
        const now = new Date();
        if (now > dueDate) {
            return 'overdue';
        }
    }

    return storedStatus;
};

module.exports = mongoose.model('AssignmentProgress', assignmentProgressSchema);
