const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    joinCode: { type: String, required: true, unique: true }, // 6-8 chars
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Class', ClassSchema);
