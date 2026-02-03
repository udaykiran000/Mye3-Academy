import fs from "fs";
import csv from "csv-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "../models/Question.js";
import connectDB from "../config/connectDB.js";

dotenv.config();

await connectDB();

const importQuestions = async () => {
  try {
    const dir = "uploads/mocktests";
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".csv"));

    if (files.length === 0) {
      console.log("❌ No CSV files found in uploads/mocktests");
      process.exit(0);
    }

    // pick the most recent CSV
    const filePath = `${dir}/${files[files.length - 1]}`;
    console.log("📄 Importing questions from:", filePath);

    const questions = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        if (!data.title || !data.options) return;

        questions.push({
          title: data.title.trim(),
          options: data.options.split(";").map((opt) => opt.trim()),
          correct: [Number(data.correct)],
          marks: Number(data.marks),
          negative: Number(data.negative),
          difficulty: data.difficulty || "easy",
          category: data.category || "General",
        });
      })
      .on("end", async () => {
        if (questions.length === 0) {
          console.log("⚠️  No valid questions found in the CSV file.");
          process.exit(0);
        }

        await Question.insertMany(questions);
        console.log(`✅ Successfully imported ${questions.length} questions!`);

        mongoose.connection.close();
      });
  } catch (error) {
    console.error("❌ Error importing questions:", error);
    mongoose.connection.close();
  }
};

importQuestions();
