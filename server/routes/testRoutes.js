const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const Result = require('../models/Result');
const User = require('../models/User');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Middleware для опциональной авторизации
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = 'super-secret-key';

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (err) {
            // Токен невалидный, но это не ошибка - пользователь просто неавторизован
        }
    }
    next();
};


router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        // Гарантируем что isVisible установлен (по умолчанию true)
        const testData = {
            ...req.body,
            isVisible: req.body.isVisible !== undefined ? req.body.isVisible : true
        };

        // Если timeLimit === null, удаляем его из объекта
        if (testData.timeLimit === null) {
            delete testData.timeLimit;
        }

        const newTest = new Test(testData);
        await newTest.save();
        res.status(201).json(newTest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        console.log('🔧 PUT /api/tests/:id - Обновление теста:', req.params.id);
        console.log('📦 Payload:', JSON.stringify(req.body, null, 2));
        console.log('👥 allowedUsers type:', typeof req.body.allowedUsers);
        console.log('👥 allowedUsers:', req.body.allowedUsers);

        // Проверяем что allowedUsers это массив строк
        if (req.body.allowedUsers && Array.isArray(req.body.allowedUsers)) {
            console.log('🔍 Проверка каждого элемента allowedUsers:');
            req.body.allowedUsers.forEach((user, index) => {
                console.log(`  [${index}] type: ${typeof user}, value:`, user);
            });
        }

        const updateData = { ...req.body };
        const updateOptions = { new: true };

        // Если timeLimit === null, используем $unset для удаления поля из БД
        // В этом случае используется режим "время на каждый вопрос", поэтому time должно остаться
        if (updateData.timeLimit === null) {
            delete updateData.timeLimit;

            const updated = await Test.findByIdAndUpdate(
                req.params.id,
                { $set: updateData, $unset: { timeLimit: 1 } },
                updateOptions
            );
            if (!updated) return res.status(404).json({ error: 'Test not found' });
            console.log('✅ Тест обновлен (timeLimit удален, время на вопросы сохранено). allowedUsers в БД:', updated.allowedUsers);
            return res.json(updated);
        }

        // Если есть timeLimit (глобальный таймер), удаляем time из всех вопросов
        if (updateData.timeLimit !== undefined && updateData.questions && Array.isArray(updateData.questions)) {
            updateData.questions = updateData.questions.map(q => {
                const { time, ...rest } = q;
                return rest;
            });
        }

        const updated = await Test.findByIdAndUpdate(req.params.id, updateData, updateOptions);
        if (!updated) return res.status(404).json({ error: 'Test not found' });

        console.log('✅ Тест обновлен. allowedUsers в БД:', updated.allowedUsers);
        res.json(updated);
    } catch (err) {
        console.error('❌ Ошибка обновления теста:', err);
        res.status(500).json({ error: err.message });
    }
});


router.get('/', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId; // Получаем ID пользователя из токена (если есть)
        const isAdmin = req.user?.role === 'admin';
        const showAll = req.query.showAll === 'true'; // Параметр для админ-панели

        console.log('🔍 Запрос тестов. userId:', userId, 'isAdmin:', isAdmin, 'showAll:', showAll);

        let tests;

        // ТОЛЬКО для админ-панели показываем все тесты с пагинацией и фильтрацией
        if (isAdmin && showAll) {
            const { page = 1, limit = 12, search, category } = req.query;
            const query = {};

            if (search) {
                query.title = { $regex: search, $options: 'i' };
            }
            if (category && category !== 'all') {
                query.category = category;
            }

            const totalTests = await Test.countDocuments(query);

            const tests = await Test.find(query)
                .populate('category')
                .populate('allowedUsers', '_id email')
                .select('-questions.text -questions.correctIndex -questions.explanation -questions.image -questions.audio -questions.puzzleWords -questions.correctSentence')
                .sort({ createdAt: -1 })
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit))
                .lean();

            console.log(`👑 Админ-панель: найдено ${tests.length} тестов (всего ${totalTests})`);

            res.json({
                tests,
                pagination: {
                    total: totalTests,
                    page: parseInt(page),
                    totalPages: Math.ceil(totalTests / parseInt(limit))
                }
            });
            return;
        }

        // Для всех остальных (включая админов на обычных страницах) применяем фильтрацию
        const now = new Date();

        // Получаем все тесты с заполненными связями, но без тяжелых полей вопросов
        tests = await Test.find({})
            .populate('category')
            .populate('allowedUsers', '_id')
            .select('-questions.text -questions.correctIndex -questions.explanation -questions.image -questions.audio -questions.puzzleWords -questions.correctSentence')
            .lean();

        console.log('📋 Всего тестов в базе:', tests.length);

        // Применяем все фильтры
        tests = tests.filter(test => {
            // 1. Проверка видимости
            const isVisibleField = test.isVisible !== undefined ? test.isVisible : true;
            if (!isVisibleField) {
                console.log(`❌ Тест "${test.title}" скрыт (isVisible: false)`);
                return false;
            }

            // 2. Проверка по датам
            if (test.availableFrom && new Date(test.availableFrom) > now) {
                console.log(`❌ Тест "${test.title}" еще недоступен (from: ${test.availableFrom})`);
                return false;
            }
            if (test.availableUntil && new Date(test.availableUntil) < now) {
                console.log(`❌ Тест "${test.title}" уже недоступен (until: ${test.availableUntil})`);
                return false;
            }

            // 3. Проверка по пользователям
            if (!test.allowedUsers || test.allowedUsers.length === 0) {
                console.log(`✅ Тест "${test.title}" доступен всем`);
                return true;
            }

            console.log(`🔒 Тест "${test.title}" имеет ограничения`);
            console.log(`   allowedUsers RAW:`, JSON.stringify(test.allowedUsers));
            console.log(`   allowedUsers TYPE:`, test.allowedUsers.map(u => typeof u));
            console.log(`   Проверяем доступ для userId: ${userId} (type: ${typeof userId})`);

            // Если есть ограничения - проверяем авторизованного пользователя
            if (!userId) {
                console.log(`❌ Тест "${test.title}" недоступен - пользователь не авторизован`);
                return false;
            }

            // Проверяем, есть ли пользователь в списке разрешенных
            const hasAccess = test.allowedUsers.some(allowedUser => {
                // allowedUser может быть: ObjectId, строка, или объект с _id
                let allowedId;

                if (typeof allowedUser === 'string') {
                    allowedId = allowedUser;
                } else if (allowedUser && allowedUser._id) {
                    allowedId = allowedUser._id;
                } else {
                    allowedId = allowedUser;
                }

                const allowedIdStr = allowedId ? allowedId.toString() : '';
                const userIdStr = userId.toString();
                const match = allowedIdStr === userIdStr;

                console.log(`   Сравнение: "${allowedIdStr}" === "${userIdStr}" = ${match}`);
                console.log(`   allowedUser TYPE: ${typeof allowedUser}, VALUE:`, allowedUser);

                return match;
            });

            if (hasAccess) {
                console.log(`✅ Тест "${test.title}" ДОСТУПЕН для userId ${userId}`);
            } else {
                console.log(`❌ Тест "${test.title}" НЕДОСТУПЕН для userId ${userId}`);
            }

            return hasAccess;
        });

        console.log('✅ Итого доступных тестов:', tests.length);

        res.json(tests);
    } catch (err) {
        console.error('❌ Ошибка получения тестов:', err);
        res.status(500).json({ error: err.message });
    }
});

// Создание теста на основе ошибок (работа над ошибками)
router.post('/mistakes', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { originalTestId, userId, title } = req.body;

        if (!originalTestId || !userId) {
            return res.status(400).json({ error: 'originalTestId and userId are required' });
        }

        // 1. Получаем пользователя и проверяем его существование
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 2. Получаем исходный тест для настроек и оригинальных вопросов
        const originalTest = await Test.findById(originalTestId);
        if (!originalTest) {
            return res.status(404).json({ error: 'Original test not found' });
        }

        // 3. Получаем все результаты пользователя по этому тесту
        const results = await Result.find({
            testId: originalTestId,
            userEmail: user.email
        });

        if (results.length === 0) {
            return res.status(404).json({ error: 'No results found for this user/test' });
        }

        // 4. Собираем уникальные вопросы с ошибками
        const mistakeQuestionsMap = new Map(); // Key: question text, Value: question object

        results.forEach(result => {
            // result.mistakes содержит индексы неправильных ответов в shuffledQuestions
            if (result.mistakes && result.shuffledQuestions) {
                result.mistakes.forEach(mistakeIndex => {
                    // Проверка границ массива
                    if (mistakeIndex < 0 || mistakeIndex >= result.shuffledQuestions.length) {
                        return; // Пропускаем невалидный индекс
                    }

                    const visibleQuestion = result.shuffledQuestions[mistakeIndex];
                    // Находим ОРИГИНАЛЬНЫЙ вопрос для получения correctIndex и других полей,
                    // которые могут отсутствовать в результатах (санитизированных)
                    if (visibleQuestion && visibleQuestion.text && !mistakeQuestionsMap.has(visibleQuestion.text)) {
                        const originalQuestion = originalTest.questions.find(q => q.text === visibleQuestion.text);

                        if (originalQuestion) {
                            const cleanQuestion = originalQuestion.toObject();
                            delete cleanQuestion._id;
                            mistakeQuestionsMap.set(visibleQuestion.text, cleanQuestion);
                        }
                    }
                });
            }
        });

        const questions = Array.from(mistakeQuestionsMap.values());

        if (questions.length === 0) {
            return res.status(400).json({ error: 'User has no mistakes in this test' });
        }

        // 5. Создаем новый тест
        const newTitle = title || `${originalTest.title}_work_on_mistakes`;

        const newTestData = {
            title: newTitle,
            questions: questions,
            // Копируем настройки времени
            timeLimit: originalTest.timeLimit,
            useStandardGlobalTimer: originalTest.useStandardGlobalTimer,
            standardTimeLimit: originalTest.standardTimeLimit,
            standardQuestionTime: originalTest.standardQuestionTime,
            useExamGlobalTimer: originalTest.useExamGlobalTimer,
            examTimeLimit: originalTest.examTimeLimit,
            examQuestionTime: originalTest.examQuestionTime,
            // Категория та же
            category: '6997d40225e3ef2eb616c453',

            hideContent: true,
            practiceMode: "disabled",
            practiceAttemptsRequired: 0,
            gameMode: "enabled",
            gameAttemptsRequired: 0,


            isVisible: true,
            description: `Work on mistakes for ${originalTest.title}`
        };

        const newTest = new Test(newTestData);
        await newTest.save();

        res.status(201).json(newTest);

    } catch (error) {
        console.error('Error creating mistake test:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', async (req, res) => {
    const test = await Test.findById(req.params.id).populate('category');
    if (!test) return res.status(404).json({ error: 'Test not found' });
    res.json(test);
});

// Удаление теста (только для админа)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const deleted = await Test.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Тест не найден' });
        }
        res.json({ message: 'Тест удалён' });
    } catch (error) {
        console.error('Ошибка удаления теста:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


module.exports = router;
