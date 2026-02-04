import { z } from 'zod';

export const createExperienceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional().nullable(),
  location: z.string().min(1, 'Location is required'),
  price: z.number().int().nonnegative('Price must be a non-negative integer'),
  start_time: z.string().datetime('Invalid datetime format')
});

export const publishExperienceSchema = z.object({});

export const blockExperienceSchema = z.object({});
