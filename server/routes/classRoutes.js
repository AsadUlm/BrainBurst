const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const AssignmentProgress = require('../models/AssignmentProgress');
const { verifyToken, requireTeacher } = require('../middleware/authMiddleware');

// Генерируем случайный код присоединения (например, 6 символов)
const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * [Teacher] Создать новый класс
 */
router.post('/', verifyToken, requireTeacher, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Название класса обязательно' });
        }

        // Генерируем уникальный код
        let joinCode;
        let isUnique = false;
        while (!isUnique) {
            joinCode = generateJoinCode();
            const existing = await Class.findOne({ joinCode });
            if (!existing) {
                isUnique = true;
            }
        }

        const newClass = new Class({
            name,
            description: description || '',
            teacherId: req.userId,
            joinCode
        });

        await newClass.save();
        res.status(201).json(newClass);
    } catch (err) {
        console.error('Ошибка создания класса:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * [Teacher] Получить список своих классов
 */
router.get('/my-classes', verifyToken, requireTeacher, async (req, res) => {
    try {
        const classes = await Class.find({ teacherId: req.userId })
            .sort({ createdAt: -1 })
            .populate('students', 'email'); // Опционально возвращаем инфо о студентах
        res.json(classes);
    } catch (err) {
        console.error('Ошибка получения классов учителя:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * [Student] Получить список классов, в которых я состою
 */
router.get('/student-classes', verifyToken, async (req, res) => {
    try {
        // Ищем классы, где текущий пользователь есть в массиве students
        const classes = await Class.find({ students: req.userId })
            .populate('teacherId', 'email');
        res.json(classes);
    } catch (err) {
        console.error('Ошибка получения классов ученика:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * [Student] Вступить в класс по коду
 */
router.post('/join', verifyToken, async (req, res) => {
    try {
        const { joinCode } = req.body;
        if (!joinCode) {
            return res.status(400).json({ error: 'Код класса обязателен' });
        }

        const targetClass = await Class.findOne({ joinCode: joinCode.trim().toUpperCase() });
        if (!targetClass) {
            return res.status(404).json({ error: 'Класс не найден или код неверный' });
        }

        if (!targetClass.isActive) {
            return res.status(400).json({ error: 'Вступление в этот класс закрыто' });
        }

        // Проверяем, не состоит ли пользователь уже там
        if (targetClass.students.includes(req.userId)) {
            return res.status(400).json({ error: 'Вы уже состоите в этом классе' });
        }

        // Добавляем студента
        targetClass.students.push(req.userId);
        await targetClass.save();

        res.json({ message: 'Успешно присоединились к классу!', class: targetClass });
    } catch (err) {
        console.error('Ошибка при вступлении в класс:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

/**
 * [Teacher & Student] Получить информацию о классе (включая учеников для учителя)
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const classId = req.params.id;
        const targetClass = await Class.findById(classId)
            .populate('teacherId', 'email name');

        if (!targetClass) {
            return res.status(404).json({ error: 'Класс не найден' });
        }

        const isTeacher = targetClass.teacherId._id.toString() === req.userId;
        const isStudent = targetClass.students.includes(req.userId);

        if (!isTeacher && !isStudent) {
            return res.status(403).json({ error: 'Нет доступа к этому классу' });
        }

        let responseData = targetClass.toObject();
        responseData.isTeacher = isTeacher;

        // Если это учитель, подгружаем студентов и собираем статистику
        if (isTeacher) {
            await targetClass.populate('students', 'name email');

            // Запрашиваем все назначения для этого класса
            const assignments = await Assignment.find({ classId });
            const assignmentIds = assignments.map(a => a._id);
            const activeAssignments = assignments.filter(a => a.status !== 'archived');
            const activeAssignmentsCount = activeAssignments.length;

            const now = new Date();
            let overdueAssignmentsCount = 0;
            activeAssignments.forEach(a => {
                if (a.dueDate && new Date(a.dueDate) < now) {
                    overdueAssignmentsCount++;
                }
            });

            // Запрашиваем все прогрессы для класса
            const progresses = await AssignmentProgress.find({
                assignmentId: { $in: assignmentIds }
            });

            const activeProgresses = progresses.filter(p => {
                const a = activeAssignments.find(asgn => asgn._id.equals(p.assignmentId));
                return a !== undefined;
            });

            const totalActiveProgresses = activeProgresses.length;
            const submittedActiveProgresses = activeProgresses.filter(p => ['submitted', 'graded', 'excused'].includes(p.status)).length;
            const averageProgress = totalActiveProgresses > 0 ? (submittedActiveProgresses / totalActiveProgresses) * 100 : 0;

            // Считаем Last Activity At
            let lastActivityAt = null;
            if (activeProgresses.length > 0) {
                lastActivityAt = new Date(Math.max(...activeProgresses.map(p => new Date(p.updatedAt).getTime())));
            }

            // Новые студенты за неделю
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const newStudentsThisWeek = targetClass.students.filter(s => new Date(s.createdAt) > oneWeekAgo).length;

            responseData.classStats = {
                activeStudentsCount: targetClass.students.length,
                newStudentsThisWeek,
                activeAssignmentsCount,
                overdueAssignmentsCount,
                averageProgress: Math.round(averageProgress),
                lastActivityAt
            };

            // Статистика студентов
            const studentsStats = targetClass.students.map(student => {
                const studentProgresses = activeProgresses.filter(p => p.studentId.equals(student._id));

                const studentSubmitted = studentProgresses.filter(p => ['submitted', 'graded', 'excused'].includes(p.status)).length;
                let studentOverdue = 0;
                let totalScore = 0;
                let gradedCount = 0;
                let studentLastActivity = null;

                studentProgresses.forEach(p => {
                    const assignment = activeAssignments.find(a => a._id.equals(p.assignmentId));
                    const effectiveStatus = AssignmentProgress.computeStatus(p, assignment);
                    if (effectiveStatus === 'overdue') studentOverdue++;

                    if (p.status === 'graded' && p.bestScore !== null) {
                        totalScore += p.bestScore;
                        gradedCount++;
                    }

                    if (!studentLastActivity || new Date(p.updatedAt) > studentLastActivity) {
                        studentLastActivity = new Date(p.updatedAt);
                    }
                });

                const avgScore = gradedCount > 0 ? totalScore / gradedCount : null;

                return {
                    _id: student._id,
                    name: student.name,
                    email: student.email,
                    stats: {
                        lastActiveAt: studentLastActivity,
                        overdueCount: studentOverdue,
                        submittedCount: studentSubmitted,
                        activeAssignmentsCount: activeAssignmentsCount,
                        avgScore: avgScore !== null ? Math.round(avgScore) : null
                    }
                };
            });

            responseData.students = studentsStats;

        } else {
            // Если студент, скрываем список других студентов и код присоединения для безопасности (опционально)
            delete responseData.students;
            delete responseData.joinCode;

            // Расчет статистики для студента-пользователя (My Progress)
            const activeAssignments = await Assignment.find({ classId, status: { $ne: 'archived' } });
            const assignmentIds = activeAssignments.map(a => a._id);
            const activeAssignmentsCount = activeAssignments.length;

            const progresses = await AssignmentProgress.find({
                assignmentId: { $in: assignmentIds },
                studentId: req.userId
            });

            let studentSubmitted = 0;
            let studentOverdue = 0;
            let totalScore = 0;
            let gradedCount = 0;

            progresses.forEach(p => {
                const assignment = activeAssignments.find(a => a._id.equals(p.assignmentId));
                const effectiveStatus = AssignmentProgress.computeStatus(p, assignment);

                if (['submitted', 'graded', 'excused'].includes(effectiveStatus) || ['submitted', 'graded', 'excused'].includes(p.status)) {
                    studentSubmitted++;
                }

                if (effectiveStatus === 'overdue') {
                    studentOverdue++;
                }

                if (p.status === 'graded' && p.bestScore !== null) {
                    totalScore += p.bestScore;
                    gradedCount++;
                }
            });

            const avgScore = gradedCount > 0 ? totalScore / gradedCount : null;

            // Find next assignment (closest due date, not submitted/excused/graded)
            let nextAssignment = null;
            const incompleteAssignments = activeAssignments.filter(a => {
                const p = progresses.find(prog => prog.assignmentId.equals(a._id));
                if (!p) return true;
                const effStatus = AssignmentProgress.computeStatus(p, a);
                return !['submitted', 'graded', 'excused', 'blocked', 'overdue'].includes(effStatus) && !['submitted', 'graded', 'excused'].includes(p.status);
            });

            if (incompleteAssignments.length > 0) {
                // filter only those with dueDate
                const withDueDate = incompleteAssignments.filter(a => a.dueDate);
                if (withDueDate.length > 0) {
                    withDueDate.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                    if (new Date(withDueDate[0].dueDate) > now) {
                        nextAssignment = {
                            _id: withDueDate[0]._id,
                            title: withDueDate[0].title || withDueDate[0].testId?.title || 'Без названия',
                            testId: withDueDate[0].testId?._id || withDueDate[0].testId,
                            dueDate: withDueDate[0].dueDate
                        };
                    }
                } else {
                    // if no due dates, just take the newest assigned
                    incompleteAssignments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    nextAssignment = {
                        _id: incompleteAssignments[0]._id,
                        title: incompleteAssignments[0].title || incompleteAssignments[0].testId?.title || 'Без названия',
                        testId: incompleteAssignments[0].testId?._id || incompleteAssignments[0].testId,
                        dueDate: null
                    };
                }
            }

            // populating titles for nextAssignment requires populate testId if title is empty, but we might not have populated it.
            if (nextAssignment && nextAssignment.title === 'Без названия') {
                const targetA = activeAssignments.find(a => a._id.equals(nextAssignment._id));
                if (targetA && targetA.testId) {
                    await targetA.populate('testId', 'title');
                    nextAssignment.title = targetA.title || targetA.testId?.title || 'Без названия';
                }
            }

            responseData.studentStats = {
                activeAssignmentsCount,
                submittedCount: studentSubmitted,
                overdueCount: studentOverdue,
                avgScore: avgScore !== null ? Math.round(avgScore) : null,
                nextAssignment
            };

            responseData.classStats = {
                activeStudentsCount: targetClass.students.length
            };
        }

        res.json(responseData);
    } catch (err) {
        console.error('Ошибка получения информации о классе:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});
/**
 * [Teacher] Удалить ученика из класса
 */
router.delete('/:id/students/:studentId', verifyToken, requireTeacher, async (req, res) => {
    try {
        const classId = req.params.id;
        const studentId = req.params.studentId;

        const targetClass = await Class.findById(classId);
        if (!targetClass) {
            return res.status(404).json({ error: 'Класс не найден' });
        }

        // Проверяем, что класс принадлежит учителю
        if (targetClass.teacherId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Нет доступа. Вы не учитель этого класса.' });
        }

        // Проверяем, есть ли студент в классе
        if (!targetClass.students.includes(studentId)) {
            return res.status(400).json({ error: 'Ученик не найден в этом классе' });
        }

        // Удаляем студента
        targetClass.students = targetClass.students.filter(id => id.toString() !== studentId);
        await targetClass.save();

        res.json({ message: 'Ученик успешно удален из класса' });
    } catch (err) {
        console.error('Ошибка при удалении ученика из класса:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;
