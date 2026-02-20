import React from 'react';
import { GameProject } from '../types';

interface StaticRulesProps {
    game: GameProject;
}

export const StaticRules: React.FC<StaticRulesProps> = ({ game }) => {
    return (
        <div className="h-full flex flex-col bg-[#050407] relative overflow-hidden font-sans">
            {/* Background Texture & Vignette */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-[#050407] via-transparent to-[#050407]/80 z-20"></div>
                <img
                    src={game.boardTheme?.backgroundUrl || "https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80"}
                    className="w-full h-full object-cover opacity-20 filter blur-sm"
                    alt="Background"
                />
            </div>

            {/* HEADER */}
            <div className="relative z-30 pt-12 pb-6 px-6 text-center border-b border-white/5 bg-black/40 backdrop-blur-md">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/30 mb-3 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                    <i className="fas fa-globe text-cyan-400 text-xl"></i>
                </div>
                <h1 className="text-3xl font-black text-white italic uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-widest">
                    {game.name}
                </h1>
                <p className="text-xs font-bold text-cyan-400 uppercase tracking-[0.2em] mt-2">Official Authorized Ruleset</p>
            </div>

            {/* CONTENT */}
            <div className="relative z-20 flex-1 overflow-y-auto px-6 py-8 pb-32 space-y-8 custom-scrollbar">

                <p className="text-sm text-slate-300 text-center max-w-md mx-auto leading-relaxed border border-white/10 bg-black/40 p-4 rounded-xl shadow-inner backdrop-blur-sm">
                    The Global Armory is the central hub for competitive play. To maintain balance, all battles fought within this realm must obey the absolute laws dictated below.
                </p>

                {/* RULE 1: DECK & HAND */}
                <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl group flex flex-col">
                    <div className="h-32 relative overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80"
                            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                            alt="Deck Rule"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                        <div className="absolute bottom-4 left-6 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center">
                                <i className="fas fa-layer-group text-purple-400 text-sm"></i>
                            </div>
                            <h2 className="text-lg font-black text-white uppercase tracking-widest text-shadow">Deck & Hand limit</h2>
                        </div>
                    </div>
                    <div className="p-6">
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <i className="fas fa-check-circle text-purple-500 mt-1"></i>
                                <div>
                                    <span className="block font-bold text-white text-sm">Exactly 20 Cards</span>
                                    <span className="text-[10px] text-slate-400">Your deck must contain exactly 20 cards to enter matchmaking. No more, no less.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <i className="fas fa-check-circle text-purple-500 mt-1"></i>
                                <div>
                                    <span className="block font-bold text-white text-sm">4 Card Hand Limit</span>
                                    <span className="text-[10px] text-slate-400">At the start of the game, players draw 4 cards.</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* RULE 2: RESOURCE SYSTEM */}
                <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl group flex flex-col">
                    <div className="h-32 relative overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80"
                            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                            alt="Resource Rule"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                        <div className="absolute bottom-4 left-6 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                                <i className="fas fa-bolt text-blue-400 text-sm"></i>
                            </div>
                            <h2 className="text-lg font-black text-white uppercase tracking-widest text-shadow">Mana Ramp</h2>
                        </div>
                    </div>
                    <div className="p-6">
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <i className="fas fa-check-circle text-blue-500 mt-1"></i>
                                <div>
                                    <span className="block font-bold text-white text-sm">+1 Max Mana Per Turn</span>
                                    <span className="text-[10px] text-slate-400">Both players start with 1 Mana Crystal. At the beginning of each turn, you gain an additional maximum Mana Crystal, up to a limit of 10.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <i className="fas fa-check-circle text-blue-500 mt-1"></i>
                                <div>
                                    <span className="block font-bold text-white text-sm">Draw Phase</span>
                                    <span className="text-[10px] text-slate-400">At the start of your turn, after your Mana replenishes, you draw exactly 1 card.</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* RULE 3: COMBAT & WIN CONDITION */}
                <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl group flex flex-col">
                    <div className="h-32 relative overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1618331835717-801e976710b2?auto=format&fit=crop&q=80"
                            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                            alt="Combat Rule"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                        <div className="absolute bottom-4 left-6 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center">
                                <i className="fas fa-heart text-red-400 text-sm"></i>
                            </div>
                            <h2 className="text-lg font-black text-white uppercase tracking-widest text-shadow">Vitality combat</h2>
                        </div>
                    </div>
                    <div className="p-6">
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <i className="fas fa-check-circle text-red-500 mt-1"></i>
                                <div>
                                    <span className="block font-bold text-white text-sm">20 Starting Health</span>
                                    <span className="text-[10px] text-slate-400">You and your opponent both start with 20 Health Points.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <i className="fas fa-crosshairs text-red-500 mt-1"></i>
                                <div>
                                    <span className="block font-bold text-white text-sm">Victory Condition</span>
                                    <span className="text-[10px] text-slate-400">The game ends immediately when a player reduces their opponent's Health to 0 through unit attacks or spells.</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
};
