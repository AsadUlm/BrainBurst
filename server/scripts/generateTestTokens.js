const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super-secret-key';

// Создаем токены для разных пользователей
const users = [
    { userId: '67ffac3f74d009a162620e75', role: 'admin', email: 'admin@example.com' },
    { userId: '67ffac4f74d009a162620e7a', role: 'user', email: 'dina@gmail.com' },
    { userId: '69061eae84813e9a18ddc0ce', role: 'user', email: 'duyen@example.com' },
];

console.log('🔑 Токены для тестирования:\n');

users.forEach(user => {
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    console.log(`${user.email} (${user.role}):`);
    console.log(`Bearer ${token}\n`);
});

console.log('\n📝 Используйте эти токены в заголовке Authorization для тестирования API');
console.log('Например:');
console.log('curl -H "Authorization: Bearer <токен>" http://localhost:5000/api/tests');
