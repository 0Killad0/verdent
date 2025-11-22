// routes/offers.js
import express from 'express';
import Product from '../models/Product.js';
import { auth, admin } from '../middleware/auth.js';

const router = express.Router();

// Get all active offers
router.get('/active', async (req, res) => {
  try {
    const { limit = 20, category } = req.query;
    
    let query = {
      'offer.active': true,
      $or: [
        { 'offer.validUntil': { $gte: new Date() } },
        { 'offer.validUntil': null }
      ]
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    const products = await Product.find(query)
      .populate('images', 'filename originalName mimetype size url')
      .sort({ 'offer.discountPercentage': -1 })
      .limit(parseInt(limit));

    res.json(products);
  } catch (error) {
    console.error('Error fetching active offers:', error);
    res.status(500).json({ message: 'Server error while fetching offers' });
  }
});

// Get expired offers (admin only)
router.get('/expired', auth, admin, async (req, res) => {
  try {
    const products = await Product.find({
      'offer.active': true,
      'offer.validUntil': { $lt: new Date() }
    })
    .populate('images', 'filename originalName mimetype size url')
    .sort({ 'offer.validUntil': -1 });

    res.json(products);
  } catch (error) {
    console.error('Error fetching expired offers:', error);
    res.status(500).json({ message: 'Server error while fetching expired offers' });
  }
});

// Get offer statistics (admin only)
router.get('/stats', auth, admin, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeOffers = await Product.countDocuments({
      'offer.active': true,
      $or: [
        { 'offer.validUntil': { $gte: new Date() } },
        { 'offer.validUntil': null }
      ]
    });
    const expiredOffers = await Product.countDocuments({
      'offer.active': true,
      'offer.validUntil': { $lt: new Date() }
    });

    // Get average discount
    const avgDiscount = await Product.aggregate([
      {
        $match: {
          'offer.active': true,
          $or: [
            { 'offer.validUntil': { $gte: new Date() } },
            { 'offer.validUntil': null }
          ]
        }
      },
      {
        $group: {
          _id: null,
          avgDiscount: { $avg: '$offer.discountPercentage' }
        }
      }
    ]);

    res.json({
      totalProducts,
      activeOffers,
      expiredOffers,
      avgDiscount: avgDiscount.length > 0 ? Math.round(avgDiscount[0].avgDiscount) : 0
    });
  } catch (error) {
    console.error('Error fetching offer stats:', error);
    res.status(500).json({ message: 'Server error while fetching offer statistics' });
  }
});

export default router;