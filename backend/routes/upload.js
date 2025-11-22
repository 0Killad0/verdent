import express from 'express';
import multer from 'multer';
import Image from '../models/Image.js';
import { auth, admin } from '../middleware/auth.js';

const router = express.Router();

// Configure multer to store files in memory
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Upload route - store images in MongoDB
router.post('/', auth, admin, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const savedImages = [];

    // Save each image to MongoDB
    for (const file of req.files) {
      const image = new Image({
        filename: `image-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
        createdBy: req.user._id
      });

      const savedImage = await image.save();
      savedImages.push({
        _id: savedImage._id,
        url: savedImage.url,
        filename: savedImage.filename,
        originalName: savedImage.originalName,
        mimetype: savedImage.mimetype,
        size: savedImage.size
      });
    }

    res.json({
      message: 'Files uploaded successfully',
      files: savedImages
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading files' });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum is 5.' });
    }
  }
  res.status(400).json({ message: error.message });
});

export default router;