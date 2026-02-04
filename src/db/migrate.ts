import fs from 'fs';
import path from 'path';
import pool from './connection';

const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');

async function migrate() {
  try {
    await pool.query('DROP TABLE IF EXISTS bookings CASCADE');
    await pool.query('DROP TABLE IF EXISTS experiences CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
