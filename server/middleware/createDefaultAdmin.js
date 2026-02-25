const User = require('../models/User');

module.exports = async function createDefaultAdmin() {
    try {
        // ---- Проверка / создание администратора ----
        const adminExists = await User.findOne({ role: 'admin' });

        if (!adminExists) {
            const admin = new User({
                email: 'admin@example.com',
                password: 'admin123',
                role: 'admin',
            });

            await admin.save();
            console.log('✅ Админ по умолчанию создан: admin@example.com / admin123');
        } else {
            console.log('ℹ️ Админ уже существует');
        }

        // ---- Проверка / создание учителя ----
        const teacherExists = await User.findOne({ email: 'teacher@example.com' });

        if (!teacherExists) {
            const teacher = new User({
                email: 'teacher@example.com',
                password: 'teacher123',
                role: 'teacher',
            });

            await teacher.save();
            console.log('✅ Учитель по умолчанию создан: teacher@example.com / teacher123');
        } else {
            console.log('ℹ️ Учитель уже существует');
        }

        // ---- Проверка / создание студента ----
        const studentExists = await User.findOne({ email: 'student@example.com' });

        if (!studentExists) {
            const student = new User({
                email: 'student@example.com',
                password: 'student123',
                role: 'student',
            });

            await student.save();
            console.log('✅ Студент по умолчанию создан: student@example.com / student123');
        } else {
            console.log('ℹ️ Студент уже существует');
        }

    } catch (err) {
        console.error('❌ Ошибка при создании пользователей по умолчанию:', err);
    }
};
