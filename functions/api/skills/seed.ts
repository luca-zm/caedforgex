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

const SEED_SKILLS = [
    // ------------------ COMMON TIER ------------------
    {
        id: 'skill_provoke_01',
        name: 'Provoke',
        description: 'Enemies must attack this unit before attacking other targets or the player.',
        allowedTypes: ['UNIT'],
        maxHealth: null,
        maxAttack: null,
        minCost: 1,
        tier: 'COMMON'
    },
    {
        id: 'skill_rush_01',
        name: 'Rush',
        description: 'Can attack the same turn it is played.',
        allowedTypes: ['UNIT'],
        maxHealth: 5,
        maxAttack: 4, // Prevent massive OTK units
        minCost: 1,
        tier: 'COMMON'
    },
    {
        id: 'skill_pierce_01',
        name: 'Armor Piercing',
        description: 'Damage dealt by this unit ignores enemy armor or shields.',
        allowedTypes: ['UNIT', 'SPELL'],
        maxHealth: null,
        maxAttack: null,
        minCost: 2,
        tier: 'COMMON'
    },
    {
        id: 'skill_ward_01',
        name: 'Ward',
        description: 'Ignores the first source of damage dealt to this unit.',
        allowedTypes: ['UNIT', 'ARTIFACT'],
        maxHealth: 4, // Only given to squishier units
        maxAttack: null,
        minCost: 2,
        tier: 'COMMON'
    },
    // ------------------ RARE TIER ------------------
    {
        id: 'skill_fury_02',
        name: 'Fury',
        description: 'Can attack twice per turn.',
        allowedTypes: ['UNIT'],
        maxHealth: null,
        maxAttack: 3, // Very strict cap to prevent broken double-hits
        minCost: 3,
        tier: 'RARE'
    },
    {
        id: 'skill_lifesteal_02',
        name: 'Lifesteal',
        description: 'When this deals damage, heal your hero for the same amount.',
        allowedTypes: ['UNIT', 'SPELL'],
        maxHealth: null,
        maxAttack: null,
        minCost: 3,
        tier: 'RARE'
    },
    {
        id: 'skill_lethal_02',
        name: 'Lethal Strike',
        description: 'Any damage dealt to a unit immediately destroys it, regardless of its health.',
        allowedTypes: ['UNIT'],
        maxHealth: 3, // Strict health cap - usually a glass cannon
        maxAttack: null,
        minCost: 4,
        tier: 'RARE'
    },
    // ------------------ EPIC TIER ------------------
    {
        id: 'skill_aoe_03',
        name: 'Cleave',
        description: 'Also damages enemies adjacent to the target.',
        allowedTypes: ['UNIT', 'SPELL'],
        maxHealth: null,
        maxAttack: 5,
        minCost: 5,
        tier: 'EPIC'
    },
    {
        id: 'skill_regen_03',
        name: 'Regeneration',
        description: 'At the end of your turn, restore this unit to full health.',
        allowedTypes: ['UNIT'],
        maxHealth: 6,
        maxAttack: null,
        minCost: 4,
        tier: 'EPIC'
    },
    // ------------------ LEGENDARY TIER ------------------
    {
        id: 'skill_resurrect_04',
        name: 'Phoenix Soul',
        description: 'When destroyed, return this unit to the board with 1 Health instead of going to the graveyard. (Once per game)',
        allowedTypes: ['UNIT'],
        maxHealth: null,
        maxAttack: null,
        minCost: 8,
        tier: 'LEGENDARY'
    }
];

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        // Clear existing skills for a clean seed
        await context.env.DB.prepare("DELETE FROM skills").run();

        const statements = SEED_SKILLS.map(skill =>
            context.env.DB.prepare(
                "INSERT INTO skills (id, name, description, allowedTypes, maxHealth, maxAttack, minCost, tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            ).bind(
                skill.id,
                skill.name,
                skill.description,
                JSON.stringify(skill.allowedTypes),
                skill.maxHealth,
                skill.maxAttack,
                skill.minCost,
                skill.tier
            )
        );

        const result = await context.env.DB.batch(statements);

        return new Response(JSON.stringify({ success: true, seededCount: result.length }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
