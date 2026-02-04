import { z } from 'zod';

export const createBookingSchema = z.object({
  seats: z.number().int().min(1, 'Seats must be at least 1')
});
