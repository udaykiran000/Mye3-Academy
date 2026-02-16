import jwt from "jsonwebtoken";
import User from "../models/Usermodel.js";

/**
 * Middleware to authenticate user via JWT token in cookies
 */
export const isAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Not authenticated. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload." });
    }

    const user = await User.findById(userId).select("_id role");

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("AUTH_MIDDLEWARE_ERROR:", error.message);
    return res
      .status(401)
      .json({ message: "Authentication failed.", error: error.message });
  }
};

/**
 * Middleware to restrict access to Admin only
 */
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Forbidden. Admin access required.",
    });
  }
};
