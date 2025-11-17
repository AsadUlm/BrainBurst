const mongoose = require('mongoose');

const DB_URI = 'mongodb+srv://workaccasd:QwIvwrxxCKBJmFkt@brainburst.ytksvbv.mongodb.net/?retryWrites=true&w=majority&appName=BrainBurst';

// Модели
const TestSchema = new mongoose.Schema({
    title: String,
    isVisible: Boolean,
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    availableFrom: Date,
    availableUntil: Date,
    hideContent: Boolean,
    attemptsToUnlock: Number,
});

const UserSchema = new mongoose.Schema({
    email: String,
    role: String,
});

const Test = mongoose.model('Test', TestSchema);
const User = mongoose.model('User', UserSchema);

async function checkVisibility() {
    try {
        await mongoose.connect(DB_URI);
        console.log('✓ Подключено к MongoDB\n');

        // Получаем всех пользователей
        const users = await User.find({});
        console.log('👥 Пользователи в базе:');
        users.forEach(user => {
            console.log(`  - ${user.email} (${user.role}) [ID: ${user._id}]`);
        });
        console.log('');

        // Получаем все тесты
        const tests = await Test.find({}).populate('allowedUsers');
        console.log('📋 Тесты в базе:\n');

        tests.forEach((test, index) => {
            console.log(`${index + 1}. "${test.title}"`);
            console.log(`   ID: ${test._id}`);
            console.log(`   isVisible: ${test.isVisible !== undefined ? test.isVisible : 'не установлено (по умолчанию true)'}`);

            if (test.allowedUsers && test.allowedUsers.length > 0) {
                console.log(`   🔒 Ограничен для пользователей:`);
                test.allowedUsers.forEach(user => {
                    console.log(`      - ${user.email} (${user.role}) [ID: ${user._id}]`);
                });
            } else {
                console.log(`   ✅ Доступен всем пользователям`);
            }

            if (test.availableFrom || test.availableUntil) {
                console.log(`   📅 Временные ограничения:`);
                if (test.availableFrom) console.log(`      От: ${test.availableFrom}`);
                if (test.availableUntil) console.log(`      До: ${test.availableUntil}`);
            }

            if (test.hideContent) {
                console.log(`   🔐 Контент скрыт. Попыток для разблокировки: ${test.attemptsToUnlock}`);
            }

            console.log('');
        });

        console.log('\n📊 Статистика:');
        console.log(`   Всего тестов: ${tests.length}`);
        console.log(`   Видимых: ${tests.filter(t => t.isVisible !== false).length}`);
        console.log(`   Скрытых: ${tests.filter(t => t.isVisible === false).length}`);
        console.log(`   С ограничениями по пользователям: ${tests.filter(t => t.allowedUsers && t.allowedUsers.length > 0).length}`);
        console.log(`   С временными ограничениями: ${tests.filter(t => t.availableFrom || t.availableUntil).length}`);
        console.log(`   Со скрытым контентом: ${tests.filter(t => t.hideContent).length}`);

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Соединение закрыто');
    }
}

checkVisibility();
