import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.SECRET_SANTA_DB_URL);

exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { status, startTime } = JSON.parse(event.body);

    if (!['OPEN', 'CLOSED', 'SCHEDULED'].includes(status)) {
        return { statusCode: 400, body: "Invalid status" };
    }

    try {
        await sql`
            UPDATE game_settings 
            SET setting_value = ${status} 
            WHERE setting_key = 'status'
        `;

        if (startTime !== undefined) {
            await sql`
                UPDATE game_settings 
                SET setting_value = ${startTime} 
                WHERE setting_key = 'start_time'
            `;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Settings Updated" }),
        };
    } catch (error) {
        console.error("Update Settings Error", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
