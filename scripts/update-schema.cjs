
const { neon } = require('@neondatabase/serverless');
const connectionString = "postgresql://neondb_owner:npg_mqdSDf4buW0c@ep-frosty-frost-aewcq98o-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(connectionString);

async function updateSchema() {
    try {
        console.log("Creating 'pending_registrations' table...");
        await sql`
      CREATE TABLE IF NOT EXISTS pending_registrations (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          department TEXT DEFAULT 'General',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
        console.log("✅ Done.");
    } catch (error) {
        console.error("Error", error);
    }
}
updateSchema();
