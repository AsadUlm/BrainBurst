const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const GameProgress = require('../models/GameProgress');
const Test = require('../models/Test');
const Result = require('../models/Result');
const User = require('../models/User');

// Получить прогресс игры для теста
router.get('/progress/:testId', verifyToken, async (req, res) => {
    try {
        const { testId } = req.params;
        const userId = req.user.id;

        // Проверяем существование теста
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ message: 'Тест не найден' });
        }

        // Ищем прогресс пользователя для этого теста
        let progress = await GameProgress.findOne({ userId, testId });

        // Если прогресса нет, создаем новый
        if (!progress) {
            progress = new GameProgress({
                userId,
                testId,
                completedQuestionIds: [],
                totalQuestions: test.questions.length,
                currentStreak: 0,
                bestStreak: 0,
                totalMoves: 0,
                totalTime: 0,
                sessions: []
            });
            await progress.save();
        }

        // Формируем ответ
        const response = {
            completedQuestionIds: progress.completedQuestionIds,
            totalQuestions: progress.totalQuestions,
            completedCount: progress.completedQuestionIds.length,
            percentComplete: Math.round((progress.completedQuestionIds.length / progress.totalQuestions) * 100),
            currentStreak: progress.currentStreak,
            bestStreak: progress.bestStreak,
            totalMoves: progress.totalMoves,
            totalTime: progress.totalTime,
            sessions: progress.sessions,
            lastPlayedAt: progress.lastPlayedAt
        };

        res.json(response);
    } catch (error) {
        console.error('Ошибка получения прогресса игры:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить случайные непройденные вопросы для игры
router.get('/:testId/questions', verifyToken, async (req, res) => {
    try {
        const { testId } = req.params;
        const { count = 5 } = req.query;
        const userId = req.user.id;

        const cardCount = parseInt(count);
        if (![5, 10, 15, 20].includes(cardCount)) {
            return res.status(400).json({ message: 'Допустимые значения: 5, 10, 15, 20' });
        }

        // Получаем тест
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ message: 'Тест не найден' });
        }

        // Получаем прогресс
        let progress = await GameProgress.findOne({ userId, testId });
        if (!progress) {
            progress = new GameProgress({
                userId,
                testId,
                completedQuestionIds: [],
                totalQuestions: test.questions.length
            });
            await progress.save();
        }

        // Фильтруем непройденные вопросы
        const completedSet = new Set(progress.completedQuestionIds);
        const uncompletedQuestions = test.questions.filter((q, index) => {
            return !completedSet.has(index.toString());
        });

        const completedQuestions = test.questions.filter((q, index) => {
            return completedSet.has(index.toString());
        });

        // Если не хватает вопросов - добавляем случайные из пройденных
        let selectedQuestions = [];

        if (uncompletedQuestions.length >= cardCount) {
            // Достаточно непройденных - берем только их
            const shuffled = [...uncompletedQuestions].sort(() => Math.random() - 0.5);
            selectedQuestions = shuffled.slice(0, cardCount);
        } else {
            // Не хватает - берем все непройденные + случайные из пройденных
            selectedQuestions = [...uncompletedQuestions];
            const needed = cardCount - uncompletedQuestions.length;

            if (completedQuestions.length > 0 && needed > 0) {
                const shuffledCompleted = [...completedQuestions].sort(() => Math.random() - 0.5);
                const additionalQuestions = shuffledCompleted.slice(0, needed);
                selectedQuestions = [...selectedQuestions, ...additionalQuestions];
            }

            // Перемешиваем все вместе
            selectedQuestions.sort(() => Math.random() - 0.5);
        }

        // Формируем ответ с необходимыми данными
        const questionsData = selectedQuestions.map((q, idx) => {
            // Находим оригинальный индекс вопроса в тесте
            const originalIndex = test.questions.findIndex(tq =>
                tq.text === q.text &&
                JSON.stringify(tq.options) === JSON.stringify(q.options)
            );

            const questionData = {
                _id: originalIndex.toString(), // Используем индекс как ID
                text: q.text,
                questionType: q.questionType || 'multiple-choice'
            };

            // Определяем правильный ответ в зависимости от типа вопроса
            if (q.questionType === 'puzzle') {
                questionData.correctAnswer = q.correctSentence || q.puzzleWords.join(' ');
            } else if (q.questionType === 'open-text') {
                questionData.correctAnswer = q.options[q.correctIndex] || q.options[0];
            } else {
                // multiple-choice
                questionData.correctAnswer = q.options[q.correctIndex];
                questionData.options = q.options;
            }

            return questionData;
        });

        // Подсчитываем сколько новых (непройденных) вопросов в выборке
        const newQuestionsCount = selectedQuestions.filter((q) => {
            const idx = test.questions.findIndex(tq =>
                tq.text === q.text &&
                JSON.stringify(tq.options) === JSON.stringify(q.options)
            );
            return !completedSet.has(idx.toString());
        }).length;

        res.json({
            questions: questionsData,
            remaining: uncompletedQuestions.length - newQuestionsCount,
            total: test.questions.length
        });
    } catch (error) {
        console.error('Ошибка получения вопросов для игры:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Сохранить результат сессии игры
router.post('/:testId/session', verifyToken, async (req, res) => {
    try {
        const { testId } = req.params;
        const { completedQuestionIds, moves, timeElapsed, cardCount } = req.body;
        const userId = req.user.id;

        // Валидация
        if (!Array.isArray(completedQuestionIds) || !moves || !timeElapsed || !cardCount) {
            return res.status(400).json({ message: 'Неверные данные' });
        }

        if (![5, 10, 15, 20].includes(cardCount)) {
            return res.status(400).json({ message: 'Недопустимое количество карточек' });
        }

        // Получаем или создаем прогресс
        let progress = await GameProgress.findOne({ userId, testId });

        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ message: 'Тест не найден' });
        }

        if (!progress) {
            progress = new GameProgress({
                userId,
                testId,
                completedQuestionIds: [],
                totalQuestions: test.questions.length
            });
        }

        // Добавляем новые пройденные вопросы (избегаем дубликатов)
        const existingSet = new Set(progress.completedQuestionIds);
        let newQuestionsCount = 0;

        completedQuestionIds.forEach(qId => {
            if (!existingSet.has(qId)) {
                progress.completedQuestionIds.push(qId);
                existingSet.add(qId);
                newQuestionsCount++;
            }
        });

        // Обновляем статистику
        progress.totalMoves += moves;
        progress.totalTime += timeElapsed;

        // Вычисляем текущую серию (точность в этой сессии)
        const pairsFound = completedQuestionIds.length;
        const minPossibleMoves = pairsFound * 2; // Минимум ходов для идеальной игры
        const accuracy = moves > 0 ? Math.min(100, Math.round((minPossibleMoves / moves) * 100)) : 0;

        // Если точность > 70%, увеличиваем серию
        if (accuracy >= 70) {
            progress.currentStreak += pairsFound;
            if (progress.currentStreak > progress.bestStreak) {
                progress.bestStreak = progress.currentStreak;
            }
        } else {
            progress.currentStreak = 0;
        }

        // Добавляем сессию в историю
        progress.sessions.push({
            date: new Date(),
            questionsCompleted: newQuestionsCount,
            moves,
            timeElapsed,
            cardCount
        });

        // Обновляем время последней игры
        progress.lastPlayedAt = new Date();

        await progress.save();

        // Сохраняем результат в Result для статистики админа
        // Сохраняем каждую завершенную игровую сессию
        try {
            const user = await User.findById(userId);
            if (user) {
                const gameResult = new Result({
                    userEmail: user.email,
                    testId: testId,
                    testTitle: test.title,
                    score: pairsFound,
                    total: pairsFound,
                    answers: [],
                    correctAnswers: [],
                    mistakes: [],
                    shuffledQuestions: [],
                    startTime: new Date(Date.now() - timeElapsed * 1000),
                    endTime: new Date(),
                    duration: timeElapsed,
                    mode: 'game',
                    moves: moves,
                    gameCardCount: cardCount,
                    questionsCompleted: pairsFound
                });
                await gameResult.save();
                console.log('✅ Game result saved:', {
                    user: user.email,
                    test: test.title,
                    pairs: pairsFound,
                    moves: moves,
                    mode: 'game'
                });
            }
        } catch (saveError) {
            console.error('❌ Error saving game result:', saveError);
            // Не прерываем выполнение
        }

        // Проверяем, завершен ли тест полностью
        const isTestComplete = progress.completedQuestionIds.length >= progress.totalQuestions;

        res.json({
            success: true,
            newProgress: {
                completedCount: progress.completedQuestionIds.length,
                totalQuestions: progress.totalQuestions,
                percentComplete: Math.round((progress.completedQuestionIds.length / progress.totalQuestions) * 100),
                currentStreak: progress.currentStreak,
                bestStreak: progress.bestStreak,
                totalMoves: progress.totalMoves,
                totalTime: progress.totalTime
            },
            isTestComplete,
            questionsCompletedInSession: newQuestionsCount
        });
    } catch (error) {
        console.error('Ошибка сохранения сессии игры:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Сбросить прогресс игры для теста (начать заново)
router.delete('/progress/:testId', verifyToken, async (req, res) => {
    try {
        const { testId } = req.params;
        const userId = req.user.id;

        const progress = await GameProgress.findOne({ userId, testId });

        if (!progress) {
            return res.status(404).json({ message: 'Прогресс не найден' });
        }

        // Сбрасываем прогресс, но сохраняем лучшую серию
        const bestStreak = progress.bestStreak;

        progress.completedQuestionIds = [];
        progress.currentStreak = 0;
        progress.bestStreak = bestStreak; // Сохраняем лучший результат
        progress.totalMoves = 0;
        progress.totalTime = 0;
        progress.sessions = [];
        progress.lastPlayedAt = new Date();

        await progress.save();

        res.json({
            success: true,
            message: 'Прогресс сброшен',
            progress: {
                completedCount: 0,
                totalQuestions: progress.totalQuestions,
                percentComplete: 0,
                bestStreak: progress.bestStreak
            }
        });
    } catch (error) {
        console.error('Ошибка сброса прогресса:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
