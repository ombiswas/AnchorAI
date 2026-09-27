import dotenv from 'dotenv';

dotenv.config();

// ── Fail-fast: crash at startup if any critical env var is missing ─────────────
const _jwtSecret = process.env.JWT_SECRET;
if (!_jwtSecret) {
  throw new Error('[config] FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
}

const _mongoUri = process.env.MONGODB_URI;
if (!_mongoUri) {
  throw new Error(
    '[config] FATAL: MONGODB_URI environment variable is not set. Refusing to start.'
  );
}

const _llmProvider = process.env.LLM_PROVIDER?.toLowerCase() === 'groq' ? 'groq' : 'openai';
const _openaiKey = process.env.OPENAI_API_KEY || '';
const _groqKey = process.env.GROQ_API_KEY || '';

if (_llmProvider === 'groq' && !_groqKey) {
  throw new Error(
    '[config] FATAL: LLM_PROVIDER is set to "groq" but GROQ_API_KEY is not set. Refusing to start.'
  );
}
if (_llmProvider === 'openai' && !_openaiKey) {
  throw new Error(
    '[config] FATAL: OPENAI_API_KEY is not set. Refusing to start. ' +
      'Set LLM_PROVIDER=groq and GROQ_API_KEY to use Groq instead.'
  );
}
// ──────────────────────────────────────────────────────────────────────────────

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
  groqModel: string;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: _mongoUri,
  jwtSecret: _jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptSaltRounds: 12, // Strict cost factor 12 as required
  llmProvider: _llmProvider,
  openaiApiKey: _openaiKey,
  groqApiKey: _groqKey,
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
};
