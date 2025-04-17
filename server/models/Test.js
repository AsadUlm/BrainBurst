const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: {
        type: [String],
        required: true,
        validate: (arr) => arr.length >= 2,
    },
    correctIndex: { type: Number, required: true },
    time: { type: Number },
});

const TestSchema = new mongoose.Schema({
    title: { type: String, required: true },
    questions: [QuestionSchema],
    timeLimit: { type: Number },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Test', TestSchema);

