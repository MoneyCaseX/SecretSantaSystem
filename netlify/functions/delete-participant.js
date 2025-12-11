import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.SECRET_SANTA_DB_URL);

exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { id } = JSON.parse(event.body);

        if (!id) {
            return { statusCode: 400, body: "Missing ID" };
        }

        await sql`DELETE FROM participants WHERE id = ${id}`;

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Participant deleted" }),
        };
    } catch (error) {
        console.error("Delete Error", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
