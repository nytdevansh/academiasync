import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import { seedData } from '../seed/seed';

dotenv.config();

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/academiasync';
    const targetDb = process.env.DB_NAME || 'academiasync';
    const conn = await mongoose.connect(uri, { dbName: targetDb });
    console.log(`✅ MongoDB Connected: ${conn.connection.host} [DB: ${conn.connection.name}]`);

    if (conn.connection.name !== targetDb) {
      console.warn(`⚠️  WARNING: Connected to database "${conn.connection.name}" instead of expected "${targetDb}".`);
    }

    // Auto-seed if database is brand new and has no users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Database has no records. Auto-seeding initial departments, subjects & demo accounts...');
      await seedData();
      console.log('✅ Initial database seed completed.');
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${(error as Error).message}`);
    // Re-throw so the server doesn't start with a broken DB connection.
    // Render/Node will restart the process, which surfaces config problems early.
    throw error;
  }
};
