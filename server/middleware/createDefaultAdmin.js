const User = require('../models/User');

module.exports = async function createDefaultAdmin() {
    try {
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
    } catch (err) {
        console.error('❌ Ошибка при создании админа по умолчанию:', err);
    }
};
