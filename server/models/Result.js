const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    testTitle: { type: String, required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    answers: [Number],
    correctAnswers: [Number],
    mistakes: [Number],
    shuffledQuestions: [{
        text: { type: String, required: true },
        options: [{ type: String, required: true }]
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', ResultSchema);
