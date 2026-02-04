# Experiences Marketplace Backend

**Backend Developer Assessment** — Node.js + Express + TypeScript + PostgreSQL API with authentication, RBAC, experiences, and bookings.

A production-ready backend for an "Experiences" marketplace: Users, Hosts, and Admins. Hosts/Admins create experiences; Admins moderate; Users book. Includes JWT auth, role-based access control, request validation (Zod), and observability (logging + health check).

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Validation**: Zod

## Project Structure

```
src/
├── db/
│   ├── connection.ts     
│   ├── migrate.ts        
│   └── schema.sql         # Database schema
├── middlewares/
│   ├── auth.ts            # Authentication & RBAC middleware
│   ├── errorHandler.ts    # Error handling middleware
│   └── logger.ts          # Request logging middleware
├── routes/
│   ├── auth.ts            # Authentication routes
│   ├── experiences.ts     # Experience management routes
│   ├── bookings.ts        # Booking routes
│   └── health.ts          # Health check endpoint
├── services/
│   ├── authService.ts     # Authentication business logic
│   ├── experienceService.ts # Experience business logic
│   └── bookingService.ts  # Booking business logic
├── types/
│   └── index.ts           # TypeScript type definitions
├── validators/
│   ├── auth.ts            # Auth validation schemas
│   ├── experience.ts      # Experience validation schemas
│   ├── booking.ts         # Booking validation schemas
│   ├── query.ts           # Query parameter validation
│   └── index.ts           # Validation middleware
└── index.ts               # Application entry point
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. Clone the repository and enter the project folder:
```bash
git clone <your-repo-url>
cd Backend-Assignment
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (required — `.env` is not in the repo):

```bash
cp .env.example .env
```

Edit `.env` and set **your own** values:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Local: `postgresql://user:password@localhost:5432/experiences_db` — or use a free cloud DB (e.g. [Neon](https://neon.tech), [Supabase](https://supabase.com)) and paste the URL they give you |
| `JWT_SECRET` | Secret for signing JWTs (any long random string) | e.g. `my-super-secret-key-at-least-32-chars` |
| `DATABASE_SSL` | Set to `true` if using a cloud PostgreSQL URL that requires SSL | `false` for local, `true` for Neon/Supabase |

4. Create a PostgreSQL database (if using local PostgreSQL):
```bash
createdb experiences_db
```
If using a cloud provider, they create the DB for you; use the URL they provide as `DATABASE_URL`.

5. Run database migrations:
```bash
npm run build
node dist/db/migrate.js
```

Or using ts-node:
```bash
npx ts-node src/db/migrate.ts
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

### Running API Tests

With the server running (e.g. `npm run dev` in one terminal), in another terminal run:

```bash
npm test
```

This runs the automated API test suite (health, signup, login, create/publish experience, list, booking, RBAC, and error cases). All tests should pass if the server and database are running correctly.

---

## How to verify all APIs are working

1. **Get .env values:** The repo does not include a real `.env` file (for security). After cloning, run `cp .env.example .env` and fill in:
   - **DATABASE_URL** — Use your own PostgreSQL: install locally and run `createdb experiences_db`, or sign up for a free DB at [Neon](https://neon.tech) / [Supabase](https://supabase.com) and copy their connection URL.
   - **JWT_SECRET** — Any long random string (e.g. `my-secret-key-12345`).
   - **DATABASE_SSL** — `true` if your DB URL uses SSL (e.g. cloud); `false` for local.

2. **Setup:** `npm install` → `npm run build` → `npm run migrate` (or `node dist/db/migrate.js`).

3. **Run server:** `npm run dev` (or `npm start`). Server runs at `http://localhost:3000`.

4. **Test:** Either run `npm test` (with server running in another terminal) to run the full API test suite, or use the curl examples below to hit each endpoint manually. `GET /health` should return `200` with `"status": "healthy"` when the DB is connected.

---

## Database Schema

### Tables

1. **users**
   - `id` (PK, SERIAL)
   - `email` (UNIQUE, VARCHAR)
   - `password_hash` (VARCHAR)
   - `role` (ENUM: admin, host, user)
   - `created_at` (TIMESTAMP)

2. **experiences**
   - `id` (PK, SERIAL)
   - `title` (VARCHAR)
   - `description` (TEXT)
   - `location` (VARCHAR)
   - `price` (INTEGER, >= 0)
   - `start_time` (TIMESTAMP)
   - `created_by` (FK → users.id)
   - `status` (ENUM: draft, published, blocked)
   - `created_at` (TIMESTAMP)

3. **bookings**
   - `id` (PK, SERIAL)
   - `experience_id` (FK → experiences.id)
   - `user_id` (FK → users.id)
   - `seats` (INTEGER, >= 1)
   - `status` (ENUM: confirmed, cancelled)
   - `created_at` (TIMESTAMP)
   - Unique constraint on (experience_id, user_id, status) where status = 'confirmed'

### Database Indexes

1. **idx_experiences_location_start_time** on `experiences(location, start_time)`
   - Optimizes location and time-based filtering queries for published experiences

2. **idx_experiences_status** on `experiences(status)`
   - Speeds up filtering by status (especially for published experiences)

3. **idx_bookings_user_id** on `bookings(user_id)`
   - Optimizes queries to find all bookings for a specific user

4. **idx_bookings_experience_id** on `bookings(experience_id)`
   - Optimizes queries to find all bookings for a specific experience

5. **idx_users_email** on `users(email)`
   - Speeds up email lookups during authentication (already unique, but explicit index for performance)

## API Endpoints

### Authentication

#### Signup
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "host@example.com",
    "password": "password123",
    "role": "host"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "host@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "role": "host"
  }
}
```

### Experiences

#### Create Experience (Host/Admin only)
```bash
curl -X POST http://localhost:3000/experiences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Sunset Yoga Session",
    "description": "Relaxing yoga session at the beach",
    "location": "Miami Beach",
    "price": 50,
    "start_time": "2026-02-15T18:00:00Z"
  }'
```

#### Publish Experience (Owner or Admin)
```bash
curl -X PATCH http://localhost:3000/experiences/1/publish \
  -H "Authorization: Bearer <token>"
```

#### Block Experience (Admin only)
```bash
curl -X PATCH http://localhost:3000/experiences/1/block \
  -H "Authorization: Bearer <token>"
```
Admin users cannot self-signup; create an admin in the database if you need to test this endpoint (e.g. `INSERT INTO users (email, password_hash, role) VALUES ('admin@example.com', '<bcrypt-hash>', 'admin');`).

#### List Published Experiences (Public)
```bash
curl "http://localhost:3000/experiences?location=Miami&from=2026-02-01T00:00:00Z&to=2026-03-01T00:00:00Z&page=1&limit=10&sort=asc"
```

Query Parameters:
- `location` (optional): Filter by location (case-insensitive partial match)
- `from` (optional): Filter experiences starting from this datetime (ISO 8601)
- `to` (optional): Filter experiences starting until this datetime (ISO 8601)
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 10): Number of results per page
- `sort` (optional, default: asc): Sort by start_time (asc/desc)

### Bookings

#### Create Booking (User/Admin only)
```bash
curl -X POST http://localhost:3000/experiences/1/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "seats": 2
  }'
```

### Health Check

#### Check API Health
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-02-05T10:30:00.000Z"
}
```

## RBAC Rules Implemented

- **Signup**: Only `user` and `host` roles can be self-assigned. Admin role cannot be self-assigned.
- **Create Experience**: Only `host` and `admin` roles can create experiences. New experiences default to `draft` status.
- **Publish Experience**: Only the owner (host who created it) or `admin` can publish an experience.
- **Block Experience**: Only `admin` can block experiences for moderation.
- **List Experiences**: Public endpoint, returns only `published` experiences.
- **Create Booking**: Only `user` and `admin` roles can create bookings. Hosts cannot book their own experiences.
- **Booking Validation**: Prevents duplicate confirmed bookings by the same user for the same experience. Cannot book unpublished experiences.

## Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": []
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400): Invalid request body or query parameters
- `UNAUTHORIZED` (401): Missing or invalid authentication token
- `FORBIDDEN` (403): Insufficient permissions for the requested action
- `NOT_FOUND` (404): Resource not found
- `EMAIL_EXISTS` (400): Email already registered
- `INVALID_CREDENTIALS` (401): Invalid email or password
- `DUPLICATE_BOOKING` (400): User already has a confirmed booking for this experience
- `INVALID_STATUS` (400): Operation not allowed due to resource status
- `INTERNAL_ERROR` (500): Unexpected server error

## Security Features

- Password hashing using bcrypt (10 salt rounds)
- JWT-based authentication with configurable expiration
- Role-based access control enforced via middleware
- Input validation using Zod schemas
- SQL injection prevention via parameterized queries
- Database constraints for data integrity

## Verification (Part H — Option 2: Observability)

- **Request logging middleware**: Every request is logged with `method`, `path`, `status`, and `latency` (JSON format).
- **Health endpoint**: `GET /health` checks database connectivity and returns 200 when healthy, 503 when the database is disconnected.

To run automated API tests (after starting the server): `node scripts/test-api.mjs`

## Observability

- Request logging middleware logs all requests with method, path, status code, and latency
- Health check endpoint (`/health`) monitors database connectivity
- Structured logging in JSON format for easy parsing

## Production Considerations

- Environment variables for sensitive configuration
- Database connection pooling
- Error handling with consistent response format
- Input validation on all endpoints
- TypeScript for type safety
- Database indexes for query optimization
- Proper HTTP status codes
- CORS configuration (add if needed for frontend integration)
