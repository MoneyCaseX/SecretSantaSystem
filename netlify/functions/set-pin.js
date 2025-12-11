import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.SECRET_SANTA_DB_URL);

export const handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { name, phone, pin } = JSON.parse(event.body);

        if (!name || !phone || !pin) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
        }

        // Validate PIN (simple 4 digit check)
        if (!/^\d{4}$/.test(pin)) {
            return { statusCode: 400, body: JSON.stringify({ error: "PIN must be 4 digits" }) };
        }

        // Update user
        const result = await sql`
            UPDATE participants 
            SET pin_code = ${pin}
            WHERE LOWER(name) = LOWER(${name.trim()}) AND phone = ${phone.trim()}
            RETURNING id
        `;

        if (result.length === 0) {
            return { statusCode: 404, body: JSON.stringify({ error: "User not found" }) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "PIN set successfully" }),
        };
    } catch (error) {
        console.error("Set PIN Error", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
