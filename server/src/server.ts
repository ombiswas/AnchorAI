import cors from 'cors';
import express, { Request, Response } from 'express';
import { connectDB } from './config/db';
import { config } from './config/index';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';

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

// Routes
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'AnchorAI Server' });
});

app.use('/api/auth', authRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[server] AnchorAI server running on port ${config.port} (${config.nodeEnv})`);
});

export default app;
