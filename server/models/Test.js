const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: [String],
    correctIndex: Number,
});

const TestSchema = new mongoose.Schema({
    title: { type: String, required: true },
    questions: [QuestionSchema],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Test', TestSchema);
