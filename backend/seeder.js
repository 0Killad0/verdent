import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Image from './models/Image.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marketsphere');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    await Image.deleteMany();
    console.log('Data destroyed successfully');
    process.exit();
  } catch (error) {
    console.error('Error destroying data:', error);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();
    // No sample data imported
    console.log('Seeder ready: No sample data inserted');
    process.exit();
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

// Command line: -d to destroy, else import (does nothing now)
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
