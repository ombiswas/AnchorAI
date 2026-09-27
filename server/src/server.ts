import cors from 'cors';
import express, { Request, Response } from 'express';
import path from 'path';
import { connectDB } from './config/db';
import { config } from './config/index';
import { errorHandler } from './middleware/error.middleware';
import analyticsRoutes from './routes/analytics.routes';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import documentRoutes from './routes/document.routes';
import quizRoutes from './routes/quiz.routes';

const app = express();

// Initialize Database
connectDB();

// Middleware
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(express.json());

// Serve local uploads folder statically for dev fallback
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'AnchorAI Server' });
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/analytics', analyticsRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[server] AnchorAI server running on port ${config.port} (${config.nodeEnv})`);
});

export default app;
