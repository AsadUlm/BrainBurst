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
        const userExists = await User.findOne({ email: 'duyen@example.com' });

        if (!userExists) {
            const user = new User({
                email: 'duyen@example.com',
                password: 'duyen123',
                role: 'user',
            });

            await user.save();
            console.log('✅ Пользователь по умолчанию создан: duyen@example.com / duyen123');
        } else {
            console.log('ℹ️ Пользователь duyen уже существует');
        }

    } catch (err) {
        console.error('❌ Ошибка при создании пользователей по умолчанию:', err);
    }
};
