import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.SECRET_SANTA_DB_URL);

// Helper for basic delay if needed, though not used in SQL directly.
// We'll trust Postgres transaction isolation if possible, but neon serverless is stateless (HTTP).
// Handling concurrency in serverless HTTP stateless SQL is tricky without stored procs or serializable isolation.
// For Secret Santa (low stakes), a "Select for Update" approach or optimistic locking is good.

exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { name, phone, department } = JSON.parse(event.body);

    if (!name || !phone) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing name or phone" }) };
    }

    try {
        // 1. Find User
        const users = await sql`
        SELECT * FROM participants 
        WHERE name = ${name.trim()} AND phone = ${phone.trim()}
    `;

        if (users.length === 0) {
            return { statusCode: 404, body: JSON.stringify({ error: "User not found" }) };
        }

        const user = users[0];

        // 2. Check if already picked
        if (user.my_santa_of_id) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    status: 'ALREADY_DONE',
                    result: {
                        name: user.my_santa_of_name,
                        department: 'Unknown (Legacy)'
                    }
                })
            };
        }

        // 3. LOGIC START: Find a candidate
        // We want someone who is NOT chosen, NOT me.
        // Department logic: Try to find someone from different department first.

        // Attempt 1: Different Department
        let candidates = await sql`
        SELECT * FROM participants 
        WHERE is_chosen = FALSE 
        AND id != ${user.id} 
        AND department != ${department}
    `;

        // Attempt 2: If no one from other dept, anyone else
        if (candidates.length === 0) {
            candidates = await sql`
            SELECT * FROM participants 
            WHERE is_chosen = FALSE 
            AND id != ${user.id}
        `;
        }

        if (candidates.length === 0) {
            return { statusCode: 409, body: JSON.stringify({ error: "NO_CANDIDATES_LEFT" }) };
        }

        // Pick Random
        const match = candidates[Math.floor(Math.random() * candidates.length)];

        // 4. Update Both (Optimistic lock check ideally, but this is simple enough for now)
        // We update the match to set is_chosen = TRUE
        // We update the user to set my_santa_of = match.id

        // NOTE: In a high concurrency environment, we might get a race condition here where two people pick the same person.
        // To solve this in Postgres safely:
        // UPDATE participants SET is_chosen = TRUE WHERE id = match.id AND is_chosen = FALSE RETURNING id

        const updateMatchResult = await sql`
        UPDATE participants 
        SET is_chosen = TRUE 
        WHERE id = ${match.id} AND is_chosen = FALSE
        RETURNING id
    `;

        if (updateMatchResult.length === 0) {
            // Race condition hit! Someone else stole this candidate just now.
            // Quick retry logic could go here, but for simplicity let's tell frontend to retry.
            return { statusCode: 409, body: JSON.stringify({ error: "CONCURRENCY_RETRY" }) };
        }

        // Update User
        await sql`
        UPDATE participants 
        SET my_santa_of_id = ${match.id}, my_santa_of_name = ${match.name}
        WHERE id = ${user.id}
    `;

        return {
            statusCode: 200,
            body: JSON.stringify({
                status: 'SUCCESS',
                result: {
                    name: match.name,
                    department: match.department
                }
            }),
        };

    } catch (error) {
        console.error("Draw Error", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
