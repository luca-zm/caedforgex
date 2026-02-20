// Type definitions for Cloudflare Pages Functions
type D1PreparedStatement = {
  bind(...args: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<{ success: boolean; meta: any }>;
  all<T = unknown>(): Promise<{ results: T[] }>;
};

type D1Database = {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<any[]>;
};

type EventContext<Env, P extends string, Data> = {
  request: Request;
  env: Env;
  params: Record<P, string | string[]>;
  waitUntil(promise: Promise<any>): void;
  next(input?: Request | string, init?: RequestInit): Promise<Response>;
  data: Data;
};

type PagesFunction<Env = unknown, Params extends string = any, Data extends Record<string, unknown> = Record<string, unknown>> = (
  context: EventContext<Env, Params, Data>
) => Response | Promise<Response>;

interface Env {
  DB: D1Database;
  BUCKET: any; // R2Bucket
  PUBLIC_R2_URL: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { results } = await context.env.DB.prepare("SELECT * FROM games ORDER BY createdAt DESC").all();
    // Parse JSON fields stored as text
    const parsed = results.map((g: any) => ({
      ...g,
      rules: g.rules ? JSON.parse(g.rules) : undefined
    }));
    return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const game = await context.request.json() as any;
    let finalIconUrl = game.iconUrl;

    // Detect Base64 and Upload to R2
    if (game.iconUrl && game.iconUrl.startsWith('data:image')) {
      const matches = game.iconUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Uint8Array.from(atob(matches[2]), c => c.charCodeAt(0));
        const key = `worlds/${game.id}/icon-${Date.now()}.png`;

        await context.env.BUCKET.put(key, buffer, {
          httpMetadata: { contentType: 'image/png' }
        });

        // Construct Public URL
        finalIconUrl = `${context.env.PUBLIC_R2_URL}/${key}`;
      }
    }

    // Detect Base64 and Upload to R2 for Board Art
    if (game.rules && game.rules.boardTheme && game.rules.boardTheme.backgroundUrl && game.rules.boardTheme.backgroundUrl.startsWith('data:image')) {
      const matches = game.rules.boardTheme.backgroundUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Uint8Array.from(atob(matches[2]), c => c.charCodeAt(0));
        const key = `worlds/${game.id}/board-${Date.now()}.png`;

        await context.env.BUCKET.put(key, buffer, {
          httpMetadata: { contentType: 'image/png' }
        });

        // Construct Public URL
        game.rules.boardTheme.backgroundUrl = `${context.env.PUBLIC_R2_URL}/${key}`;
      }
    }

    // Check if exists to determine Insert or Update
    const existing = await context.env.DB.prepare("SELECT id FROM games WHERE id = ?").bind(game.id).first();

    if (existing) {
      await context.env.DB.prepare(
        "UPDATE games SET name=?, description=?, artStyle=?, primaryColor=?, inviteCode=?, iconUrl=?, rules=?, userId=? WHERE id=?"
      ).bind(
        game.name,
        game.description,
        game.artStyle,
        game.primaryColor,
        game.inviteCode || null,
        finalIconUrl || null,
        game.rules ? JSON.stringify(game.rules) : null,
        game.userId || null,
        game.id
      ).run();
    } else {
      await context.env.DB.prepare(
        "INSERT INTO games (id, name, description, artStyle, primaryColor, createdAt, inviteCode, iconUrl, rules, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        game.id,
        game.name,
        game.description,
        game.artStyle,
        game.primaryColor,
        game.createdAt,
        game.inviteCode || null,
        finalIconUrl || null,
        game.rules ? JSON.stringify(game.rules) : null,
        game.userId || null
      ).run();
    }

    // Return the updated game with the remote URL so UI can update state
    return new Response(JSON.stringify({ success: true, iconUrl: finalIconUrl, rules: game.rules }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return new Response("Missing ID", { status: 400 });

  try {
    // Cascade Delete: Delete Decks and Cards belonging to this game first
    const batch = await context.env.DB.batch([
      context.env.DB.prepare("DELETE FROM decks WHERE gameId = ?").bind(id),
      context.env.DB.prepare("DELETE FROM cards WHERE gameId = ?").bind(id),
      context.env.DB.prepare("DELETE FROM games WHERE id = ?").bind(id)
    ]);

    return new Response(JSON.stringify({ success: true, deleted: batch.length }));
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}