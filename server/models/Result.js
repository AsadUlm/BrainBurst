const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
    answers: [Number],
    score: Number,
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Result', ResultSchema);
