// Скрипт для миграции - добавление полей hideContent и attemptsToUnlock
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
            // Обновляем все тесты без полей hideContent и attemptsToUnlock
            const result = await Test.updateMany(
                {
                    $or: [
                        { hideContent: { $exists: false } },
                        { attemptsToUnlock: { $exists: false } }
                    ]
                },
                {
                    $set: {
                        hideContent: false,
                        attemptsToUnlock: 0
                    }
                }
            );

            console.log(`✓ Обновлено тестов: ${result.modifiedCount}`);

            // Проверяем результаты
            const totalTests = await Test.countDocuments({});
            const hiddenTests = await Test.countDocuments({ hideContent: true });
            const visibleTests = await Test.countDocuments({ hideContent: false });

            console.log('\n📊 Статистика:');
            console.log(`  Всего тестов: ${totalTests}`);
            console.log(`  Со скрытым контентом: ${hiddenTests}`);
            console.log(`  С открытым контентом: ${visibleTests}`);

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
