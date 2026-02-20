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

type R2Bucket = {
  put(key: string, value: any, options?: any): Promise<any>;
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
  BUCKET: R2Bucket;
  PUBLIC_R2_URL: string; // e.g. "https://pub-xxxx.r2.dev"
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const gameId = url.searchParams.get('gameId');

  if (!gameId) return new Response("Missing gameId", { status: 400 });

  const { results } = await context.env.DB.prepare("SELECT * FROM cards WHERE gameId = ? ORDER BY createdAt DESC").bind(gameId).all();
  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const card = await context.request.json() as any;
    let finalImageUrl = card.imageUrl;

    // Detect Base64 and Upload to R2
    if (card.imageUrl && card.imageUrl.startsWith('data:image')) {
      const matches = card.imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Uint8Array.from(atob(matches[2]), c => c.charCodeAt(0));
        const key = `cards/${card.gameId}/${card.id}-${Date.now()}.png`;

        await context.env.BUCKET.put(key, buffer, {
          httpMetadata: { contentType: 'image/png' }
        });

        // Construct Public URL
        // Ensure env.PUBLIC_R2_URL is set in Cloudflare Dashboard
        finalImageUrl = `${context.env.PUBLIC_R2_URL}/${key}`;
      }
    }

    // Upsert logic
    const existing = await context.env.DB.prepare("SELECT id FROM cards WHERE id = ?").bind(card.id).first();

    if (existing) {
      await context.env.DB.prepare(
        "UPDATE cards SET name=?, type=?, cost=?, attack=?, health=?, description=?, imageUrl=?, userId=? WHERE id=?"
      ).bind(
        card.name, card.type, card.cost, card.attack || 0, card.health || 0, card.description, finalImageUrl, card.userId || null, card.id
      ).run();
    } else {
      await context.env.DB.prepare(
        "INSERT INTO cards (id, gameId, name, type, cost, attack, health, description, imageUrl, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        card.id, card.gameId, card.name, card.type, card.cost, card.attack || 0, card.health || 0, card.description, finalImageUrl, card.createdAt, card.userId || null
      ).run();
    }

    // Return the updated card with the remote URL so UI can update state
    return new Response(JSON.stringify({ ...card, imageUrl: finalImageUrl }), { headers: { 'Content-Type': 'application/json' } });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}