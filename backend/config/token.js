import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const genToken = (userId) => {
  return jwt.sign(
    { id: userId.toString() },  // ⬅ IMPORTANT FIX (not userId)
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export default genToken;
