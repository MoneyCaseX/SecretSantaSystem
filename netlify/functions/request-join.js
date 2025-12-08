import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.SECRET_SANTA_DB_URL);

exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { name, phone, department } = JSON.parse(event.body);

        if (!name || !phone) {
            return { statusCode: 400, body: JSON.stringify({ error: "Name/Phone required" }) };
        }

        // Insert into Pending
        await sql`
        INSERT INTO pending_registrations (name, phone, department)
        VALUES (${name.trim()}, ${phone.trim()}, ${department || 'General'})
    `;

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Request sent successfully!" }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
