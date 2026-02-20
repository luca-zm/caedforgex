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
    try {
        const { results } = await context.env.DB.prepare("SELECT * FROM skills ORDER BY tier, name").all();

        // Parse JSON allowedTypes
        const parsed = results.map((s: any) => ({
            ...s,
            allowedTypes: s.allowedTypes ? JSON.parse(s.allowedTypes) : []
        }));

        return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json' } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
