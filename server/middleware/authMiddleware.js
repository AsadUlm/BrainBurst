const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super-secret-key'; // лучше взять из .env

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Нет токена авторизации' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // добавим пользователя в req.user
        req.userId = decoded.id; // для совместимости со старым кодом
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Недействительный токен' });
    }
}

function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Только для админов' });
    }
    next();
}

module.exports = {
    verifyToken,
    requireAdmin,
};
