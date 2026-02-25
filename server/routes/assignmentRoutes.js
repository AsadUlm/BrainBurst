const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Class = require('../models/Class');
const Test = require('../models/Test');
const AssignmentProgress = require('../models/AssignmentProgress');
const Result = require('../models/Result');
const GameResult = require('../models/GameResult');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { verifyToken, requireTeacher } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

/**
 * [Teacher] Создать новое назначение (Assignment)
 */
router.post('/', verifyToken, requireTeacher, async (req, res) => {
    try {
        const { testId, classId, title, dueDate, attemptsAllowed, rewardPolicy, settingsOverrides, maxScore } = req.body;

        if (!testId || !classId) {
            return res.status(400).json({ error: 'testId и classId обязательны' });
        }

        // Проверяем, что класс принадлежит этому учителю
        const targetClass = await Class.findById(classId);
        if (!targetClass) {
            return res.status(404).json({ error: 'Класс не найден' });
        }
        if (targetClass.teacherId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Вы не являетесь учителем этого класса' });
        }

        // Проверяем, что тест существует
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ error: 'Тест не найден' });
        }

        const newAssignment = new Assignment({
            testId,
            classId,
            title: title || test.title, // Use provided title or fallback to test title
            teacherId: req.userId,
            dueDate: dueDate || null,
            attemptsAllowed: attemptsAllowed || null,
            rewardPolicy: rewardPolicy || null,
            maxScore: maxScore !== undefined ? maxScore : 100,
            settingsOverrides: settingsOverrides || {}
        });

        await newAssignment.save();

        // Инициализируем прогресс для всех студентов в классе и отправляем уведомления
        if (targetClass.students && targetClass.students.length > 0) {
            const progressDocs = targetClass.students.map(studentId => ({
                assignmentId: newAssignment._id,
                studentId: studentId,
                status: 'assigned'
            }));
            await AssignmentProgress.insertMany(progressDocs);

            // Create notification for new assignment
            const assignmentTitle = title || test.title;
            const className = targetClass.name;
            const now = new Date();
            const notificationDocs = targetClass.students.map(studentId => ({
                user: studentId,
                type: 'test',
                title: 'Новое задание!',
                message: `Назначен новый тест "${assignmentTitle}" в классе "${className}".`,
                relatedId: newAssignment._id,
                createdAt: now
            }));

            try {
                await Notification.insertMany(notificationDocs);
            } catch (notifyErr) {
                console.error('Ошибка создания уведомлений о новом задании:', notifyErr);
            }
        }

        res.status(201).json(newAssignment);
    } catch (err) {
        console.error('Ошибка создания назначения:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * [Teacher & Student] Получить список назначений для конкретного класса
 */
router.get('/class/:classId', verifyToken, async (req, res) => {
    try {
        const { classId } = req.params;

        const targetClass = await Class.findById(classId);
        if (!targetClass) {
            return res.status(404).json({ error: 'Класс не найден' });
        }

        const isTeacher = targetClass.teacherId.toString() === req.userId;
        const isStudent = targetClass.students.includes(req.userId);

        if (!isTeacher && !isStudent) {
            return res.status(403).json({ error: 'Нет доступа к этому классу' });
        }

        const query = { classId };

        // Поддержка фильтрации по статусу для всех
        if (req.query.status) {
            if (req.query.status === 'active') {
                query.$or = [
                    { status: 'active' },
                    { status: { $exists: false }, isActive: true }
                ];
            } else if (req.query.status === 'archived') {
                query.$or = [
                    { status: 'archived' },
                    { status: { $exists: false }, isActive: false }
                ];
            }
        } else {
            // По умолчанию (если статус не передан) показываем только активные
            query.$or = [
                { status: 'active' },
                { status: { $exists: false }, isActive: true }
            ];
        }

        const assignments = await Assignment.find(query)
            .populate('testId', 'title category') // Отдаем только базовую инфу о тесте в списке
            .sort({ createdAt: -1 });

        // Добавляем информацию о прогрессе
        const assignmentIds = assignments.map(a => a._id);

        // Для студента - только его прогресс
        if (isStudent && !isTeacher) {
            const progresses = await AssignmentProgress.find({
                assignmentId: { $in: assignmentIds },
                studentId: req.userId
            });
            const progressMap = {};
            progresses.forEach(p => { progressMap[p.assignmentId.toString()] = p; });

            const assignmentsWithProgress = assignments.map(a => {
                const aObj = a.toObject();
                const progressRaw = progressMap[a._id.toString()];
                if (progressRaw) {
                    const progressObj = progressRaw.toObject ? progressRaw.toObject() : progressRaw;
                    progressObj.computedStatus = AssignmentProgress.computeStatus(progressRaw, a);
                    aObj.progress = progressObj;
                } else {
                    aObj.progress = null;
                }
                return aObj;
            });
            return res.json(assignmentsWithProgress);
        }

        // Для учителя - агрегированная статистика по сдачам
        if (isTeacher) {
            const progresses = await AssignmentProgress.find({
                assignmentId: { $in: assignmentIds }
            });

            const statsMap = {};
            assignments.forEach(a => {
                statsMap[a._id.toString()] = { total: 0, submitted: 0, overdue: 0, graded: 0, totalScore: 0 };
            });

            progresses.forEach(p => {
                const aId = p.assignmentId.toString();
                if (statsMap[aId]) {
                    statsMap[aId].total += 1;

                    const assignment = assignments.find(a => a._id.equals(p.assignmentId));
                    const effectiveStatus = AssignmentProgress.computeStatus(p, assignment);

                    if (['submitted', 'graded', 'excused'].includes(p.status)) {
                        statsMap[aId].submitted += 1;
                    }
                    if (effectiveStatus === 'overdue') {
                        statsMap[aId].overdue += 1;
                    }
                    if (p.status === 'graded' && p.bestScore !== null) {
                        statsMap[aId].graded += 1;
                        statsMap[aId].totalScore += p.bestScore;
                    }
                }
            });

            const assignmentsWithStats = assignments.map(a => {
                const aObj = a.toObject();
                const stats = statsMap[a._id.toString()];
                if (stats) {
                    stats.avgScore = stats.graded > 0 ? Math.round(stats.totalScore / stats.graded) : null;
                    delete stats.totalScore;
                }
                aObj.progressStats = stats;
                return aObj;
            });
            return res.json(assignmentsWithStats);
        }

        res.json(assignments);
    } catch (err) {
        console.error('Ошибка получения назначений класса:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * [Teacher & Student] Получить информацию о конкретном назначении (и сам тест с Effective Settings)
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id)
            .populate('testId')
            .populate('classId', 'name teacherId students');

        if (!assignment) {
            return res.status(404).json({ error: 'Назначение не найдено' });
        }

        const targetClass = assignment.classId;
        const isTeacher = targetClass.teacherId.toString() === req.userId;
        const isStudent = targetClass.students && targetClass.students.some(s => s.toString() === req.userId);

        if (!isTeacher && !isStudent) {
            return res.status(403).json({ error: 'Нет доступа к этому назначению' });
        }

        const attemptsAllowed = assignment.attemptsAllowed || assignment.settingsOverrides?.attemptsAllowed || null;

        const responseData = {
            _id: assignment._id,
            title: assignment.title,
            isActive: assignment.isActive,
            status: assignment.status,
            dueDate: assignment.dueDate,
            attemptsAllowed: attemptsAllowed,
            rewardPolicy: assignment.rewardPolicy || null,
            classId: targetClass._id,
            teacherId: assignment.teacherId,
            test: assignment.testId.toObject() // Полный тест
        };

        // Применяем overrides к тесту, если они есть
        responseData.effectiveSettings = {
            timeLimit: assignment.settingsOverrides?.timeLimit !== null
                ? assignment.settingsOverrides.timeLimit
                : responseData.test.timeLimit,
            attemptsAllowed: attemptsAllowed // kept for backward compatibility on frontend if needed
        };

        if (isStudent) {
            const progress = await AssignmentProgress.findOne({
                assignmentId: assignment._id,
                studentId: req.userId
            });
            if (progress) {
                responseData.progress = {
                    status: progress.status,
                    computedStatus: AssignmentProgress.computeStatus(progress, assignment),
                    attemptCount: progress.attemptCount,
                    bestScore: progress.bestScore,
                    teacherComment: progress.teacherComment,
                    gradedAt: progress.gradedAt,
                    excusedAt: progress.excusedAt,
                    blockedAt: progress.blockedAt
                };
            }
        }

        res.json(responseData);
    } catch (err) {
        console.error('Ошибка получения назначения:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * [Student] Отметить начало выполнения задания (переход в in_progress)
 */
router.post('/:id/progress/start', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        let progress = await AssignmentProgress.findOne({
            assignmentId: id,
            studentId: req.userId
        });

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ error: 'Назначение не найдено' });
        }

        // 1. Проверяем доступ к классу
        const targetClass = await Class.findById(assignment.classId);
        if (!targetClass || !targetClass.students.includes(req.userId)) {
            return res.status(403).json({ error: 'Нет доступа к этому заданию' });
        }

        // 2. Если прогресса нет - создаем
        if (!progress) {
            progress = new AssignmentProgress({
                assignmentId: id,
                studentId: req.userId,
                status: 'assigned'
            });
            await progress.save();
        }

        // 3. Вычисляем динамический статус
        const computedStatus = AssignmentProgress.computeStatus(progress, assignment);

        // 4. Проверяем, можно ли начинать
        const terminalStatuses = ['graded', 'excused', 'blocked'];
        if (terminalStatuses.includes(progress.status)) {
            return res.status(403).json({ error: 'Задание заблокировано, оценено или вы освобождены' });
        }

        // 5. Проверяем попытки (если это новая попытка, т.е. был submitted)
        // Для первого раза (assigned -> in_progress) attemptCount = 0
        const maxAttempts = assignment.attemptsAllowed || assignment.settingsOverrides?.attemptsAllowed;
        if (maxAttempts) {
            if (progress.attemptCount >= maxAttempts && progress.status !== 'in_progress') {
                // Если статус не in_progress - значит это новая попытка
                progress.status = 'blocked';
                await progress.save();
                return res.status(403).json({ error: 'Превышено количество попыток' });
            }
        }

        // 6. Выполняем переход
        if (progress.status === 'assigned' || progress.status === 'submitted') {
            progress.status = 'in_progress';
            progress.startedAt = new Date();
            await progress.save();
        }

        return res.json(progress);
    } catch (err) {
        console.error('Ошибка начала выполнения:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * [Teacher] Получить прогресс всех студентов для конкретного назначения
 */
router.get('/:id/progress', verifyToken, requireTeacher, async (req, res) => {
    try {
        const { id } = req.params;
        const assignment = await Assignment.findById(id).populate('classId');

        if (!assignment) {
            return res.status(404).json({ error: 'Назначение не найдено' });
        }

        if (assignment.teacherId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Нет доступа' });
        }

        const progressesRaw = await AssignmentProgress.find({ assignmentId: id })
            .populate('studentId', 'name email avatarUrl');

        const progresses = progressesRaw.map(p => {
            const pObj = p.toObject();
            pObj.computedStatus = AssignmentProgress.computeStatus(p, assignment);
            pObj.attemptsAllowed = assignment.attemptsAllowed || assignment.settingsOverrides?.attemptsAllowed || null;
            pObj.lastAttemptAt = p.updatedAt; // updatedAt reflects the last time progress was changed/attempted
            return pObj;
        });

        res.json(progresses);
    } catch (err) {
        console.error('Ошибка получения прогресса:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * [Teacher] Изменить статус студента вручную (graded, excused, blocked)
 */
router.put('/:id/progress/:studentId/status', verifyToken, requireTeacher, async (req, res) => {
    try {
        const { id, studentId } = req.params;
        const { status, manualGrade, teacherComment } = req.body;

        const validStatuses = ['assigned', 'in_progress', 'submitted', 'blocked', 'graded', 'excused'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Неверный статус' });
        }

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ error: 'Назначение не найдено' });
        }

        if (assignment.teacherId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Нет доступа' });
        }

        let progress = await AssignmentProgress.findOne({ assignmentId: id, studentId });

        if (!progress) {
            progress = new AssignmentProgress({
                assignmentId: id,
                studentId,
                status
            });
        } else {
            progress.status = status;
        }

        if (teacherComment !== undefined) {
            progress.teacherComment = teacherComment;
        }

        if (status === 'graded') {
            if (manualGrade !== undefined) progress.bestScore = manualGrade;
            progress.gradedAt = new Date();
        } else if (status === 'excused') {
            progress.excusedAt = new Date();
        } else if (status === 'blocked') {
            progress.blockedAt = new Date();
        }

        await progress.save();
        const computedProgress = progress.toObject();
        computedProgress.computedStatus = AssignmentProgress.computeStatus(progress, assignment);

        res.json(computedProgress);
    } catch (err) {
        console.error('Ошибка изменения статуса:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


/**
 * [Teacher] Архивировать назначение
 */
router.post('/:id/archive', verifyToken, requireTeacher, async (req, res) => {
    try {
        const { id } = req.params;
        const assignment = await Assignment.findById(id);

        if (!assignment) {
            return res.status(404).json({ error: 'Назначение не найдено' });
        }
        if (assignment.teacherId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Нет доступа' });
        }

        assignment.status = 'archived';
        // Optionally update isActive for backward compatibility
        assignment.isActive = false;
        await assignment.save();

        res.json({ message: 'Назначение архивировано', assignment });
    } catch (err) {
        console.error('Ошибка архивации:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * [Teacher] Разархивировать назначение
 */
router.post('/:id/unarchive', verifyToken, requireTeacher, async (req, res) => {
    try {
        const { id } = req.params;
        const assignment = await Assignment.findById(id);

        if (!assignment) {
            return res.status(404).json({ error: 'Назначение не найдено' });
        }
        if (assignment.teacherId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Нет доступа' });
        }

        assignment.status = 'active';
        assignment.isActive = true;
        await assignment.save();

        res.json({ message: 'Назначение восстановлено', assignment });
    } catch (err) {
        console.error('Ошибка восстановления:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * [Teacher] Удалить назначение (каскадное удаление)
 */
router.delete('/:id', verifyToken, requireTeacher, async (req, res) => {
    let session = null;
    try {
        const { id } = req.params;
        const assignment = await Assignment.findById(id);

        if (!assignment) {
            return res.status(404).json({ error: 'Назначение не найдено' });
        }
        if (assignment.teacherId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Нет доступа' });
        }

        session = await require('mongoose').startSession();
        session.startTransaction();

        // 1. Delete Assignment Progress
        await AssignmentProgress.deleteMany({ assignmentId: id }, { session });

        // 2. Delete Results
        await Result.deleteMany({ assignmentId: id }, { session });

        // 3. Delete Game Results
        if (GameResult) {
            await GameResult.deleteMany({ assignmentId: id }, { session });
        }

        // 4. Delete Assignment itself
        await Assignment.findByIdAndDelete(id, { session });

        await session.commitTransaction();
        session.endSession();

        res.json({ message: 'Назначение успешно удалено' });
    } catch (err) {
        console.error('Ошибка удаления назначения:', err);
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        res.status(500).json({ error: 'Ошибка сервера при удалении' });
    }
});

/**
 * [Teacher] Получить историю попыток (Result) конкретного студента для конкретного назначения
 */
router.get('/:id/student/:studentId/attempts', verifyToken, requireTeacher, async (req, res) => {
    try {
        const { id, studentId } = req.params;
        const assignment = await Assignment.findById(id);

        if (!assignment) {
            return res.status(404).json({ error: 'Назначение не найдено' });
        }

        if (assignment.teacherId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Нет доступа' });
        }

        const user = await User.findById(studentId);
        if (!user) {
            return res.status(404).json({ error: 'Студент не найден' });
        }

        const mode = assignment.effectiveSettings?.mode || 'standard';
        let results = [];

        if (mode === 'game') {
            results = await GameResult.find({ assignmentId: id, userId: studentId })
                .sort({ completedAt: -1 });
        } else {
            results = await Result.find({ assignmentId: id, userEmail: user.email })
                .sort({ createdAt: -1 });
        }

        res.json(results);
    } catch (err) {
        console.error('Ошибка получения истории попыток:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;
