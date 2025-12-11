import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.SECRET_SANTA_DB_URL);

exports.handler = async (event, context) => {
    try {
        const settings = await sql`SELECT * FROM game_settings`;

        // Convert array to object
        const config = settings.reduce((acc, curr) => {
            acc[curr.setting_key] = curr.setting_value;
            return acc;
        }, {});

        // Defaults
        const status = config.status || 'CLOSED'; // OPEN, CLOSED, SCHEDULED
        const startTime = config.start_time || '';

        return {
            statusCode: 200,
            body: JSON.stringify({ status, startTime }),
        };
    } catch (error) {
        console.error("Get Settings Error", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
