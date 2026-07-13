import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import authRouter from './routes/authRoutes';
import imageRouter from './routes/imageRoutes';
import paymentRouter from './routes/paymentRoutes';

const app: Application = express();

/* ---- Security & performance middleware ---- */
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(compression());

/* ---- Body parsing ---- */
// `verify` stashes the raw bytes so the payment webhook can validate the
// Razorpay signature against the exact payload (parsing would alter it).
app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      (req as Request).rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

/* ---- Health check (used by Docker HEALTHCHECK & load balancers) ---- */
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'eloura-server',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* ---- Feature routers ---- */
app.use('/api/auth', authRouter);
app.use('/api/images', imageRouter);
app.use('/api/payments', paymentRouter);

/* ---- 404 fallback ---- */
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

export default app;
