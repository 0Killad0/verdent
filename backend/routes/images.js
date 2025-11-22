import express from 'express';
import Image from '../models/Image.js';
import { auth, admin } from '../middleware/auth.js';

const router = express.Router();

// Get image by ID
router.get('/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Set appropriate content type
    res.set('Content-Type', image.mimetype);
    
    // Send the image buffer
    res.send(image.buffer);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ message: 'Error fetching image' });
  }
});

// Delete image (Admin only)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    await Image.findByIdAndDelete(req.params.id);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Error deleting image' });
  }
});

export default router;