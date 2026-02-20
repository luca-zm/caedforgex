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
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const gameId = url.searchParams.get('gameId');
  if (!gameId) return new Response("Missing gameId", { status: 400 });

  const { results } = await context.env.DB.prepare("SELECT * FROM decks WHERE gameId = ?").bind(gameId).all();
  // Parse cardIds string to array
  const parsed = results.map((d: any) => ({
    ...d,
    cardIds: d.cardIds ? JSON.parse(d.cardIds) : []
  }));
  return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const deck = await context.request.json() as any;

    const existing = await context.env.DB.prepare("SELECT id FROM decks WHERE id = ?").bind(deck.id).first();

    if (existing) {
      await context.env.DB.prepare("UPDATE decks SET name=?, cardIds=?, userId=? WHERE id=?")
        .bind(deck.name, JSON.stringify(deck.cardIds), deck.userId || null, deck.id).run();
    } else {
      await context.env.DB.prepare("INSERT INTO decks (id, gameId, name, cardIds, userId) VALUES (?, ?, ?, ?, ?)")
        .bind(deck.id, deck.gameId, deck.name, JSON.stringify(deck.cardIds), deck.userId || null).run();
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return new Response("Missing ID", { status: 400 });

  await context.env.DB.prepare("DELETE FROM decks WHERE id = ?").bind(id).run();
  return new Response(JSON.stringify({ success: true }));
}