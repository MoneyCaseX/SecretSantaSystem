import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.SECRET_SANTA_DB_URL);

exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    const { action, id, data } = JSON.parse(event.body);
    // action: 'APPROVE' | 'REJECT' | 'UPDATE'

    if (!id) return { statusCode: 400, body: "ID required" };

    try {
        if (action === 'REJECT') {
            await sql`DELETE FROM pending_registrations WHERE id = ${id}`;
            return { statusCode: 200, body: JSON.stringify({ message: "Rejected" }) };
        }

        if (action === 'UPDATE') {
            const { name, phone, department } = data;
            await sql`
            UPDATE pending_registrations 
            SET name=${name}, phone=${phone}, department=${department}
            WHERE id = ${id}
        `;
            return { statusCode: 200, body: JSON.stringify({ message: "Updated" }) };
        }

        if (action === 'APPROVE') {
            // Move from Pending -> Participants
            // We need to fetch it first (or trust passed data, but fetch is safer)
            const pendingRows = await sql`SELECT * FROM pending_registrations WHERE id = ${id}`;
            if (pendingRows.length === 0) return { statusCode: 404, body: "Request not found" };

            const p = pendingRows[0];

            // Transaction manually
            // 1. Insert into Participants
            await sql`
            INSERT INTO participants (name, phone, department)
            VALUES (${p.name}, ${p.phone}, ${p.department})
        `;

            // 2. Delete from Pending
            await sql`DELETE FROM pending_registrations WHERE id = ${id}`;

            return { statusCode: 200, body: JSON.stringify({ message: "Approved & Moved" }) };
        }

        return { statusCode: 400, body: "Invalid Action" };

    } catch (error) {
        console.error("Process Error", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
