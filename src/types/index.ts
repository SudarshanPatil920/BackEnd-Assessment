export type UserRole = 'admin' | 'host' | 'user';
export type ExperienceStatus = 'draft' | 'published' | 'blocked';
export type BookingStatus = 'confirmed' | 'cancelled';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

export interface Experience {
  id: number;
  title: string;
  description: string | null;
  location: string;
  price: number;
  start_time: Date;
  created_by: number;
  status: ExperienceStatus;
  created_at: Date;
}

export interface Booking {
  id: number;
  experience_id: number;
  user_id: number;
  seats: number;
  status: BookingStatus;
  created_at: Date;
}

export interface JWTPayload {
  userId: number;
  role: UserRole;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details: unknown[];
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ExperienceFilters extends PaginationParams {
  location?: string;
  from?: string;
  to?: string;
  sort?: 'asc' | 'desc';
}
