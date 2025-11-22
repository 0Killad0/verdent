import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  buffer: {
    type: Buffer,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual for image URL
imageSchema.virtual('url').get(function() {
  return `/api/images/${this._id}`;
});

// Ensure virtual fields are serialized
imageSchema.set('toJSON', {
  virtuals: true
});

export default mongoose.model('Image', imageSchema);