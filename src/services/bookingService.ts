import { query } from '../db/connection';
import { AppError } from '../middlewares/errorHandler';
import { Booking } from '../types';
import { getExperienceById } from './experienceService';

export const createBooking = async (
  experienceId: number,
  userId: number,
  seats: number
): Promise<Booking> => {
  const experience = await getExperienceById(experienceId);
  
  if (!experience) {
    throw new AppError(404, 'NOT_FOUND', 'Experience not found');
  }
  
  if (experience.status !== 'published') {
    throw new AppError(400, 'INVALID_STATUS', 'Cannot book unpublished experiences');
  }
  
  if (experience.created_by === userId) {
    throw new AppError(403, 'FORBIDDEN', 'Hosts cannot book their own experiences');
  }
  
  const existingBooking = await query(
    `SELECT id FROM bookings 
     WHERE experience_id = $1 AND user_id = $2 AND status = 'confirmed'`,
    [experienceId, userId]
  );
  
  if (existingBooking.rows.length > 0) {
    throw new AppError(400, 'DUPLICATE_BOOKING', 'You already have a confirmed booking for this experience');
  }
  
  const result = await query(
    `INSERT INTO bookings (experience_id, user_id, seats, status)
     VALUES ($1, $2, $3, 'confirmed')
     RETURNING *`,
    [experienceId, userId, seats]
  );
  
  return result.rows[0];
};
