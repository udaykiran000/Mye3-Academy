// backend/middleware/isAuth.js
// (This is your modified file)

import jwt from 'jsonwebtoken';
import User from '../models/Usermodel.js';

export const isAuth = async (req, res, next) => {
  try {
    // 1. Get token from cookies
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated. No token provided.' });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check for 'id' (from my previous code) OR '_id' (which is common from login controllers)
    const userId = decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload. No "id" or "_id" found.' });
    }

    // 3. Find user -- ⭐ 1. MODIFICATION HERE ⭐
    // We must select the 'role' field so the isAdmin middleware can check it.
    const user = await User.findById(userId).select('_id role'); // <-- Fetch 'role'

    if (!user) {
      // This is the error you are seeing
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }

    // 4. Attach the user object to the request
    //    (it will contain _id and role)
    //    -- ⭐ 2. MODIFICATION HERE ⭐
    req.user = user; // <-- Attach the user object, not just the ID

    next();
  } catch (error) {
    console.error('AUTH_MIDDLEWARE_ERROR:', error.message);
    if (error.message === 'invalid signature') {
      console.error('Possible causes: JWT_SECRET mismatch (server restarted?), token tampering, or multiple secrets.');
    }

    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Not authenticated. Token is invalid or malformed.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Not authenticated. Token has expired.' });
    }

    // Handle other errors
    return res.status(500).json({ message: 'Authentication middleware error.', error: error.message });
  }
};

// --- ⭐ 3. ADD THIS NEW FUNCTION ⭐ ---
// This is the isAdmin middleware you were missing.
export const isAdmin = (req, res, next) => {
  // This middleware runs *after* isAuth, so req.user should be populated.
  if (req.user && req.user.role === 'admin') {
    // User is authenticated and is an admin, proceed.
    next();
  } else {
    // User is not an admin or req.user is not set
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Admin access required.'
    });
  }
};