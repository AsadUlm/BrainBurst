const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
    userEmail: String,
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
    testTitle: String,
    score: Number,
    total: Number,
    answers: [Number],
    correctAnswers: [Number],
    mistakes: [Number],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Result', ResultSchema);
