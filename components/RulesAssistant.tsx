
import React, { useState, useEffect } from 'react';
import { generateRuleAssistance, generateBoardArt, generatePromoCards, generateUIBackground, CodexSlot } from '../services/geminiService';
import { GameProject, BoardType, CardType, DeckConstraints, BoardTheme, PromoCard, GameRules, ResourceType } from '../types';

interface RulesAssistantProps {
    game: GameProject;
    onSaveRules: (rules: any) => void;
    onClose?: () => void; // Callback to close wizard
}

// Helper for textures
const TEXTURES = [
    { id: 'MAT', label: 'Pro Playmat', icon: 'fa-layer-group', desc: 'Smooth fabric surface for competitive play.' },
    { id: 'WOOD', label: 'Tavern Wood', icon: 'fa-tree', desc: 'Aged oak table for RPG vibes.' },
    { id: 'METAL', label: 'Sci-Fi Metal', icon: 'fa-hdd', desc: 'Brushed steel panels for futuristic settings.' },
    { id: 'HOLOGRAPHIC', label: 'Holo Grid', icon: 'fa-globe', desc: 'Neon wireframe projection for cyber worlds.' },
    { id: 'STONE', label: 'Ancient Stone', icon: 'fa-archway', desc: 'Cracked temple floor for fantasy lore.' }
];

const COLOR_PRESETS = [
    '#6750A4', '#B91C1C', '#15803D', '#1D4ED8', '#A21CAF', '#BE185D', '#0F172A', '#FFFFFF'
];

// "Nano Banana" Style Static Generated Assets
const STATIC_THEMES = {
    vitality: "https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=1000&auto=format&fit=crop", // Abstract Dark Red/Fluid
    economy: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop", // Abstract Blue/Neon Energy
    hand: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop", // Abstract Deep Green/Nebula
    constraints: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=1000&auto=format&fit=crop" // Abstract Purple/Geometric
};

// --- NEW: ROBUST GAMEPLAY ARCHETYPES ---
interface GameArchetype {
    id: string;
    name: string;
    icon: string;
    description: string;
    rules: Partial<GameRules>;
    codexPrompt: CodexSlot[]; // Hints for the AI to write the tutorial cards
}

const GAME_ARCHETYPES: GameArchetype[] = [
    {
        id: 'SKIRMISH',
        name: 'Blitz Skirmish',
        icon: 'fa-bolt',
        description: 'Fast-paced, aggressive combat. Low HP, fixed energy for immediate action.',
        rules: {
            initialHealth: 20,
            resourceType: 'FIXED_ENERGY',
            maxResource: 3, // Very restrictive, tactical
            startingHandSize: 4,
            cardsPerTurn: 2, // Draw lots of cards to keep action going
            constraints: { minCards: 15, maxCards: 30, allowedTypes: [CardType.UNIT, CardType.SPELL], maxCopiesPerCard: 3 }
        },
        codexPrompt: [
            { archetype: 'Rusher Unit', hint: 'Low cost, high attack, glass cannon' },
            { archetype: 'Burst Spell', hint: 'Direct damage or combat trick' },
            { archetype: 'Objective', hint: 'Win before turn 6' }
        ]
    },
    {
        id: 'COMMANDER',
        name: 'High Commander',
        icon: 'fa-chess-king',
        description: 'Slow, strategic buildup. Massive HP, mana ramp, huge decks.',
        rules: {
            initialHealth: 40,
            resourceType: 'MANA_RAMP',
            maxResource: 12,
            startingHandSize: 7,
            cardsPerTurn: 1,
            constraints: { minCards: 40, maxCards: 60, allowedTypes: [CardType.UNIT, CardType.SPELL, CardType.ARTIFACT, CardType.LAND], maxCopiesPerCard: 2 }
        },
        codexPrompt: [
            { archetype: 'Resource Land', hint: 'Provides mana or long term value' },
            { archetype: 'Legendary Unit', hint: 'High cost, game winning effect' },
            { archetype: 'Board Wipe', hint: 'Clear all units spell' }
        ]
    },
    {
        id: 'DUEL',
        name: 'Classic Duel',
        icon: 'fa-fist-raised',
        description: 'Balanced standard rules. The sweet spot for most competitive designs.',
        rules: {
            initialHealth: 30,
            resourceType: 'MANA_RAMP',
            maxResource: 10,
            startingHandSize: 5,
            cardsPerTurn: 1,
            constraints: { minCards: 30, maxCards: 40, allowedTypes: [CardType.UNIT, CardType.SPELL, CardType.ARTIFACT], maxCopiesPerCard: 3 }
        },
        codexPrompt: [
            { archetype: 'Core Unit', hint: 'Mid-sized stats with an effect' },
            { archetype: 'Utility Spell', hint: 'Draw cards or remove unit' },
            { archetype: 'Synergy Piece', hint: 'Buffs other cards' }
        ]
    }
];

export const RulesAssistant: React.FC<RulesAssistantProps> = ({ game, onSaveRules, onClose }) => {
    const [tab, setTab] = useState<'MECHANICS' | 'ARENA' | 'PUBLISH'>('MECHANICS');
    const [loading, setLoading] = useState(false);
    const [activeHelp, setActiveHelp] = useState<string | null>(null);

    // Background Images State for Logic Sections
    // Initialize with Static Assets if no custom ones exist
    const [sectionBgs, setSectionBgs] = useState<{
        vitality: string;
        economy: string;
        hand: string;
        constraints: string;
    }>(game.rules?.sectionBgs || STATIC_THEMES);

    // -- DEFAULT CONFIGURATION --
    const defaultRules: GameRules = {
        initialHealth: 20,
        resourceType: 'MANA_RAMP',
        maxResource: 10,
        startingResource: 1,
        cardsPerTurn: 1,
        startingHandSize: 5,
        winCondition: 'REDUCE_HEALTH',
        boardType: 'NONE',
        fullText: '',
        constraints: {
            minCards: 15,
            maxCards: 40,
            allowedTypes: [CardType.UNIT, CardType.SPELL, CardType.ARTIFACT, CardType.LAND],
            maxCopiesPerCard: 3
        },
        multiplayerMode: 'CASUAL'
    };

    const [rules, setRules] = useState<GameRules>(game.rules ? { ...defaultRules, ...game.rules } : defaultRules);
    const [inviteCode, setInviteCode] = useState(game.inviteCode || '');

    // NEW: Track selected archetype to guide UI
    const [selectedArchetypeId, setSelectedArchetypeId] = useState<string | null>(null);

    // Visuals
    const [boardTheme, setBoardTheme] = useState<BoardTheme>(game.boardTheme || {
        backgroundUrl: '',
        borderColor: game.primaryColor || '#6750A4',
        texture: 'MAT'
    });

    const [promoCards, setPromoCards] = useState<PromoCard[]>(game.promoCards || []);

    // Codex Configuration (Now derived from Archetype, but editable)
    const [codexSlots, setCodexSlots] = useState<CodexSlot[]>([]);

    useEffect(() => {
        if (!inviteCode) {
            const code = `${game.name.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            setInviteCode(code);
        }

        // Initialize codex slots if empty
        if (codexSlots.length === 0) {
            setCodexSlots(GAME_ARCHETYPES[2].codexPrompt); // Default to Balanced
        }

        // Auto generate promos if missing on load (using default slots)
        if (promoCards.length === 0 && tab === 'PUBLISH') {
            handleGenerateCodex();
        }
    }, [tab]);

    // --- ACTIONS ---

    const handleApplyArchetype = (archetypeId: string) => {
        const arch = GAME_ARCHETYPES.find(a => a.id === archetypeId);
        if (!arch) return;

        if (!confirm(`Switch to "${arch.name}" Protocol?\n\nThis will REWRITE your current rules (HP, Mana, Limits) to ensure a balanced ${arch.name} experience.`)) return;

        setSelectedArchetypeId(archetypeId);
        const nextRules = { ...rules, ...arch.rules };
        setCodexSlots(arch.codexPrompt);

        // Clear current promos so user knows to regenerate
        setPromoCards([]);

        // Auto-Regenerate Codex immediately to keep the view in sync
        const newCodex = generateCodexText(arch, nextRules);
        setRules({ ...nextRules, fullText: newCodex });
    };

    const generateCodexText = (arch: any, currentRules: GameRules) => {
        const resourceDesc = currentRules.resourceType === 'MANA_RAMP' ? "Mana (Increases by 1 each turn)" : "Fixed Energy (Refreshes each turn)";
        const winCondDesc = currentRules.winCondition === 'REDUCE_HEALTH' ? `Reduce opponent from ${currentRules.initialHealth} HP to 0.` : "Complete objective criteria.";

        return `
# 📜 Codex: ${game.name}

## The Core Objective
Your primary goal is to **${winCondDesc}**

## Game Architecture: ${arch.name}
*${arch.description}*

### Vital Statistics
- **Starting Health:** ${currentRules.initialHealth}
- **Economy Engine:** ${resourceDesc} (Max: ${currentRules.maxResource})
- **Starting Hand:** ${currentRules.startingHandSize} cards
- **Draw Rate:** ${currentRules.cardsPerTurn} card(s) per turn

### Deck Building Laws
- **Deck Size:** ${currentRules.constraints.minCards} to ${currentRules.constraints.maxCards} cards
- **Card Limit:** Maximum ${currentRules.constraints.maxCopiesPerCard} copies of the same card
- **Permitted Elements:** ${currentRules.constraints.allowedTypes.join(', ')}

### Combat Flow
1. **Draw Phase:** Draw ${currentRules.cardsPerTurn} card(s).
2. **Main Phase:** Play cards paying their exact Cost.
3. **Combat Phase:** Units strike the enemy or defending units.
4. **End Phase:** Damage is resolved and the turn is passed.
`;
    };

    const handleGenerateSectionThemes = async () => {
        if (loading) return;
        setLoading(true);
        try {
            // Parallel generation for speed
            const [vitality, economy, hand, constraints] = await Promise.all([
                generateUIBackground('Vitality Health Life Blood Heart', game.artStyle),
                generateUIBackground('Mana Energy Power Crystal Magic', game.artStyle),
                generateUIBackground('Book Library Scroll Cards Research', game.artStyle),
                generateUIBackground('Scales Balance Law Order Chains', game.artStyle)
            ]);
            const newSectionBgs = { vitality, economy, hand, constraints };
            setSectionBgs(newSectionBgs);

            // AUTO-SAVE TO PERSIST TO CLOUDFLARE R2 IMMEDIATELY
            onSaveRules({
                ...rules,
                sectionBgs: newSectionBgs,
                _extra: {
                    boardTheme,
                    promoCards,
                    inviteCode
                }
            });
        } catch (e) {
            console.error("Theme gen failed", e);
            alert("Failed to visualize themes. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateBoard = async () => {
        setLoading(true);
        try {
            const url = await generateBoardArt(
                game.name,
                game.artStyle,
                rules.boardType,
                boardTheme.texture,
                boardTheme.borderColor
            );
            const newTheme = { ...boardTheme, backgroundUrl: url };
            setBoardTheme(newTheme);

            // AUTO-SAVE TO PERSIST TO CLOUDFLARE R2 IMMEDIATELY
            onSaveRules({
                ...rules,
                sectionBgs,
                _extra: {
                    boardTheme: newTheme,
                    promoCards,
                    inviteCode
                }
            });
        } catch (e) {
            alert("Failed to generate board art");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCodex = async () => {
        if (loading) return;
        setLoading(true);

        // Simulate a brief generation delay for UX
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            const arch = GAME_ARCHETYPES.find(a => a.id === selectedArchetypeId) || GAME_ARCHETYPES[2];
            const newCodex = generateCodexText(arch, rules);

            setRules(prev => ({ ...prev, fullText: newCodex }));

            // Clear promos since we no longer use them for the Codex
            setPromoCards([]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFinalSave = () => {
        if (!confirm("⚠️ Update World Rules?\n\nThis will apply to all NEW matches. Matches currently in progress will continue with the old ruleset to prevent errors.")) return;

        onSaveRules({
            ...rules,
            sectionBgs, // Save the generated backgrounds
            _extra: {
                boardTheme,
                promoCards,
                inviteCode
            }
        });
        if (onClose) onClose();
    };

    const toggleCardType = (type: CardType) => {
        setRules(prev => {
            const exists = prev.constraints.allowedTypes.includes(type);
            const newTypes = exists
                ? prev.constraints.allowedTypes.filter(t => t !== type)
                : [...prev.constraints.allowedTypes, type];

            return { ...prev, constraints: { ...prev.constraints, allowedTypes: newTypes } };
        });
    };

    // Helper Component for Contextual Help (FIXED POSITIONING)
    const HelpToggle = ({ id, title, text }: { id: string, title: string, text: string }) => (
        <div
            className="inline-block ml-2 relative z-50"
            onMouseEnter={() => setActiveHelp(id)}
            onMouseLeave={() => setActiveHelp(null)}
            onClick={(e) => { e.stopPropagation(); setActiveHelp(activeHelp === id ? null : id); }}
        >
            <button
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shadow-sm ${activeHelp === id ? 'bg-fuchsia-500 text-white' : 'bg-white/10 text-slate-400 hover:text-white hover:bg-white/20'}`}
            >
                ?
            </button>
            {activeHelp === id && (
                // Positioned right-0 to align with the button edge, avoiding overflow
                <div className="absolute right-0 top-7 w-60 bg-[#1e1b2e] border border-fuchsia-500/30 p-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] z-[100] animate-fadeIn pointer-events-none backdrop-blur-xl">
                    {/* Little Arrow */}
                    <div className="absolute top-[-6px] right-1 w-3 h-3 bg-[#1e1b2e] border-l border-t border-fuchsia-500/30 transform rotate-45"></div>

                    <h4 className="text-fuchsia-400 font-bold text-xs uppercase mb-2 pb-2 border-b border-white/5">{title}</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{text}</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-[#0f0b15] relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0f0b15] to-[#0f0b15] pointer-events-none"></div>

            {/* HEADER */}
            <div className="shrink-0 relative z-30 bg-black/40 border-b border-white/5 backdrop-blur-md p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white transition-colors">
                        <i className="fas fa-chevron-left text-xs"></i>
                    </button>
                    <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">
                        Game Tuner
                    </h2>
                </div>

                <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
                    <button
                        onClick={() => setTab('MECHANICS')}
                        className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${tab === 'MECHANICS' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        Logic
                    </button>
                    <button
                        onClick={() => setTab('ARENA')}
                        className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${tab === 'ARENA' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        Visuals
                    </button>
                    <button
                        onClick={() => setTab('PUBLISH')}
                        className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${tab === 'PUBLISH' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        Launch
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto pb-40 px-6 pt-6 no-scrollbar relative z-10" onClick={() => setActiveHelp(null)}>

                {/* === MECHANICS TAB === */}
                {tab === 'MECHANICS' && (
                    <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">

                        {/* SECTION 1: VITALITY */}
                        <div className="glass-panel rounded-3xl border border-white/10 relative group overflow-hidden transition-all hover:border-red-500/30 shadow-lg">
                            {/* Background Layer */}
                            <div className="absolute inset-0 pointer-events-none">
                                <img
                                    src={sectionBgs.vitality}
                                    className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-all duration-700 mix-blend-screen scale-110 group-hover:scale-100"
                                    alt="Vitality"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-[#0f0b15] via-[#0f0b15]/90 to-transparent"></div>
                                <div className="absolute inset-0 bg-red-900/10 mix-blend-overlay"></div>
                            </div>

                            <div className="p-6 relative z-10">
                                <div className="flex items-center mb-6">
                                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mr-3 border border-red-500/30 backdrop-blur-sm">
                                        <i className="fas fa-heart text-red-400 text-xs"></i>
                                    </div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest text-shadow">Vitality System</h3>
                                    <HelpToggle id="vitality" title="Starting Health" text="Determines the duration of the match. Higher health (30-40) allows for combo decks. Lower health (15-20) favors aggressive strategies." />
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between items-end mb-4">
                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Starting HP</span>
                                            <span className="text-3xl font-black text-white drop-shadow-md">{rules.initialHealth}</span>
                                        </div>
                                        <input
                                            type="range" min="10" max="100" step="5"
                                            value={rules.initialHealth}
                                            onChange={(e) => setRules({ ...rules, initialHealth: Number(e.target.value) })}
                                            className="w-full accent-red-500 h-2 bg-black/50 rounded-lg appearance-none cursor-pointer hover:bg-black/70 transition-colors"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setRules({ ...rules, initialHealth: 20 })} className={`py-3 rounded-2xl border transition-all font-bold text-xs uppercase shadow-lg backdrop-blur-md ${rules.initialHealth === 20 ? 'border-red-500 bg-red-500/40 text-white shadow-red-900/20' : 'border-white/5 bg-black/40 text-slate-400 hover:bg-white/10'}`}>Standard (20)</button>
                                        <button onClick={() => setRules({ ...rules, initialHealth: 40 })} className={`py-3 rounded-2xl border transition-all font-bold text-xs uppercase shadow-lg backdrop-blur-md ${rules.initialHealth === 40 ? 'border-red-500 bg-red-500/40 text-white shadow-red-900/20' : 'border-white/5 bg-black/40 text-slate-400 hover:bg-white/10'}`}>Commander (40)</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: ECONOMY */}
                        <div className="glass-panel rounded-3xl border border-white/10 relative group overflow-hidden transition-all hover:border-blue-500/30 shadow-lg">
                            <div className="absolute inset-0 pointer-events-none">
                                <img
                                    src={sectionBgs.economy}
                                    className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-all duration-700 mix-blend-screen scale-110 group-hover:scale-100"
                                    alt="Economy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-[#0f0b15] via-[#0f0b15]/90 to-transparent"></div>
                                <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay"></div>
                            </div>

                            <div className="p-6 relative z-10">
                                <div className="flex items-center mb-6">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3 border border-blue-500/30 backdrop-blur-sm">
                                        <i className="fas fa-bolt text-blue-400 text-xs"></i>
                                    </div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest text-shadow">Economy Engine</h3>
                                    <HelpToggle id="economy" title="Resource System" text="Mana Ramp: You gain +1 max mana each turn (Slow build up). Fixed Energy: Your energy resets to the cap every turn (Consistent power)." />
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <button
                                        onClick={() => setRules({ ...rules, resourceType: 'MANA_RAMP' })}
                                        className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group/btn backdrop-blur-md ${rules.resourceType === 'MANA_RAMP' ? 'bg-blue-600/30 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-black/40 border-white/5 opacity-60 hover:opacity-100 hover:bg-white/10'}`}
                                    >
                                        <div className="relative z-10">
                                            <div className={`text-xs font-black uppercase mb-2 ${rules.resourceType === 'MANA_RAMP' ? 'text-blue-300' : 'text-slate-400'}`}>Mana Ramp</div>
                                            <div className="text-[10px] text-slate-300 leading-tight">Start low, gain +1 max per turn (Like HS/MTG).</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setRules({ ...rules, resourceType: 'FIXED_ENERGY' })}
                                        className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group/btn backdrop-blur-md ${rules.resourceType === 'FIXED_ENERGY' ? 'bg-yellow-600/30 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'bg-black/40 border-white/5 opacity-60 hover:opacity-100 hover:bg-white/10'}`}
                                    >
                                        <div className="relative z-10">
                                            <div className={`text-xs font-black uppercase mb-2 ${rules.resourceType === 'FIXED_ENERGY' ? 'text-yellow-300' : 'text-slate-400'}`}>Fixed Energy</div>
                                            <div className="text-[10px] text-slate-300 leading-tight">Refreshes every turn (Like Lorcana/Actions).</div>
                                        </div>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-end mb-4">
                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{rules.resourceType === 'MANA_RAMP' ? 'Mana Cap' : 'Energy Per Turn'}</span>
                                            <span className="text-3xl font-black text-white drop-shadow-md">{rules.maxResource}</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="20" step="1"
                                            value={rules.maxResource}
                                            onChange={(e) => setRules({ ...rules, maxResource: Number(e.target.value) })}
                                            className={`w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer ${rules.resourceType === 'MANA_RAMP' ? 'accent-blue-500' : 'accent-yellow-500'}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: DRAW & HAND */}
                        <div className="glass-panel p-6 rounded-3xl border border-white/10 relative group overflow-hidden transition-all hover:border-emerald-500/30 shadow-lg">
                            <div className="absolute inset-0 pointer-events-none">
                                <img
                                    src={sectionBgs.hand}
                                    className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-all duration-700 mix-blend-screen scale-110 group-hover:scale-100"
                                    alt="Hand"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-[#0f0b15] via-[#0f0b15]/90 to-transparent"></div>
                                <div className="absolute inset-0 bg-emerald-900/10 mix-blend-overlay"></div>
                            </div>

                            <div className="flex items-center mb-8 relative z-10">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3 border border-emerald-500/30 backdrop-blur-sm">
                                    <i className="fas fa-hand-holding text-emerald-400 text-xs"></i>
                                </div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest text-shadow">Hand & Library</h3>
                                <HelpToggle id="hand" title="Card Advantage" text="Controls the pace of the game. More cards drawn = faster games and more consistency. Fewer cards = more top-deck reliance." />
                            </div>

                            <div className="grid grid-cols-2 gap-6 relative z-10">
                                {/* Counter 1 */}
                                <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex flex-col items-center shadow-lg">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Starting Hand</label>
                                    <div className="flex items-center bg-black/60 rounded-full border border-white/10 p-1 w-full max-w-[140px]">
                                        <button onClick={() => setRules(p => ({ ...p, startingHandSize: Math.max(1, p.startingHandSize - 1) }))} className="w-10 h-8 rounded-l-full flex items-center justify-center hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 transition-colors active:scale-90"><i className="fas fa-minus text-xs"></i></button>
                                        <span className="flex-1 text-center font-black text-white text-lg">{rules.startingHandSize}</span>
                                        <button onClick={() => setRules(p => ({ ...p, startingHandSize: Math.min(10, p.startingHandSize + 1) }))} className="w-10 h-8 rounded-r-full flex items-center justify-center hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 transition-colors active:scale-90"><i className="fas fa-plus text-xs"></i></button>
                                    </div>
                                </div>
                                {/* Counter 2 */}
                                <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex flex-col items-center shadow-lg">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Draw Per Turn</label>
                                    <div className="flex items-center bg-black/60 rounded-full border border-white/10 p-1 w-full max-w-[140px]">
                                        <button onClick={() => setRules(p => ({ ...p, cardsPerTurn: Math.max(0, p.cardsPerTurn - 1) }))} className="w-10 h-8 rounded-l-full flex items-center justify-center hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 transition-colors active:scale-90"><i className="fas fa-minus text-xs"></i></button>
                                        <span className="flex-1 text-center font-black text-white text-lg">{rules.cardsPerTurn}</span>
                                        <button onClick={() => setRules(p => ({ ...p, cardsPerTurn: Math.min(5, p.cardsPerTurn + 1) }))} className="w-10 h-8 rounded-r-full flex items-center justify-center hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 transition-colors active:scale-90"><i className="fas fa-plus text-xs"></i></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 4: CONSTRAINTS */}
                        <div className="glass-panel p-6 rounded-3xl border border-white/10 relative group overflow-hidden transition-all hover:border-purple-500/30 shadow-lg">
                            <div className="absolute inset-0 pointer-events-none">
                                <img
                                    src={sectionBgs.constraints}
                                    className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-all duration-700 mix-blend-screen scale-110 group-hover:scale-100"
                                    alt="Constraints"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-[#0f0b15] via-[#0f0b15]/90 to-transparent"></div>
                                <div className="absolute inset-0 bg-purple-900/10 mix-blend-overlay"></div>
                            </div>

                            <div className="flex items-center mb-6 relative z-10">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-3 border border-purple-500/30 backdrop-blur-sm">
                                    <i className="fas fa-ruler-combined text-purple-400 text-xs"></i>
                                </div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest text-shadow">Deck Constraints</h3>
                            </div>

                            <div className="mb-8 relative z-10">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Min Deck Size</span>
                                    <span className="text-3xl font-black text-white drop-shadow-md">{rules.constraints.minCards}</span>
                                </div>
                                <input
                                    type="range" min="5" max="60" step="5"
                                    value={rules.constraints.minCards}
                                    onChange={(e) => setRules({ ...rules, constraints: { ...rules.constraints, minCards: Number(e.target.value) } })}
                                    className="w-full accent-purple-500 h-2 bg-black/50 rounded-lg appearance-none cursor-pointer hover:bg-black/70 transition-colors"
                                />
                            </div>

                            <div className="relative z-10">
                                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-4">Allowed Card Types</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.values(CardType).map(t => {
                                        const active = rules.constraints.allowedTypes.includes(t);
                                        return (
                                            <button
                                                key={t}
                                                onClick={() => toggleCardType(t)}
                                                className={`
                                                flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all duration-300 backdrop-blur-sm
                                                ${active
                                                        ? 'bg-purple-600/60 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)] border border-purple-400 translate-y-[-1px]'
                                                        : 'bg-black/40 text-slate-500 border border-white/10 hover:bg-white/5 hover:text-slate-300'}
                                            `}
                                            >
                                                <span className={`w-2 h-2 rounded-full ${active ? 'bg-white' : 'bg-slate-700'}`}></span>
                                                {t}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* ... rest of the component (ARENA and PUBLISH tabs) remains the same ... */}
                {/* === ARENA TAB (VISUALS) === */}
                {tab === 'ARENA' && (
                    <div className="space-y-8 animate-fadeIn max-w-2xl mx-auto">

                        {/* PREVIEW BOX */}
                        <div className="glass-panel p-1 rounded-3xl border border-white/20 shadow-2xl relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>

                            <div className="relative bg-black rounded-[20px] overflow-hidden aspect-video border border-white/10">
                                {/* The actual preview logic */}
                                {boardTheme.backgroundUrl ? (
                                    <div className="w-full h-full relative">
                                        <img src={boardTheme.backgroundUrl} className="w-full h-full object-cover" alt="Arena" />
                                        <div className="absolute inset-0 pointer-events-none" style={{ border: `12px solid ${boardTheme.borderColor}` }}></div>
                                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded text-[10px] text-white font-bold uppercase border border-white/20">
                                            Live Preview
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#151320]">
                                        <i className="fas fa-image text-4xl text-slate-700 mb-3"></i>
                                        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">No Art Generated</span>
                                    </div>
                                )}

                                {/* Loading Overlay */}
                                {loading && (
                                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 backdrop-blur-sm">
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                                            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Designing Arena...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* MATERIAL LAB */}
                        <div className="space-y-6">

                            {/* Texture Grid */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 block">Surface Material</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {TEXTURES.map(tex => (
                                        <button
                                            key={tex.id}
                                            onClick={() => setBoardTheme({ ...boardTheme, texture: tex.id as any })}
                                            className={`
                                            relative h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all overflow-hidden group
                                            ${boardTheme.texture === tex.id ? 'border-cyan-400 bg-cyan-900/20 shadow-lg' : 'border-white/10 bg-white/5 hover:bg-white/10'}
                                        `}
                                        >
                                            <i className={`fas ${tex.icon} text-xl ${boardTheme.texture === tex.id ? 'text-cyan-400' : 'text-slate-500'}`}></i>
                                            <span className={`text-[9px] font-bold uppercase tracking-wide ${boardTheme.texture === tex.id ? 'text-white' : 'text-slate-500'}`}>{tex.label}</span>
                                            {boardTheme.texture === tex.id && <div className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_5px_#22d3ee]"></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Palette */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 block">Accent Color</label>
                                <div className="flex flex-wrap gap-3 p-4 bg-black/30 rounded-2xl border border-white/5">
                                    {COLOR_PRESETS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setBoardTheme({ ...boardTheme, borderColor: color })}
                                            className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${boardTheme.borderColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                            style={{ backgroundColor: color }}
                                        ></button>
                                    ))}
                                    <div className="w-[1px] h-10 bg-white/10 mx-2"></div>
                                    <div className="relative group">
                                        <input
                                            type="color"
                                            value={boardTheme.borderColor}
                                            onChange={(e) => setBoardTheme({ ...boardTheme, borderColor: e.target.value })}
                                            className="w-10 h-10 rounded-full cursor-pointer bg-transparent border-0 opacity-0 absolute inset-0 z-10"
                                        />
                                        <div className="w-10 h-10 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,#FF0000_0deg,#00FF00_120deg,#0000FF_240deg,#FF0000_360deg)] border-2 border-white/20 flex items-center justify-center">
                                            <i className="fas fa-plus text-white text-[10px] drop-shadow-md"></i>
                                        </div>
                                    </div>
                                    <span className="ml-auto text-xs font-mono text-slate-400 self-center">{boardTheme.borderColor.toUpperCase()}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateBoard}
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-3 mt-4"
                            >
                                <i className="fas fa-magic"></i> Generate Table Art
                            </button>
                        </div>
                    </div>
                )}

                {/* === PUBLISH TAB (LAUNCH & CODEX) === */}
                {tab === 'PUBLISH' && (
                    <div className="animate-fadeIn space-y-8 max-w-2xl mx-auto">

                        {/* INVITE CODE */}
                        <div className="glass-panel p-1 rounded-3xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-black opacity-50"></div>
                            <div className="relative z-10 p-8 flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
                                    <i className="fas fa-globe text-2xl text-emerald-400 animate-pulse"></i>
                                </div>
                                <h2 className="text-3xl font-black text-white tracking-[0.2em] mb-1">{inviteCode}</h2>
                                <span className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest mb-6">World Access Code</span>

                                <button
                                    onClick={() => navigator.clipboard.writeText(inviteCode).then(() => alert("Code Copied!"))}
                                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg uppercase text-xs tracking-wider flex items-center gap-2 shadow-lg transition-colors"
                                >
                                    <i className="fas fa-copy"></i> Copy Invite
                                </button>
                            </div>
                        </div>

                        {/* NEW: GAMEPLAY ARCHETYPE SELECTOR (Replaces "Design Protocol") */}
                        <div className="glass-panel p-6 rounded-3xl border border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-bold text-fuchsia-400 uppercase tracking-widest">Gameplay Archetype</h3>
                            </div>

                            <div className="grid gap-3">
                                {GAME_ARCHETYPES.map((arch) => {
                                    const isSelected = selectedArchetypeId === arch.id;
                                    return (
                                        <button
                                            key={arch.id}
                                            onClick={() => handleApplyArchetype(arch.id)}
                                            className={`relative group p-4 rounded-xl border transition-all text-left flex items-start gap-4 ${isSelected ? 'bg-fuchsia-900/20 border-fuchsia-500 ring-1 ring-fuchsia-500/50' : 'bg-black/40 border-white/10 hover:bg-white/5'}`}
                                        >
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border ${isSelected ? 'bg-fuchsia-500 text-white border-fuchsia-400 shadow-[0_0_15px_#d946ef]' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                                                <i className={`fas ${arch.icon} text-xl`}></i>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <h4 className={`text-sm font-black uppercase tracking-wide mb-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>{arch.name}</h4>
                                                    {isSelected && <i className="fas fa-check-circle text-fuchsia-500"></i>}
                                                </div>
                                                <p className="text-[10px] text-slate-400 leading-tight mb-2">{arch.description}</p>

                                                {/* Mini Stats Preview */}
                                                <div className="flex gap-2">
                                                    <span className="text-[9px] font-bold bg-black/50 px-2 py-0.5 rounded text-red-400 border border-red-500/20">{arch.rules.initialHealth} HP</span>
                                                    <span className="text-[9px] font-bold bg-black/50 px-2 py-0.5 rounded text-blue-400 border border-blue-500/20">{arch.rules.resourceType === 'MANA_RAMP' ? 'Ramp' : 'Fixed Energy'}</span>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* GENERATED CODEX (MARKDOWN) */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-fuchsia-400 uppercase tracking-widest">Generated Codex</h3>
                            </div>

                            {/* CODEX DISPLAY */}
                            <div className="w-full bg-[#0a0a0c] border border-white/10 rounded-2xl overflow-hidden relative min-h-[300px] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                                {(loading || !rules.fullText) && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-black/60 z-10 backdrop-blur-sm">
                                        {loading ? (
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                                <span className="text-xs uppercase font-bold text-fuchsia-400 tracking-widest">Scribing Digital Laws...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <i className="fas fa-scroll text-4xl mb-3 opacity-30 text-fuchsia-900"></i>
                                                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Select an Archetype to draft the core laws of your universe</span>
                                            </>
                                        )}
                                    </div>
                                )}

                                {rules.fullText && !loading && (
                                    <div className="p-6 h-[400px] overflow-y-auto no-scrollbar relative animate-fadeIn">
                                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] pointer-events-none"></div>

                                        {/* Render Markdown-like content natively since we control the structure */}
                                        {rules.fullText.split('\n').map((line, idx) => {

                                            // Helper to transform **text** to bold
                                            const renderBoldParts = (text: string) => {
                                                if (!text.includes('**')) return text;
                                                const parts = text.split('**');
                                                return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-white tracking-wide">{part}</strong> : part);
                                            };

                                            if (line.startsWith('# ')) {
                                                return <h2 key={idx} className="text-2xl font-black text-white italic uppercase mb-6 tracking-wider border-b border-white/10 pb-2">{line.replace('# ', '')}</h2>;
                                            }
                                            if (line.startsWith('## ')) {
                                                return <h3 key={idx} className="text-lg font-bold text-fuchsia-400 mt-6 mb-3 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full"></div>{line.replace('## ', '')}</h3>;
                                            }
                                            if (line.startsWith('### ')) {
                                                return <h4 key={idx} className="text-sm font-bold text-slate-300 mt-4 mb-2 uppercase tracking-wide">{line.replace('### ', '')}</h4>;
                                            }
                                            if (line.startsWith('- **')) {
                                                // Handle bold key-value pairs
                                                const parts = line.replace('- **', '').split('**');
                                                return (
                                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-2 pl-4 border-l border-white/10">
                                                        <span className="text-xs font-bold text-white uppercase">{parts[0]}</span>
                                                        <span className="text-[11px] text-emerald-400">{parts[1]?.replace(':', '')}</span>
                                                    </div>
                                                );
                                            }
                                            if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
                                                const parts = line.split('**');
                                                return (
                                                    <div key={idx} className="flex gap-3 mb-3 bg-white/5 p-3 rounded-lg border border-white/5">
                                                        <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0 border border-white/10">{line.charAt(0)}</div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-white uppercase mb-1">{parts[1]}</span>
                                                            <span className="text-[10px] text-slate-400">{parts[2]}</span>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            if (line.startsWith('*')) {
                                                return <p key={idx} className="text-[11px] text-slate-400 italic mb-4 border-l-2 border-fuchsia-500/50 pl-3 leading-relaxed">{renderBoldParts(line.replaceAll('*', ''))}</p>;
                                            }
                                            if (line.trim() === '') {
                                                return <div key={idx} className="h-2"></div>;
                                            }
                                            return <p key={idx} className="text-xs text-slate-300 mb-2 leading-relaxed">{renderBoldParts(line)}</p>;
                                        })}
                                    </div>
                                )}
                            </div>
                            {/* Explanatory Text */}
                            <p className="text-[10px] text-slate-500 mt-3 text-center">This definitive codex replaces AI generation to ensure strict, balanced, deterministic gameplay rules for the <strong>{game.name}</strong> network.</p>
                        </div>

                        <button
                            onClick={handleFinalSave}
                            className="w-full py-5 bg-white text-black font-black uppercase tracking-widest rounded-xl shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 relative mb-12"
                        >
                            <i className="fas fa-check-circle text-emerald-600 text-xl"></i> Update Rules
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
