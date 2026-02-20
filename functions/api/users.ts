export async function onRequestPost({ request, env }) {
    try {
        const user = await request.json();

        if (!user || !user.id || !user.email) {
            return new Response(JSON.stringify({ error: "Missing user data" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Upsert User
        const query = `
            INSERT INTO users (id, email, displayName, createdAt)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
            email = excluded.email,
            displayName = excluded.displayName
        `;

        await env.DB.prepare(query)
            .bind(user.id, user.email, user.displayName || null, Date.now())
            .run();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
