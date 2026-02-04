import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db/connection';
import { AppError } from '../middlewares/errorHandler';
import { User, UserRole, JWTPayload } from '../types';

const SALT_ROUNDS = 10;

export const signup = async (email: string, password: string, role: UserRole): Promise<User> => {
  const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
  
  if (existingUser.rows.length > 0) {
    throw new AppError(400, 'EMAIL_EXISTS', 'Email already registered');
  }
  
  if (role === 'admin') {
    throw new AppError(400, 'INVALID_ROLE', 'Admin role cannot be self-assigned');
  }
  
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  
  const result = await query(
    'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
    [email, passwordHash, role]
  );
  
  return result.rows[0];
};

export const login = async (email: string, password: string): Promise<{ token: string; user: { id: number; role: UserRole } }> => {
  const result = await query('SELECT id, email, password_hash, role FROM users WHERE email = $1', [email]);
  
  if (result.rows.length === 0) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  
  const user = result.rows[0] as User;
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  
  if (!isValidPassword) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  
  const payload: JWTPayload = {
    userId: user.id,
    role: user.role as UserRole
  };
  
  const token = jwt.sign(payload, secret, { expiresIn: '7d' });
  
  return {
    token,
    user: {
      id: user.id,
      role: user.role as UserRole
    }
  };
};
