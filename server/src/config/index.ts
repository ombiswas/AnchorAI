import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  clientUrl: string;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptSaltRounds: number;
  llmProvider: 'openai' | 'groq';
  openaiApiKey: string;
  groqApiKey: string;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/anchor_ai',
  jwtSecret: process.env.JWT_SECRET || 'dev_anchorai_jwt_secret_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptSaltRounds: 12, // Strict cost factor 12 as required
  llmProvider: process.env.LLM_PROVIDER?.toLowerCase() === 'groq' ? 'groq' : 'openai',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
};
