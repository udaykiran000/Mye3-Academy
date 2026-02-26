import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/Category.js';
import MockTest from './models/MockTest.js';
import User from './models/Usermodel.js';
import Attempt from './models/Attempt.js';
import Order from './models/Order.js';
import Doubt from './models/Doubt.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    console.log('Cleaning up existing data...');
    await Category.deleteMany({});
    await MockTest.deleteMany({});
    await Attempt.deleteMany({});
    await Order.deleteMany({});
    await Doubt.deleteMany({});
    // await User.deleteMany({ role: { $ne: 'admin' } }); // Optional: wipe non-admins

    const examData = [
      { name: 'SSC CGL', img: 'https://plus.unsplash.com/premium_photo-1661331776915-181516e81404?w=400&h=400&fit=crop' },
      { name: 'RRB NTPC', img: 'https://images.unsplash.com/photo-1474487024268-c290de04b914?w=400&h=400&fit=crop' },
      { name: 'IBPS PO', img: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=400&h=400&fit=crop' },
      { name: 'SBI Clerk', img: 'https://images.unsplash.com/photo-1550565118-3a14e8d0386f?w=400&h=400&fit=crop' },
      { name: 'UPSC Prelims', img: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=400&h=400&fit=crop' },
      { name: 'APPSC Group 1', img: 'https://images.unsplash.com/photo-1524492459423-0143bc01fe1e?w=400&h=400&fit=crop' },
      { name: 'TSPSC Group 2', img: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=400&h=400&fit=crop' },
      { name: 'JEE Main', img: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop' },
      { name: 'NEET UG', img: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=400&fit=crop' },
      { name: 'GATE CS', img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop' },
      { name: 'CAT Exam', img: 'https://images.unsplash.com/photo-1454165833222-387379f08949?w=400&h=400&fit=crop' },
      { name: 'CLAT 2025', img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=400&fit=crop' },
      { name: 'NDA/NA', img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=400&fit=crop' },
      { name: 'Air Force X&Y', img: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400&h=400&fit=crop' },
      { name: 'Police SI', img: 'https://images.unsplash.com/photo-1502102125583-f65584e22606?w=400&h=400&fit=crop' },
      { name: 'TET/CTET', img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=400&fit=crop' },
      { name: 'LIC AAO', img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=400&fit=crop' },
      { name: 'RBI Grade B', img: 'https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?w=400&h=400&fit=crop' },
      { name: 'DRDO MTS', img: 'https://images.unsplash.com/photo-1581093458791-9f3c3250bb8b?w=400&h=400&fit=crop' },
      { name: 'ISRO Scientist', img: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=400&fit=crop' }
    ];

    console.log('Seeding 20 categories with realistic images...');
    const categoryIds = [];
    for (let i = 0; i < examData.length; i++) {
        const { name, img } = examData[i];
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        const cat = await Category.findOneAndUpdate(
            { slug: slug },
            { 
                name: name, 
                slug: slug, 
                description: `Complete preparation for ${name} exams.`,
                image: img 
            },
            { upsert: true, new: true }
        );
        categoryIds.push(cat);
    }

    const generateQuestions = (count) => {
        const questions = [];
        for (let j = 1; j <= count; j++) {
            questions.push({
                questionType: 'mcq',
                title: `Sample Question ${j}: This is a dummy question for testing.`,
                options: [
                    { text: 'Option A (Incorrect)' },
                    { text: 'Option B (Correct answer)' },
                    { text: 'Option C (Distractor)' },
                    { text: 'Option D (Distractor)' }
                ],
                correct: [1],
                marks: 1,
                negative: 0.25,
                difficulty: j % 3 === 0 ? 'hard' : j % 2 === 0 ? 'medium' : 'easy',
                category: 'General Studies'
            });
        }
        return questions;
    };

    console.log('Seeding 100 Mock Tests (Multiple per category)...');
    for (let k = 1; k <= 100; k++) {
        const catIdx = (k - 1) % categoryIds.length;
        const cat = categoryIds[catIdx];
        const qCount = Math.floor(Math.random() * 41) + 10; // 10 to 50
        const isFree = k % 4 === 0; // 25% free

        await MockTest.findOneAndUpdate(
            { subcategory: `test-mock-${k}` },
            {
                title: `${cat.name} Practice Set ${Math.floor((k-1)/categoryIds.length) + 1}`,
                description: `Full-length practice test for ${cat.name}.`,
                subcategory: `test-mock-${k}`,
                category: cat._id,
                categorySlug: cat.slug,
                totalQuestions: qCount,
                durationMinutes: qCount * 1.5,
                totalMarks: qCount,
                price: isFree ? 0 : 99 + (k * 2),
                discountPrice: isFree ? 0 : 49 + (k * 1),
                isFree: isFree,
                isPublished: true,
                isGrandTest: false,
                thumbnail: `https://images.unsplash.com/photo-1620912189865-1e8a33da4c5e?w=300&h=200&fit=crop&q=60&test=${k}`,
                questions: generateQuestions(qCount),
                subjects: [{ name: 'Aptitude', easy: qCount, medium: 0, hard: 0 }]
            },
            { upsert: true }
        );
    }

    console.log('Seeding 10 Grand Tests...');
    for (let g = 1; g <= 10; g++) {
        const catIdx = (g + 5) % categoryIds.length;
        const cat = categoryIds[catIdx];
        const qCount = 100;

        await MockTest.findOneAndUpdate(
            { subcategory: `test-grand-${g}` },
            {
                title: `${cat.name} GRAND TEST ${g}`,
                description: `All India Live Ranking Test for ${cat.name}.`,
                subcategory: `test-grand-${g}`,
                category: cat._id,
                categorySlug: cat.slug,
                totalQuestions: qCount,
                durationMinutes: 120,
                totalMarks: qCount,
                price: g % 2 === 0 ? 0 : 250,
                isFree: g % 2 === 0,
                isPublished: true,
                isGrandTest: true,
                thumbnail: `https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=200&fit=crop&q=60&grand=${g}`,
                scheduledFor: new Date(Date.now() + g * 24 * 60 * 60 * 1000),
                questions: generateQuestions(qCount),
                subjects: [{ name: 'Full Syllabus', easy: 50, medium: 30, hard: 20 }]
            },
            { upsert: true }
        );
    }

    const hashedTestPassword = await bcrypt.hash('password123', 10);

    console.log('Seeding 20 Students...');
    for (let s = 1; s <= 20; s++) {
        await User.findOneAndUpdate(
            { email: `student${s}@example.com` },
            {
                firstname: ['Arun', 'Bala', 'Chaitu', 'Deepak', 'Eswar', 'Fani'][s % 6],
                lastname: ['Kumar', 'Reddy', 'Yadav', 'Verma', 'Singh'][s % 5],
                phoneNumber: `98765432${s.toString().padStart(2, '0')}`,
                email: `student${s}@example.com`,
                password: hashedTestPassword,
                role: 'student',
                isVerified: true,
                avatar: `https://i.pravatar.cc/150?u=student${s}@example.com`,
                isActive: true
            },
            { upsert: true }
        );
    }

    console.log('Seeding 5 Instructors...');
    for (let i = 1; i <= 5; i++) {
        await User.findOneAndUpdate(
            { email: `instructor${i}@example.com` },
            {
                firstname: ['Dr. Ramesh', 'Prof. Suresh', 'Mrs. Vani', 'Ms. Priya', 'Mr. Kiran'][i % 5],
                lastname: 'Expert',
                phoneNumber: `998877660${i}`,
                email: `instructor${i}@example.com`,
                password: hashedTestPassword,
                role: 'instructor',
                isVerified: true,
                avatar: `https://i.pravatar.cc/150?u=instructor${i}@example.com`,
                isActive: true
            },
            { upsert: true }
        );
    }

    console.log('Seeding 5 Institutions...');
    for (let j = 1; j <= 5; j++) {
        await User.findOneAndUpdate(
            { email: `inst${j}@academy.com` },
            {
                firstname: ['Vivekananda', 'Chaitanya', 'Narayana', 'Pragati', 'Aditya'][j % 5],
                lastname: 'Academy',
                phoneNumber: `887766550${j}`,
                email: `inst${j}@academy.com`,
                password: hashedTestPassword,
                role: 'institution',
                isVerified: true,
                avatar: `https://placehold.co/150x150?text=${['Vivekananda', 'Chaitanya', 'Narayana', 'Pragati', 'Aditya'][j % 5]}`,
                isActive: true
            },
            { upsert: true }
        );
    }

    console.log('Seeding 50 Attempts...');
    const students = await User.find({ role: 'student' });
    const tests = await MockTest.find({ isPublished: true }).limit(20);
    
    for (let a = 1; a <= 50; a++) {
        const student = students[Math.floor(Math.random() * students.length)];
        const test = tests[Math.floor(Math.random() * tests.length)];
        const score = Math.floor(Math.random() * test.totalMarks);
        
        await Attempt.create({
            studentId: student._id,
            mocktestId: test._id,
            score: score,
            correctCount: Math.floor(score / 1),
            submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            status: 'completed'
        });
    }

    console.log('Seeding 30 Orders...');
    for (let o = 1; o <= 30; o++) {
        const student = students[Math.floor(Math.random() * students.length)];
        const test = tests[Math.floor(Math.random() * tests.length)];
        const status = ['successful', 'failed', 'created'][o % 3];
        
        await Order.create({
            user: student._id,
            items: [test._id],
            amount: test.discountPrice || test.price,
            status: status,
            createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
        });
    }

    console.log('Seeding 25 Doubts...');
    const instructors = await User.find({ role: 'instructor' });
    const subjectList = ['Aptitude', 'Reasoning', 'English', 'General Studies', 'Mathematics'];
    
    for (let d = 1; d <= 25; d++) {
        const student = students[Math.floor(Math.random() * students.length)];
        const test = tests[Math.floor(Math.random() * tests.length)];
        const instructor = instructors[Math.floor(Math.random() * instructors.length)];
        const status = ['pending', 'assigned', 'answered'][d % 3];
        
        await Doubt.create({
            student: student._id,
            mocktestId: d % 2 === 0 ? test._id : null,
            type: d % 2 === 0 ? 'mocktest' : 'general',
            subject: subjectList[Math.floor(Math.random() * subjectList.length)],
            text: `Sample Doubt ${d}: I have a question regarding the logic used in this section.`,
            status: status,
            assignedInstructor: status !== 'pending' ? instructor._id : null,
            answer: status === 'answered' ? 'This is a sample answer to resolve your doubt. Please review the core concepts.' : '',
            createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)
        });
    }

    console.log('Bulk Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
