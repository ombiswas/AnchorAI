import mongoose from 'mongoose';
import { config } from './index';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`[db] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[db] MongoDB connection error: ${(error as Error).message}`);
    // In local development without MongoDB running, log a warning rather than crashing ungracefully
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
  }
};
