const mongoose = require('mongoose');

const DB_URI = 'mongodb+srv://workaccasd:QwIvwrxxCKBJmFkt@brainburst.ytksvbv.mongodb.net/?retryWrites=true&w=majority&appName=BrainBurst';

const TestSchema = new mongoose.Schema({
    title: String,
    isVisible: Boolean,
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const UserSchema = new mongoose.Schema({
    email: String,
    role: String,
});

const Test = mongoose.model('Test', TestSchema);
const User = mongoose.model('User', UserSchema);

async function testAccess() {
    try {
        await mongoose.connect(DB_URI);
        console.log('✓ Подключено к MongoDB\n');

        const users = await User.find({});
        const adminUser = users.find(u => u.email === 'admin@example.com');
        const duyenUser = users.find(u => u.email === 'duyen@example.com');

        console.log('👥 Тестовые пользователи:');
        console.log(`Admin: ${adminUser?._id}`);
        console.log(`Duyen: ${duyenUser?._id}\n`);

        // Тест с ограничением для duyen
        const restrictedTest = await Test.findOne({ title: '생산관리' }).populate('allowedUsers');

        console.log('🔍 Тест "생산관리":');
        console.log(`  allowedUsers count: ${restrictedTest?.allowedUsers?.length}`);
        if (restrictedTest?.allowedUsers) {
            console.log('  allowedUsers IDs:', restrictedTest.allowedUsers.map(u => u._id.toString()));
        }
        console.log(`  Duyen ID: ${duyenUser?._id.toString()}`);

        if (restrictedTest?.allowedUsers && duyenUser) {
            const hasAccess = restrictedTest.allowedUsers.some(allowedUser => {
                const allowedId = allowedUser._id || allowedUser;
                console.log(`  Сравнение: ${allowedId.toString()} === ${duyenUser._id.toString()}`);
                return allowedId.toString() === duyenUser._id.toString();
            });
            console.log(`  ✅ Duyen имеет доступ: ${hasAccess}\n`);
        }

        // Тест с ограничением для админа
        const adminTest = await Test.findOne({ title: 'JavaScript Basics Quiz' }).populate('allowedUsers');

        console.log('🔍 Тест "JavaScript Basics Quiz":');
        console.log(`  isVisible: ${adminTest?.isVisible}`);
        console.log(`  allowedUsers count: ${adminTest?.allowedUsers?.length}`);
        if (adminTest?.allowedUsers) {
            console.log('  allowedUsers IDs:', adminTest.allowedUsers.map(u => u._id.toString()));
        }
        console.log(`  Admin ID: ${adminUser?._id.toString()}`);

        if (adminTest?.allowedUsers && adminUser) {
            const hasAccess = adminTest.allowedUsers.some(allowedUser => {
                const allowedId = allowedUser._id || allowedUser;
                console.log(`  Сравнение: ${allowedId.toString()} === ${adminUser._id.toString()}`);
                return allowedId.toString() === adminUser._id.toString();
            });
            console.log(`  ✅ Admin имеет доступ: ${hasAccess}\n`);
        }

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await mongoose.connection.close();
        console.log('✓ Соединение закрыто');
    }
}

testAccess();
