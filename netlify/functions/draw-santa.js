import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.SECRET_SANTA_DB_URL);

exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { phone, pin } = JSON.parse(event.body);

        if (!phone || !pin) {
            return { statusCode: 400, body: JSON.stringify({ error: "Phone and PIN required" }) };
        }

        // Check game status
        const statusResult = await sql`SELECT setting_value FROM game_settings WHERE setting_key = 'status'`;
        const gameStatus = statusResult[0]?.setting_value || 'CLOSED';

        if (gameStatus === 'CLOSED') {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: "Game is closed. Contact admin." })
            };
        }

        if (gameStatus === 'SCHEDULED') {
            const timeResult = await sql`SELECT setting_value FROM game_settings WHERE setting_key = 'start_time'`;
            const startTime = timeResult[0]?.setting_value;
            if (startTime && new Date(startTime) > new Date()) {
                return {
                    statusCode: 403,
                    body: JSON.stringify({
                        error: "Game not started yet",
                        startTime: startTime
                    })
                };
            }
        }

        // Verify PIN and get participant
        const participants = await sql`
            SELECT * FROM participants 
            WHERE phone = ${phone.trim()} AND pin_code = ${pin}
        `;

        if (participants.length === 0) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: "Invalid phone or PIN." })
            };
        }

        const user = participants[0];

        // If already drawn, return existing assignment
        if (user.my_santa_of_id) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    user: { name: user.name, phone: user.phone, department: user.department },
                    assignment: { name: user.my_santa_of_name, id: user.my_santa_of_id }
                })
            };
        }

        // Get all participants
        const allParticipants = await sql`SELECT * FROM participants ORDER BY id`;

        if (allParticipants.length < 2) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Not enough participants" })
            };
        }

        // Find available targets (not chosen yet, not self)
        const availableTargets = allParticipants.filter(p =>
            !p.is_chosen && p.id !== user.id
        );

        if (availableTargets.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "No available assignments left" })
            };
        }

        // Randomly pick a target
        const randomIndex = Math.floor(Math.random() * availableTargets.length);
        const target = availableTargets[randomIndex];

        // Update the database
        await sql`
            UPDATE participants 
            SET my_santa_of_id = ${target.id}, 
                my_santa_of_name = ${target.name}
            WHERE id = ${user.id}
        `;

        await sql`
            UPDATE participants 
            SET is_chosen = TRUE 
            WHERE id = ${target.id}
        `;

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                user: { name: user.name, phone: user.phone, department: user.department },
                assignment: { name: target.name, id: target.id }
            })
        };

    } catch (error) {
        console.error("Draw Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
