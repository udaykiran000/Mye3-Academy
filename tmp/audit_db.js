import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Correctly load .env from the backend directory
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

// Use relative paths from the script's location
import MockTest from '../backend/models/MockTest.js';
import GrandTest from '../backend/models/GrandTest.js';

async function audit() {
  try {
    const mongoUrl = process.env.MONGODB_URL || 'mongodb+srv://nrakeshkumar36_db_user:rakesh@cluster0.xbbx94r.mongodb.net';
    console.log('Connecting to:', mongoUrl);
    await mongoose.connect(mongoUrl);
    
    // Find ALL tests to see if there are duplicates
    const mocks = await MockTest.find({ title: /SAMPLE TEST-2/i }).select('title totalMarks marksPerQuestion negativeMarking totalQuestions').lean();
    const grands = await GrandTest.find({ title: /SAMPLE TEST-2/i }).select('title totalMarks marksPerQuestion negativeMarking totalQuestions').lean();
    
    console.log('MOCKS FOUND:', mocks.length);
    mocks.forEach(m => console.log(`- MOCK: ${m.title} [${m._id}] Marks:${m.marksPerQuestion} Neg:${m.negativeMarking} Total:${m.totalMarks} Qs:${m.totalQuestions}`));
    
    console.log('GRANDS FOUND:', grands.length);
    grands.forEach(g => console.log(`- GRAND: ${g.title} [${g._id}] Marks:${g.marksPerQuestion} Neg:${g.negativeMarking} Total:${g.totalMarks} Qs:${g.totalQuestions}`));

    process.exit(0);
  } catch (err) {
    console.error('AUDIT ERROR:', err);
    process.exit(1);
  }
}

audit();
