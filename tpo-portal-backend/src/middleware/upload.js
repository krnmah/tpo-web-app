const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = 'uploads';
const FILE_TYPES = ['tenthMarksheet', 'twelfthMarksheet', 'resume', 'profilePicture'];

// create directories if not exist
FILE_TYPES.forEach((dir) => {
  const fullPath = path.join(UPLOAD_DIR, dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = FILE_TYPES.includes(file.fieldname) ? file.fieldname : 'others';
    cb(null, path.join(UPLOAD_DIR, dir));
  },
  filename: (req, file, cb) => {
    const enrollment = req.body.enrollmentNumber || Date.now().toString();
    const ext = path.extname(file.originalname);
    cb(null, `${enrollment}${ext}`);
  },
});

const upload = multer({ storage });
module.exports = { upload };
