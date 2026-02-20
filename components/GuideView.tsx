
import React, { useState, useEffect } from 'react';
import { GameProject, Skill } from '../types';

interface GuideViewProps {
    game: GameProject | null;
}

// Static Assets for "Nano Banana" style visual cards
const GUIDE_ASSETS = {
    forge: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop", // Mechanical/Tech (Valid)
    deck: "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1000&auto=format&fit=crop", // Books/Strategy (Updated)
    combat: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop", // Gaming/Action (Updated)
    network: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop" // Global Network (Updated)
};

export const GuideView: React.FC<GuideViewProps> = ({ game }) => {
    const isGlobal = !game || game.id === 'GLOBAL_CORE';
    const [activeTab, setActiveTab] = useState<'SYSTEM' | 'WORLD' | 'SKILLS'>(isGlobal ? 'SYSTEM' : 'WORLD');
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loadingSkills, setLoadingSkills] = useState(false);

    useEffect(() => {
        if (activeTab === 'SKILLS' && skills.length === 0) {
            setLoadingSkills(true);
            fetch('/api/skills')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setSkills(data);
                })
                .catch(console.error)
                .finally(() => setLoadingSkills(false));
        }
    }, [activeTab]);

    // --- SUB-COMPONENTS ---

    const FeatureCard = ({ icon, color, title, subtitle, steps, bgImage }: any) => (
        <div className={`relative group overflow-hidden rounded-2xl bg-black border border-white/10 hover:border-${color}-500/50 transition-all duration-500 shadow-xl`}>
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src={bgImage}
                    className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700"
                    alt={title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/20"></div>
            </div>

            <div className="relative z-10 p-6 flex flex-col h-full">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-${color}-500/20 flex items-center justify-center border border-${color}-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                        <i className={`fas ${icon} text-${color}-400 text-xl`}></i>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase italic tracking-wider leading-none drop-shadow-md">{title}</h3>
                        <p className={`text-[10px] text-${color}-400 font-bold uppercase tracking-widest`}>{subtitle}</p>
                    </div>
                </div>

                <div className="mt-auto bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                    <ul className="space-y-2">
                        {steps.map((step: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-200 leading-relaxed font-medium">
                                <i className={`fas fa-chevron-right text-${color}-500 mt-0.5 text-[10px]`}></i>
                                <span className="drop-shadow-sm">{step}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );

    const StatDisplay = ({ label, value, icon, color }: any) => (
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className={`absolute inset-0 bg-${color}-500/5 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
            <i className={`fas ${icon} text-2xl text-${color}-500 mb-2 opacity-80`}></i>
            <span className="text-2xl font-black text-white z-10">{value}</span>
            <span className={`text-[9px] font-bold text-${color}-400 uppercase tracking-widest z-10`}>{label}</span>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-[#0f0b15] relative overflow-hidden text-slate-300">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0f0b15] to-[#0f0b15] pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent opacity-50"></div>

            {/* HEADER */}
            <div className="px-6 pt-8 pb-4 relative z-10 shrink-0">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <i className="fas fa-satellite-dish text-fuchsia-400 text-xs animate-pulse"></i>
                            <span className="text-[10px] font-bold text-fuchsia-500 uppercase tracking-widest">
                                {isGlobal ? 'System Database' : 'World Archive'}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none text-shadow-lg">
                            {isGlobal ? 'Manual' : (game?.name || 'Unknown')}
                        </h1>
                    </div>

                    {/* Decorative Icon */}
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <i className={`fas ${isGlobal ? 'fa-book' : 'fa-globe'} text-slate-400`}></i>
                    </div>
                </div>

                {/* CONTEXT SWITCHER TABS */}
                <div className="flex bg-white/5 p-1 rounded-lg mt-6 border border-white/10 w-full max-w-[300px]">
                    {!isGlobal && (
                        <button
                            onClick={() => setActiveTab('WORLD')}
                            className={`flex-1 py-2 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === 'WORLD' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Intel
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('SYSTEM')}
                        className={`flex-1 py-2 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === 'SYSTEM' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Manual
                    </button>
                    <button
                        onClick={() => setActiveTab('SKILLS')}
                        className={`flex-1 py-2 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === 'SKILLS' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Skills
                    </button>
                </div>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto px-6 pb-28 no-scrollbar relative z-10">

                {/* === VIEW 1: SYSTEM MANUAL === */}
                {activeTab === 'SYSTEM' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-4 rounded-xl bg-gradient-to-r from-fuchsia-900/40 to-purple-900/20 border border-fuchsia-500/30 mb-2">
                            <p className="text-xs text-fuchsia-100 leading-relaxed font-medium">
                                <i className="fas fa-info-circle mr-2"></i>
                                Welcome to <strong>CardForge</strong>. Use this engine to generate distinct worlds, forge cards with AI, and battle using custom rulesets.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <FeatureCard
                                icon="fa-hammer"
                                color="fuchsia"
                                title="The Forge"
                                subtitle="Card Creation"
                                bgImage={GUIDE_ASSETS.forge}
                                steps={[
                                    "Enter a name to start forging.",
                                    "Select a Type (Unit, Spell, etc).",
                                    "Use 'Visual Synth' to generate AI art.",
                                    "Use 'Auto-Write' to generate lore.",
                                    "Save to Library or directly to a Deck."
                                ]}
                            />

                            <FeatureCard
                                icon="fa-layer-group"
                                color="purple"
                                title="Deck Building"
                                subtitle="Assembly"
                                bgImage={GUIDE_ASSETS.deck}
                                steps={[
                                    "Go to 'Decks' tab.",
                                    "Create a container for your strategy.",
                                    "Click cards in your library to add them.",
                                    "Watch for 'Invalid' indicators based on World Rules.",
                                    "A deck must be 'Ready' to enter combat."
                                ]}
                            />

                            <FeatureCard
                                icon="fa-gamepad"
                                color="emerald"
                                title="Combat"
                                subtitle="The Arena"
                                bgImage={GUIDE_ASSETS.combat}
                                steps={[
                                    "Select 'Play' and choose a valid deck.",
                                    "Manage Mana/Energy resources.",
                                    "Drag/Click cards to play them.",
                                    "Units have 'Summoning Sickness' (zzz).",
                                    "Attack opponent Face or Units.",
                                    "Reduce opponent HP to 0 to win."
                                ]}
                            />

                            <FeatureCard
                                icon="fa-globe"
                                color="cyan"
                                title="Multiplayer"
                                subtitle="The Network"
                                bgImage={GUIDE_ASSETS.network}
                                steps={[
                                    "Create a World to become the Admin.",
                                    "Share the 'Invite Code' found in the Launch tab.",
                                    "Friends use 'Explore > Join' to enter.",
                                    "Admins control the rules for everyone.",
                                    "Card collections are local to each World."
                                ]}
                            />
                        </div>
                    </div>
                )}

                {/* === VIEW 2: WORLD INTEL (SHOWN IF SPECIFIC GAME AND TAB SELECTED) === */}
                {!isGlobal && activeTab === 'WORLD' && game && game.rules && (
                    <div className="space-y-8 animate-slideUp">

                        {/* 1. HUD STATS */}
                        <section>
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <i className="fas fa-microchip"></i> Core Physics
                            </h2>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <StatDisplay
                                    label="Starting HP"
                                    value={game.rules.initialHealth}
                                    icon="fa-heart"
                                    color="red"
                                />
                                <StatDisplay
                                    label={game.rules.resourceType === 'MANA_RAMP' ? 'Max Mana' : 'Energy/Turn'}
                                    value={game.rules.maxResource}
                                    icon="fa-bolt"
                                    color={game.rules.resourceType === 'MANA_RAMP' ? 'blue' : 'yellow'}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-black/40 border border-white/10 rounded-lg p-2 text-center">
                                    <div className="text-[9px] text-slate-500 uppercase">Hand Size</div>
                                    <div className="text-white font-bold">{game.rules.startingHandSize}</div>
                                </div>
                                <div className="bg-black/40 border border-white/10 rounded-lg p-2 text-center">
                                    <div className="text-[9px] text-slate-500 uppercase">Draw/Turn</div>
                                    <div className="text-white font-bold">{game.rules.cardsPerTurn}</div>
                                </div>
                                <div className="bg-black/40 border border-white/10 rounded-lg p-2 text-center">
                                    <div className="text-[9px] text-slate-500 uppercase">Deck Min</div>
                                    <div className="text-white font-bold">{game.rules.constraints.minCards}</div>
                                </div>
                            </div>
                        </section>

                        {/* 2. STRATEGY CODEX */}
                        {game.promoCards && game.promoCards.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                                    <h2 className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest flex items-center gap-2">
                                        <i className="fas fa-chess-knight"></i> Tactical Codex
                                    </h2>
                                    <span className="text-[9px] bg-fuchsia-900/30 text-fuchsia-300 px-2 py-0.5 rounded border border-fuchsia-500/30">Archetypes</span>
                                </div>

                                <div className="space-y-3">
                                    {game.promoCards.map((card, idx) => (
                                        <div key={idx} className="relative overflow-hidden bg-gradient-to-r from-[#1a1824] to-black border-l-4 border-fuchsia-500 rounded-r-xl p-4 group">
                                            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-fuchsia-900/20 to-transparent pointer-events-none"></div>
                                            <div className="flex items-start gap-4 relative z-10">
                                                <div className="shrink-0 w-12 h-12 rounded-lg bg-black border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                    <i className={`fas ${card.icon} text-2xl text-fuchsia-400`}></i>
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-black uppercase text-sm mb-1 tracking-wide">{card.title}</h3>
                                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">{card.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 3. FLAVOR TEXT */}
                        <section>
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <i className="fas fa-quote-left"></i> Mission Statement
                            </h2>
                            <div className="p-6 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-black/30 border border-white/10 rounded-xl relative">
                                <p className="text-sm italic text-slate-300 font-serif leading-relaxed text-center">
                                    "{game.rules.fullText || "Dominion is earned, not given. Construct your arsenal and claim victory."}"
                                </p>
                            </div>
                        </section>

                    </div>
                )}

                {/* === VIEW 3: SKILLS LIBRARY === */}
                {activeTab === 'SKILLS' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-900/40 to-teal-900/20 border border-emerald-500/30 mb-6">
                            <p className="text-xs text-emerald-100 leading-relaxed font-medium">
                                <i className="fas fa-book-sparkles mr-2"></i>
                                The <strong>Deterministic Skill System</strong> provides balanced, physically constrained abilities. Cards automatically roll for these skills based on their Cost, Attack, and Health stats.
                            </p>
                        </div>

                        {loadingSkills ? (
                            <div className="py-12 flex flex-col items-center justify-center text-emerald-500">
                                <i className="fas fa-circle-notch fa-spin text-3xl mb-4"></i>
                                <span className="text-xs font-bold uppercase tracking-widest">Loading physical constraints...</span>
                            </div>
                        ) : skills.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                                <i className="fas fa-boxes-stacked text-3xl mb-4 opacity-50"></i>
                                <span className="text-xs font-bold uppercase tracking-widest">No skills found in global registry.</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {skills.map(skill => (
                                    <div key={skill.id} className="bg-[#0a0a0c] border border-white/10 rounded-xl p-5 hover:border-emerald-500/50 transition-colors group">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${skill.tier === 'LEGENDARY' ? 'bg-orange-500 shadow-[0_0_10px_#f97316]' : skill.tier === 'EPIC' ? 'bg-purple-500 shadow-[0_0_10px_#a855f7]' : skill.tier === 'RARE' ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-slate-400'}`}></div>
                                                {skill.name}
                                            </h3>
                                            <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-emerald-400 font-bold tracking-widest uppercase border border-white/5">{skill.tier}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed mb-4">{skill.description}</p>

                                        {/* Constraints Footer */}
                                        <div className="flex flex-wrap gap-2 mt-auto border-t border-white/5 pt-3">
                                            {skill.allowedTypes.map(t => (
                                                <span key={t} className="text-[8px] uppercase font-bold tracking-wide bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded mr-1">
                                                    <i className="fas fa-tag mr-1 text-slate-500"></i>{t}
                                                </span>
                                            ))}
                                            {skill.minCost !== null && skill.minCost !== undefined && (
                                                <span className="text-[8px] uppercase font-bold tracking-wide bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/20">
                                                    Cost <span className="text-blue-200">≥ {skill.minCost}</span>
                                                </span>
                                            )}
                                            {skill.maxAttack !== null && skill.maxAttack !== undefined && (
                                                <span className="text-[8px] uppercase font-bold tracking-wide bg-red-900/30 text-red-300 px-1.5 py-0.5 rounded border border-red-500/20">
                                                    ATK <span className="text-red-200">≤ {skill.maxAttack}</span>
                                                </span>
                                            )}
                                            {skill.maxHealth !== null && skill.maxHealth !== undefined && (
                                                <span className="text-[8px] uppercase font-bold tracking-wide bg-green-900/30 text-green-300 px-1.5 py-0.5 rounded border border-green-500/20">
                                                    HP <span className="text-green-200">≤ {skill.maxHealth}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};
