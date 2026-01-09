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

        // ---- Проверка / создание обычного пользователя ----
        const userExists = await User.findOne({ email: 'user@example.com' });

        if (!userExists) {
            const user = new User({
                email: 'user@example.com',
                password: 'user123',
                role: 'user',
            });

            await user.save();
            console.log('✅ Пользователь по умолчанию создан: user@example.com / user123');
        } else {
            console.log('ℹ️ Пользователь user уже существует');
        }

    } catch (err) {
        console.error('❌ Ошибка при создании пользователей по умолчанию:', err);
    }
};
