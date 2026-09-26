import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Scaffolding healthcheck route (no business logic)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'AnchorAI Server' });
});

app.listen(port, () => {
  console.log(`[server] AnchorAI server running on port ${port}`);
});

export default app;
