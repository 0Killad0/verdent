import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userAgent: String,
  ip: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // 7 days
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isValid: {
    type: Boolean,
    default: true
  }
});

const securityEventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  userId: mongoose.Schema.Types.ObjectId,
  ip: String,
  userAgent: String,
  reason: String,
  attemptedEndpoint: String,
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: { 
      type: String, 
      required: function() {
        return !this.googleId; // Password not required for Google OAuth users
      },
      minlength: 8
    },
    role: { 
      type: String, 
      enum: ['user', 'admin', 'moderator'],
      default: 'user' 
    },
    
    // Authentication fields
    googleId: { type: String, sparse: true },
    refreshToken: { type: String },
    
    // Security fields
    isVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lastFailedAttempt: { type: Date },
    accountLockedUntil: { type: Date },
    
    // OTP for email verification and password reset
    otp: { type: String },
    otpExpires: { type: Date },
    
    // Session management
    sessions: [sessionSchema],
    
    // Timestamps
    lastLogin: { type: Date },
    loginCount: { type: Number, default: 0 },
    signupIp: { type: String },
    
    // User profile
    addresses: [{
      name: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      isDefault: Boolean
    }],
    avatar: String,
    phone: String,
    
    // Preferences
    emailNotifications: { type: Boolean, default: true },
    twoFactorEnabled: { type: Boolean, default: false },
    
  },
  { 
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.otp;
        delete ret.sessions;
        return ret;
      }
    }
  }
);

// Indexes for performance and security
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ 'sessions.sessionId': 1 });
userSchema.index({ accountLockedUntil: 1 }, { expireAfterSeconds: 0 });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Additional password validation
    if (this.password && this.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods.correctPassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incrementFailedAttempts = async function() {
  this.failedLoginAttempts += 1;
  this.lastFailedAttempt = new Date();
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.failedLoginAttempts >= 5) {
    this.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
  }
  
  await this.save();
};

userSchema.methods.resetFailedAttempts = async function() {
  this.failedLoginAttempts = 0;
  this.lastFailedAttempt = undefined;
  this.accountLockedUntil = undefined;
  await this.save();
};

userSchema.methods.isAccountLocked = function() {
  return this.accountLockedUntil && this.accountLockedUntil > new Date();
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Virtual for account status
userSchema.virtual('accountStatus').get(function() {
  if (this.isSuspended) return 'suspended';
  if (this.isAccountLocked()) return 'locked';
  if (!this.isVerified) return 'unverified';
  return 'active';
});

export default mongoose.model('User', userSchema);

// Security Event Model
export const SecurityEvent = mongoose.model('SecurityEvent', securityEventSchema);