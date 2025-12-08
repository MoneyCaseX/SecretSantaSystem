import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.SECRET_SANTA_DB_URL);

exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { players } = JSON.parse(event.body);
        if (!players || !Array.isArray(players) || players.length === 0) {
            return { statusCode: 400, body: "No players provided" };
        }

        // Neon (and Postgres) supports bulk insert.
        // We construct the values list dynamically.
        // Note: neon serverless driver usually prefers tagged template literals.
        // For bulk insert with variable length, we might need a loop or json_to_recordset if supported easily,
        // or simply loop promises for simplicity in this context (datasets are small, <200 usually).

        // Optimization: Run in parallel
        const promises = players.map(p => {
            return sql`
            INSERT INTO participants (name, phone, department, email)
            VALUES (${p.name.trim()}, ${p.phone.trim()}, ${p.department || 'General'}, ${p.email || ''})
        `;
        });

        await Promise.all(promises);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Added ${players.length} players` }),
        };
    } catch (error) {
        console.error("Add Error", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
