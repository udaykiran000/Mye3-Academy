import mongoose from "mongoose";
import dotenv from "dotenv";
import MockTest from "./models/MockTest.js";
import Question from "./models/Question.js";

dotenv.config();

const MOCK_TEST_ID = "69845249b080ee26246c28f4";

const debugQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to DB");

    const test = await MockTest.findById(MOCK_TEST_ID);
    if (!test) {
      console.log("MockTest not found");
      return;
    }

    console.log(`MockTest: ${test.title}`);
    console.log(`Total Questions (Metadata): ${test.totalQuestions}`);
    console.log(`Question IDs count: ${test.questionIds.length}`);
    console.log("Question IDs:", test.questionIds);

    const questions = await Question.find({ _id: { $in: test.questionIds } });
    console.log(`Found ${questions.length} questions in Question collection.`);

    if (questions.length !== test.questionIds.length) {
        console.warn("WARNING: Mismatch between MockTest questionIds and actual Questions found!");
        const foundIds = questions.map(q => q._id.toString());
        const missing = test.questionIds.filter(id => !foundIds.includes(id.toString()));
        console.log("Missing Question IDs:", missing);
    } else {
        console.log("All questions verified in database.");
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.connection.close();
  }
};

debugQuestions();
