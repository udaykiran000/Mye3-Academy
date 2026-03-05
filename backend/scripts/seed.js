import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import slugify from 'slugify';

// Models
import Category from '../models/Category.js';
import MockTest from '../models/MockTest.js';
import GrandTest from '../models/GrandTest.js';
import Attempt from '../models/Attempt.js';
import Order from '../models/Order.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const categoriesData = [
  { name: 'SSC', description: 'Staff Selection Commission Exams' },
  { name: 'Banking', description: 'IBPS, SBI, and RBI Exams' },
  { name: 'Railways', description: 'RRB NTPC, Group D, and ALP' },
  { name: 'Police', description: 'State Police Constable and SI' },
  { name: 'UPSC', description: 'Civil Services and Other UPSC Exams' },
];

const sampleQuestions = [
  {
    questionType: 'mcq',
    title: 'What is the capital of India?',
    options: [
      { text: 'Mumbai' },
      { text: 'New Delhi' },
      { text: 'Kolkata' },
      { text: 'Chennai' }
    ],
    correct: [1],
    marks: 2,
    negative: 0.5,
    difficulty: 'easy',
    category: 'General Awareness'
  },
  {
    questionType: 'mcq',
    title: 'Which planet is known as the Red Planet?',
    options: [
      { text: 'Venus' },
      { text: 'Mars' },
      { text: 'Jupiter' },
      { text: 'Saturn' }
    ],
    correct: [1],
    marks: 2,
    negative: 0.5,
    difficulty: 'easy',
    category: 'Science'
  },
  {
    questionType: 'manual',
    title: 'Explain the Law of Gravity in one sentence.',
    correctManualAnswer: 'Everything that goes up must come down due to gravitational pull.',
    marks: 5,
    negative: 0,
    difficulty: 'medium',
    category: 'Physics'
  },
  {
    questionType: 'mcq',
    title: 'What is 5 + 7?',
    options: [
      { text: '10' },
      { text: '11' },
      { text: '12' },
      { text: '13' }
    ],
    correct: [2],
    marks: 2,
    negative: 0.5,
    difficulty: 'easy',
    category: 'Mathematics'
  },
  {
    questionType: 'mcq',
    title: 'Who wrote the Indian Constitution?',
    options: [
      { text: 'Mahatma Gandhi' },
      { text: 'Jawaharlal Nehru' },
      { text: 'B.R. Ambedkar' },
      { text: 'Subhash Chandra Bose' }
    ],
    correct: [2],
    marks: 2,
    negative: 0.5,
    difficulty: 'easy',
    category: 'History'
  }
];

async function seed() {
  try {
    const mongoUrl = process.env.MONGODB_URL || 'mongodb+srv://nrakeshkumar36_db_user:rakesh@cluster0.xbbx94r.mongodb.net';
    console.log('Connecting to MongoDB at:', mongoUrl.split('@')[1] || 'URL HIDDEN');
    
    await mongoose.connect(mongoUrl);

    console.log('Clearing existing data...');
    // Clear one by one to catch specific failures
    await Category.deleteMany({});
    console.log('- Categories cleared');
    await MockTest.deleteMany({});
    console.log('- MockTests cleared');
    await GrandTest.deleteMany({});
    console.log('- GrandTests cleared');
    await Attempt.deleteMany({});
    console.log('- Attempts cleared');
    await Order.deleteMany({});
    console.log('- Orders cleared');

    console.log('Seeding Categories...');
    const createdCategories = await Category.insertMany(
      categoriesData.map(c => ({
        ...c,
        slug: slugify(c.name, { lower: true, strict: true }),
        image: null
      }))
    );

    const getRandCat = () => createdCategories[Math.floor(Math.random() * createdCategories.length)];

    console.log('Seeding 50 Mock Tests...');
    const mockTests = [];
    for (let i = 1; i <= 50; i++) {
      const cat = getRandCat();
      const sub = i % 2 === 0 ? 'Full Length' : 'Subject Wise';
      mockTests.push({
        title: `${cat.name} Mock Test ${i}`,
        description: `This is a practice mock test for ${cat.name} candidates.`,
        category: cat._id,
        categorySlug: cat.slug,
        subcategory: sub,
        totalMarks: 10,
        totalQuestions: 5,
        durationMinutes: 30,
        marksPerQuestion: 2,
        negativeMarking: 0.5,
        price: i % 5 === 0 ? 99 : 0,
        discountPrice: i % 5 === 0 ? 49 : 0,
        isFree: i % 5 !== 0,
        isPublished: true,
        questions: sampleQuestions,
        thumbnail: null,
        subjects: [
          { name: 'General Awareness', easy: 2, medium: 0, hard: 0 },
          { name: 'Science', easy: 1, medium: 0, hard: 0 },
          { name: 'Physics', easy: 0, medium: 1, hard: 0 }
        ]
      });
    }
    await MockTest.insertMany(mockTests);

    console.log('Seeding 25 Grand Tests...');
    const grandTests = [];
    for (let i = 1; i <= 25; i++) {
      const cat = getRandCat();
      grandTests.push({
        title: `${cat.name} Grand Test ${i}`,
        description: `This is a full-length grand test for ${cat.name} preparation.`,
        category: cat._id,
        categorySlug: cat.slug,
        subcategory: 'Grand Full Length',
        totalMarks: 100,
        totalQuestions: 50,
        durationMinutes: 120,
        marksPerQuestion: 2,
        negativeMarking: 0.5,
        price: 499,
        discountPrice: 299,
        isFree: false,
        isPublished: true,
        isGrandTest: true,
        questions: Array(10).fill(sampleQuestions).flat(), // 50 questions
        thumbnail: null,
        subjects: [
          { name: 'Full Syllabus', easy: 30, medium: 15, hard: 5 }
        ]
      });
    }
    await GrandTest.insertMany(grandTests);

    console.log('✅ Database seeded successfully!');
    console.log(`- Categories: ${createdCategories.length}`);
    console.log(`- Mock Tests: 50`);
    console.log(`- Grand Tests: 25`);
    console.log('- Total Attempts & Orders: Cleared');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed!');
    console.error(err);
    if (err.errors) {
       console.error('Validation Errors:', JSON.stringify(err.errors, null, 2));
    }
    process.exit(1);
  }
}

seed();
