// models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Cup', 'Home & Kitchen', 'Books', 'Sports & Outdoors']
  },
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    required: true
  }],
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  ratings: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numOfReviews: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  features: [String],
  tags: [String],
  
  // New offer fields
  offer: {
    active: {
      type: Boolean,
      default: false
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    offerPrice: {
      type: Number,
      min: 0
    },
    offerName: String,
    validUntil: Date
  }
}, {
  timestamps: true
});

// Calculate offer price before saving
productSchema.pre('save', function(next) {
  if (this.offer.active && this.offer.discountPercentage > 0) {
    // Calculate offer price based on discount percentage
    const discountAmount = this.price * (this.offer.discountPercentage / 100);
    this.offer.offerPrice = this.price - discountAmount;
    
    // Set original price if not set
    if (!this.originalPrice) {
      this.originalPrice = this.price;
    }
  } else {
    // Reset offer price if offer is not active
    this.offer.offerPrice = undefined;
    // Also reset original price if it's the same as current price
    if (this.originalPrice === this.price) {
      this.originalPrice = undefined;
    }
  }
  next();
});

// Virtual for checking if offer is valid
productSchema.virtual('isOfferValid').get(function() {
  if (!this.offer.active) return false;
  if (this.offer.validUntil && new Date() > this.offer.validUntil) return false;
  return true;
});

// Virtual for current price (offer price if valid, else regular price)
productSchema.virtual('currentPrice').get(function() {
  return this.isOfferValid && this.offer.offerPrice ? this.offer.offerPrice : this.price;
});

// Virtual for discount percentage to display
productSchema.virtual('displayDiscount').get(function() {
  if (!this.isOfferValid || !this.originalPrice) return 0;
  return Math.round((1 - (this.currentPrice / this.originalPrice)) * 100);
});

// Virtual for savings amount
productSchema.virtual('savingsAmount').get(function() {
  if (!this.isOfferValid || !this.originalPrice) return 0;
  return this.originalPrice - this.currentPrice;
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', {
  virtuals: true
});

export default mongoose.model('Product', productSchema);