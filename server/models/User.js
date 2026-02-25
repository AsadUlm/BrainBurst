const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    // Common fields
    name: { type: String, required: true },
    nickname: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher', 'admin', 'user'], default: 'student' }, // student | teacher | admin | user

    // Teacher specific fields
    organization: { type: String },
    subject: { type: String },

    // Student specific fields
    studentId: { type: String },
    lastNotificationCheck: { type: Date, default: Date.now },
    settings: {
        // Настройки тестов
        disableHotkeys: { type: Boolean, default: false },
        autoAdvanceAfterSelect: { type: Boolean, default: false },
        autoAdvanceDelay: { type: Number, default: 1000 }, // мс
        showKeyboardHints: { type: Boolean, default: true },
        confirmBeforeExit: { type: String, default: 'if-incomplete' }, // 'always' | 'if-incomplete' | 'never'
        hideTimer: { type: Boolean, default: false },

        // Настройки прогресса
        requireAnswerBeforeNext: { type: Boolean, default: false },
        returnToUnanswered: { type: Boolean, default: true },
        showProgressGrid: { type: Boolean, default: true }
    },
    // Валюта для подсказок
    gems: { type: Number, default: 10 }
});

// Хэшируем пароль перед сохранением
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Метод для проверки пароля
UserSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
