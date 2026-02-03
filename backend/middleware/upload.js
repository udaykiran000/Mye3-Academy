import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// --- CONFIGURATION FOR PATHS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define Absolute Paths for Folder Creation (Ensures folders exist regardless of where you run the server)
// We go up one level: from /middleware to /backend, then into /uploads
const UPLOADS_ROOT = path.join(__dirname, "../uploads");
const IMAGES_DIR = path.join(UPLOADS_ROOT, "images");

/* ----------------------------------------
   FILE STORAGE FOR CSV / XLSX / JSON
----------------------------------------- */
const fileStorage = multer.diskStorage({
  destination(req, file, cb) {
    // 1. Ensure directory exists using Absolute Path
    if (!fs.existsSync(UPLOADS_ROOT)) {
      fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
    }
    // 2. Save using Relative Path ("uploads/")
    // This ensures req.file.path is "uploads/filename.csv", which works with your static URL.
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    // Sanitize filename (remove spaces)
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${name}${ext}`);
  }
});

const docFileFilter = (req, file, cb) => {
  const allowed = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only CSV or Excel files allowed!"), false);
};

export const uploadFile = multer({
  storage: fileStorage,
  fileFilter: docFileFilter
});

/* ----------------------------------------
   IMAGE STORAGE (for MCQ + question images)
----------------------------------------- */
const imageStorage = multer.diskStorage({
  destination(req, file, cb) {
    // 1. Ensure directory exists using Absolute Path
    if (!fs.existsSync(IMAGES_DIR)) {
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }
    // 2. Save using Relative Path ("uploads/images/")
    // This ensures req.file.path is "uploads/images/img-123.png"
    cb(null, "uploads/images/");
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `img-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only images allowed!"), false);
};

/* ----------------------------------------
   EXPORTS
----------------------------------------- */

// For Questions (Multiple named fields)
export const uploadQuestionImages = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter
}).fields([
  { name: "questionImage", maxCount: 1 },
  { name: "optionImage0", maxCount: 1 },
  { name: "optionImage1", maxCount: 1 },
  { name: "optionImage2", maxCount: 1 },
  { name: "optionImage3", maxCount: 1 },
  { name: "optionImage4", maxCount: 1 },
]);

// For Single Image (Profile photo, etc.)
export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter
});

// For Any Image (Generic)
export const uploadAny = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter
}).any();