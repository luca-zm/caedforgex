
// Type definitions for Cloudflare Pages Functions
type D1PreparedStatement = {
  bind(...args: any[]): D1PreparedStatement;
  run<T = unknown>(): Promise<{ success: boolean; meta: any }>;
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Define the schema SQL commands directly here
    const statements = [
      context.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS games (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            artStyle TEXT,
            primaryColor TEXT,
            createdAt INTEGER,
            inviteCode TEXT,
            rules TEXT
        );
      `),
      context.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS cards (
            id TEXT PRIMARY KEY,
            gameId TEXT NOT NULL,
            name TEXT NOT NULL,
            type TEXT,
            cost INTEGER,
            attack INTEGER,
            health INTEGER,
            description TEXT,
            imageUrl TEXT,
            createdAt INTEGER
        );
      `),
      context.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS decks (
            id TEXT PRIMARY KEY,
            gameId TEXT NOT NULL,
            name TEXT NOT NULL,
            cardIds TEXT
        );
      `),
      context.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_cards_game ON cards(gameId);`),
      context.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_decks_game ON decks(gameId);`)
    ];

    await context.env.DB.batch(statements);
    
    return new Response(JSON.stringify({ success: true, message: "Database tables created successfully." }), { 
        headers: { 'Content-Type': 'application/json' } 
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
