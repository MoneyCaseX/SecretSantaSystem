import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.SECRET_SANTA_DB_URL);

exports.handler = async (event, context) => {
    try {
        console.log("Updating DB Schema...");

        // 1. Ensure main participants table exists (already done)
        await sql`
      CREATE TABLE IF NOT EXISTS participants (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          department TEXT DEFAULT 'General',
          email TEXT,
          is_chosen BOOLEAN DEFAULT FALSE,
          my_santa_of_id INTEGER,
          my_santa_of_name TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

        // 2. Create Pending Requests Table
        await sql`
      CREATE TABLE IF NOT EXISTS pending_registrations (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          department TEXT DEFAULT 'General',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

        // Index for speed
        await sql`CREATE INDEX IF NOT EXISTS idx_pending_created ON pending_registrations(created_at)`;

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "DB Schema Updated (Pending Table Added)" }),
        };
    } catch (error) {
        console.error("Init Error", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
