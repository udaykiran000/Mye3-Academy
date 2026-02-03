
// backend/controllers/questionController.js
import Question from "../models/Question.js";

export const getPassagesByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { questionType: "passage" };
    if (category) query.category = category;
    const passages = await Question.find(query).select("title questionImageUrl category createdAt");
    res.json({ success: true, passages });
  } catch (err) {
    console.error("Error in getPassagesByCategory:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

