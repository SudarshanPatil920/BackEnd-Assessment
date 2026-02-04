import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import experienceRoutes from './routes/experiences';
import bookingRoutes from './routes/bookings';
import healthRoutes from './routes/health';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(requestLogger);

app.use('/auth', authRoutes);
app.use('/experiences', experienceRoutes);
app.use('/experiences', bookingRoutes);
app.use('/', healthRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
