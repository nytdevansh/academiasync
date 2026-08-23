import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import { seedData } from '../seed/seed';

dotenv.config();

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/academiasync';
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed if database is brand new and has no users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Database has no records. Auto-seeding initial departments, subjects & demo accounts...');
      await seedData();
      console.log('✅ Initial database seed completed.');
    }
  } catch (error) {
    console.error(`MongoDB Connection Warning: ${(error as Error).message}`);
    // Don't crash immediately in dev to allow fallback/mock operation
  }
};
