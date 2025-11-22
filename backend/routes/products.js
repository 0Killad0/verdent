import express from 'express';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Image from '../models/Image.js';
import { auth, admin } from '../middleware/auth.js';

const router = express.Router();

// Get all products with filtering, sorting, and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      ecosystem, 
      sort, 
      page = 1, 
      limit = 12, 
      search, 
      offer 
    } = req.query;
    
    // Initialize an array to hold all conditions to be combined with $and
    let andConditions = [];
    
    // --- 1. Build Query Filters ---

    // Category Filter (Using $regex for robust, case-insensitive matching)
    if (category && category !== 'all') {
      andConditions.push({ category: { $regex: new RegExp(`^${category}$`, 'i') } });
    }
    
    // Ecosystem Filter
    if (ecosystem && ecosystem !== 'all') {
      andConditions.push({ ecosystem: ecosystem });
    }
    
    // 🛑 START OF MULTI-WORD SEARCH UPDATE 🛑
    // Search Filter (by name, description, or tags)
    if (search) {
      // 1. Split the search string into individual words/tokens
      const keywords = search.trim().split(/\s+/).filter(word => word.length > 0);
      
      if (keywords.length > 0) {
          // 2. Create a condition for each keyword, requiring a match in name, description, or tags
          const keywordConditions = keywords.map(keyword => ({
              $or: [
                  // Use $regex with 'i' option for case-insensitive matching of the word
                  { name: { $regex: keyword, $options: 'i' } },
                  { description: { $regex: keyword, $options: 'i' } },
                  // Tags need special handling as they are an array
                  { tags: { $in: [new RegExp(keyword, 'i')] } }
              ]
          }));
          
          // 3. Use $and to ensure ALL individual keyword conditions are met
          andConditions.push({ $and: keywordConditions });
      }
    }
    // 🛑 END OF MULTI-WORD SEARCH UPDATE 🛑
    
    // Filter for active offers
    if (offer === 'active') {
      // Combine both parts of the offer filter into a single object
      andConditions.push({
          'offer.active': true,
          $or: [
              { 'offer.validUntil': { $gte: new Date() } },
              { 'offer.validUntil': null }
          ]
      });
    }

    // Construct the final query object. If there are conditions, wrap them in $and.
    const finalQuery = andConditions.length > 0 ? { $and: andConditions } : {};
    
    // --- 2. Sort options ---
    let sortOptions = {};
    switch (sort) {
      case 'price_low':
        sortOptions.price = 1;
        break;
      case 'price_high':
        sortOptions.price = -1;
        break;
      case 'rating':
        // Added numOfReviews as a tie-breaker for rating sort
        sortOptions.ratings = -1;
        sortOptions.numOfReviews = -1;
        break;
      case 'discount':
        sortOptions['offer.discountPercentage'] = -1;
        break;
      case 'popular':
        sortOptions.numOfReviews = -1;
        break;
      default:
        sortOptions.createdAt = -1; // newest first
    }

    // --- 3. Apply Pagination and Execute Query ---
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(finalQuery) // Use the finalQuery object
      .populate('images', 'filename originalName mimetype size url')
      .populate('createdBy', 'name')
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip);

    const total = await Product.countDocuments(finalQuery);

    res.json({
      products,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      totalCount: total,
      total
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});

// Get single product with populated images
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('images', 'filename originalName mimetype size url');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Create product (Admin only)
router.post('/', auth, admin, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      category, 
      stock, 
      images, 
      features, 
      tags, 
      ecosystem,
      offer,
      originalPrice 
    } = req.body;

    // Validation
    if (!name || !description || !price || !category || stock === undefined) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      images: images || [],
      features: features || [],
      tags: tags || [],
      ecosystem: ecosystem || null,
      offer: offer || { active: false },
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      createdBy: req.user._id
    });
    
    await product.save();
    
    // Populate images for response
    await product.populate('images', 'filename originalName mimetype size url');
    
    res.status(201).json(product);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Error creating product:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update product (Admin only)
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      category, 
      stock, 
      images, 
      features, 
      tags, 
      ecosystem,
      offer,
      originalPrice 
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (price !== undefined) updateData.price = parseFloat(price);
    if (category !== undefined) updateData.category = category;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (images !== undefined) updateData.images = images;
    if (features !== undefined) updateData.features = features;
    if (tags !== undefined) updateData.tags = tags;
    if (ecosystem !== undefined) updateData.ecosystem = ecosystem;
    if (offer !== undefined) updateData.offer = offer;
    if (originalPrice !== undefined) {
      updateData.originalPrice = originalPrice ? parseFloat(originalPrice) : null;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('images', 'filename originalName mimetype size url');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    console.error('Error updating product:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete product (Admin only) - Also delete associated images
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete associated images
    if (product.images && product.images.length > 0) {
      await Image.deleteMany({ _id: { $in: product.images } });
    }

    // Delete associated reviews
    await Review.deleteMany({ product: req.params.id });

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product removed successfully' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    console.error('Error deleting product:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add review
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const alreadyReviewed = await Review.findOne({
      product: req.params.id,
      user: req.user._id
    });

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Product already reviewed' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const review = new Review({
      user: req.user._id,
      product: req.params.id,
      rating: parseInt(rating),
      comment: comment || ''
    });

    await review.save();

    // Update product ratings
    const reviews = await Review.find({ product: req.params.id });
    product.numOfReviews = reviews.length;
    product.ratings = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    await product.save();

    await review.populate('user', 'name');

    res.status(201).json({
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Get product reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: error.message });
  }
});

export default router;