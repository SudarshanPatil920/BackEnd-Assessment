import { query } from '../db/connection';
import { AppError } from '../middlewares/errorHandler';
import { Experience, ExperienceFilters } from '../types';

export const createExperience = async (
  title: string,
  description: string | null,
  location: string,
  price: number,
  startTime: string,
  createdBy: number
): Promise<Experience> => {
  const result = await query(
    `INSERT INTO experiences (title, description, location, price, start_time, created_by, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'draft')
     RETURNING *`,
    [title, description, location, price, startTime, createdBy]
  );
  
  return result.rows[0];
};

export const getExperienceById = async (id: number): Promise<Experience | null> => {
  const result = await query('SELECT * FROM experiences WHERE id = $1', [id]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const publishExperience = async (id: number): Promise<Experience> => {
  const result = await query(
    'UPDATE experiences SET status = $1 WHERE id = $2 RETURNING *',
    ['published', id]
  );
  
  if (result.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Experience not found');
  }
  
  return result.rows[0];
};

export const blockExperience = async (id: number): Promise<Experience> => {
  const result = await query(
    'UPDATE experiences SET status = $1 WHERE id = $2 RETURNING *',
    ['blocked', id]
  );
  
  if (result.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Experience not found');
  }
  
  return result.rows[0];
};

export const listPublishedExperiences = async (filters: ExperienceFilters): Promise<{ experiences: Experience[]; total: number; page: number; limit: number }> => {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;
  const sort = filters.sort || 'asc';
  
  let whereConditions = ["status = 'published'"];
  const queryParams: unknown[] = [];
  let paramIndex = 1;
  
  if (filters.location) {
    whereConditions.push(`location ILIKE $${paramIndex}`);
    queryParams.push(`%${filters.location}%`);
    paramIndex++;
  }
  
  if (filters.from) {
    whereConditions.push(`start_time >= $${paramIndex}`);
    queryParams.push(filters.from);
    paramIndex++;
  }
  
  if (filters.to) {
    whereConditions.push(`start_time <= $${paramIndex}`);
    queryParams.push(filters.to);
    paramIndex++;
  }
  
  const whereClause = whereConditions.join(' AND ');
  const orderBy = `ORDER BY start_time ${sort.toUpperCase()}`;
  
  const countResult = await query(
    `SELECT COUNT(*) as total FROM experiences WHERE ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].total);
  
  queryParams.push(limit, offset);
  const dataResult = await query(
    `SELECT * FROM experiences WHERE ${whereClause} ${orderBy} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    queryParams
  );
  
  return {
    experiences: dataResult.rows,
    total,
    page,
    limit
  };
};
