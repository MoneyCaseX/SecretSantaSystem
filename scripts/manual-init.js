
import { neon } from '@neondatabase/serverless';

const connectionString = "postgresql://neondb_owner:npg_mqdSDf4buW0c@ep-frosty-frost-aewcq98o-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(connectionString);

async function init() {
    try {
        console.log("🔌 Connecting to Neon DB...");

        // 1. Create Table
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
        console.log("✅ Table 'participants' is ready.");

        // 2. Create Index
        await sql`CREATE INDEX IF NOT EXISTS idx_phone ON participants(phone)`;
        console.log("✅ Indexes verified.");

        process.exit(0);

    } catch (error) {
        console.error("❌ Error initializing DB:", error);
        process.exit(1);
    }
}

init();
