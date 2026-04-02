import { Pool } from 'pg';

// Direct connection to Zo analytics DB — no LLM dependency
// Connection params from env vars — NEVER hardcode credentials
const pool = new Pool({
  host: process.env.ANALYTICS_DB_HOST,
  database: process.env.ANALYTICS_DB_NAME || 'zo',
  user: process.env.ANALYTICS_DB_USER,
  password: process.env.ANALYTICS_DB_PASSWORD,
  port: Number(process.env.ANALYTICS_DB_PORT) || 5432,
  max: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

/**
 * Execute a read-only SQL query against the analytics DB.
 * Returns rows as plain objects.
 */
export async function queryAnalytics(sql: string): Promise<any[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql);
    return result.rows;
  } finally {
    client.release();
  }
}
