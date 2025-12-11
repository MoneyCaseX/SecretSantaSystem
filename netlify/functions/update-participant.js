import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.SECRET_SANTA_DB_URL);

exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { id, name, phone, department } = JSON.parse(event.body);

        if (!id || !name || !phone || !department) {
            return { statusCode: 400, body: "Missing required fields" };
        }

        await sql`
            UPDATE participants 
            SET name = ${name.trim()}, 
                phone = ${phone.trim()}, 
                department = ${department}
            WHERE id = ${id}
        `;

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Participant updated" }),
        };
    } catch (error) {
        console.error("Update Error", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
