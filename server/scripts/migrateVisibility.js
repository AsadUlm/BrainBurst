// Скрипт для миграции существующих тестов - добавление поля isVisible
const mongoose = require('mongoose');
const Test = require('../models/Test');

// Подключение к БД (используем ту же строку что и в основном приложении)
mongoose.connect('mongodb+srv://workaccasd:QwIvwrxxCKBJmFkt@brainburst.ytksvbv.mongodb.net/?retryWrites=true&w=majority&appName=brainburst', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(async () => {
        console.log('✓ Подключено к MongoDB');

        try {
            // Обновляем все тесты без поля isVisible
            const result = await Test.updateMany(
                { isVisible: { $exists: false } },
                { $set: { isVisible: true } }
            );

            console.log(`✓ Обновлено тестов: ${result.modifiedCount}`);

            // Проверяем результаты
            const totalTests = await Test.countDocuments({});
            const visibleTests = await Test.countDocuments({ isVisible: true });
            const hiddenTests = await Test.countDocuments({ isVisible: false });

            console.log('\n📊 Статистика:');
            console.log(`  Всего тестов: ${totalTests}`);
            console.log(`  Видимых: ${visibleTests}`);
            console.log(`  Скрытых: ${hiddenTests}`);

        } catch (error) {
            console.error('✗ Ошибка миграции:', error);
        } finally {
            await mongoose.connection.close();
            console.log('\n✓ Соединение закрыто');
            process.exit(0);
        }
    })
    .catch(err => {
        console.error('✗ Ошибка подключения к MongoDB:', err);
        process.exit(1);
    });
