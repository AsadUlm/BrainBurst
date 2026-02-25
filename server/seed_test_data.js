const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Class = require('./models/Class');
const Test = require('./models/Test');
const Assignment = require('./models/Assignment');
const AssignmentProgress = require('./models/AssignmentProgress');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/brainburst', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const passwordHash = await bcrypt.hash('Abc123456', 10);

        // 1. Create Teacher
        let teacher = await User.findOne({ email: 'teacher_demo@test.com' });
        if (!teacher) {
            teacher = new User({ name: 'Demo Teacher', email: 'teacher_demo@test.com', password: passwordHash, role: 'teacher' });
            await teacher.save();
        }

        // 2. Create Student
        let student = await User.findOne({ email: 'student_demo@test.com' });
        if (!student) {
            student = new User({ name: 'Demo Student', email: 'student_demo@test.com', password: passwordHash, role: 'student' });
            await student.save();
        }

        // 3. Create Class
        let testClass = await Class.findOne({ name: 'Demo Class 101' });
        if (!testClass) {
            testClass = new Class({ name: 'Demo Class 101', teacherId: teacher._id, students: [student._id] });
            await testClass.save();

            // Update user classes
            student.classes.push(testClass._id);
            await student.save();
            teacher.classes.push(testClass._id);
            await teacher.save();
        }

        // 4. Create a Category & Test
        const Category = require('./models/Category');
        let cat = await Category.findOne({ name: 'Demo Category' });
        if (!cat) {
            cat = new Category({ name: 'Demo Category', color: '#ff0000', mapColor: '#ff0000', icon: 'star' });
            await cat.save();
        }

        let test = await Test.findOne({ title: 'Demo Test 1' });
        if (!test) {
            test = new Test({
                title: 'Demo Test 1',
                description: 'A test for assignment progress',
                category: cat._id,
                timeLimit: 10,
                questions: [
                    {
                        text: '2 + 2 = ?',
                        options: ['3', '4', '5'],
                        correctIndex: 1,
                        explanation: 'Math',
                        questionType: 'multiple-choice'
                    }
                ]
            });
            await test.save();
        }

        console.log('Seeding complete.');

        // Print credentials for subagent
        console.log('Teacher: teacher_demo@test.com / Abc123456');
        console.log('Student: student_demo@test.com / Abc123456');

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
