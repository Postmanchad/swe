import pg from 'pg';

// Return DATE columns as plain 'YYYY-MM-DD' strings instead of JS Dates,
// which would otherwise shift by the server's time zone when serialised.
pg.types.setTypeParser(1082, (value) => value);

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const query = (text, params) => pool.query(text, params);
