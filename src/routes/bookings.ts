import { Router } from 'express';
import { createBooking } from '../services/bookingService';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../validators';
import { createBookingSchema } from '../validators/booking';

const router = Router();

router.post(
  '/:id/book',
  requireAuth,
  requireRole('user', 'admin'),
  validateBody(createBookingSchema),
  async (req, res, next) => {
    try {
      const experienceId = parseInt(req.params.id);
      const userId = req.user!.userId;
      const { seats } = req.body;
      const booking = await createBooking(experienceId, userId, seats);
      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
