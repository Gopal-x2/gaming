const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');

// Ensure uploads directory exists (use /tmp on Vercel)
const isVercel = process.env.VERCEL;
const uploadDir = isVercel 
  ? path.join(os.tmpdir(), 'avatars') 
  : path.join(__dirname, '../../uploads/avatars');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user ? req.user.id : 'user'}-${Date.now()}${ext}`);
  },
});

// File Filter (Image formats only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, GIF, WEBP) are allowed!'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
  fileFilter,
});

module.exports = upload;
