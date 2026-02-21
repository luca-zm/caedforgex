
import React from 'react';
import { GameProject } from '../types';

interface ScoreboardProps {
    game: GameProject;
    onClose: () => void;
}

// Placeholder data — will be replaced with real battle results once the combat system is live
const PLACEHOLDER_PLAYERS: { rank: number; name: string; trophies: number; wins: number; losses: number }[] = [];

const RANK_STYLES: Record<number, { bg: string; border: string; text: string; icon: string }> = {
    1: { bg: 'from-yellow-500/30 to-amber-900/20', border: 'border-yellow-500/50', text: 'text-yellow-400', icon: 'fa-crown' },
    2: { bg: 'from-slate-300/20 to-slate-600/10', border: 'border-slate-400/40', text: 'text-slate-300', icon: 'fa-medal' },
    3: { bg: 'from-orange-600/20 to-orange-900/10', border: 'border-orange-500/40', text: 'text-orange-400', icon: 'fa-medal' },
};

export const Scoreboard: React.FC<ScoreboardProps> = ({ game, onClose }) => {
    return (
        <div className="absolute inset-0 z-50 bg-[#050407]/95 backdrop-blur-xl flex flex-col animate-fadeIn overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                    >
                        <i className="fas fa-chevron-left text-sm"></i>
                    </button>
                    <div className="text-center flex-1">
                        <div className="text-[9px] font-bold text-fuchsia-400 uppercase tracking-[0.3em]">World Leaderboard</div>
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{game.name}</h2>
                    </div>
                    <div className="w-10"></div>
                </div>

                {/* Trophy Counter Header */}
                <div className="flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-yellow-900/20 via-amber-900/10 to-yellow-900/20 rounded-xl border border-yellow-500/20">
                    <i className="fas fa-trophy text-2xl text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]"></i>
                    <div>
                        <div className="text-[9px] text-yellow-400/80 font-bold uppercase tracking-widest">Season Rankings</div>
                        <div className="text-xs text-slate-400 font-medium">Top 20 Champions</div>
                    </div>
                </div>
            </div>

            {/* Scrollable Leaderboard */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4">
                {PLACEHOLDER_PLAYERS.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center h-full animate-fadeIn">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-fuchsia-500/20 blur-3xl rounded-full"></div>
                            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-fuchsia-900/40 to-purple-900/20 border border-fuchsia-500/20 flex items-center justify-center">
                                <i className="fas fa-swords text-5xl text-fuchsia-500/50"></i>
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-400 italic uppercase tracking-wider mb-2">No Battles Yet</h3>
                        <p className="text-xs text-slate-600 text-center max-w-xs leading-relaxed">
                            The arena is silent. Be the first to wage war in <strong className="text-slate-400">{game.name}</strong> and claim your place on the leaderboard.
                        </p>
                        <div className="mt-8 flex gap-3">
                            <div className="flex flex-col items-center px-6 py-4 bg-black/40 border border-white/5 rounded-2xl">
                                <i className="fas fa-trophy text-lg text-yellow-600/40 mb-2"></i>
                                <span className="text-xs text-slate-600 font-bold">0</span>
                                <span className="text-[8px] text-slate-700 uppercase tracking-widest">Trophies</span>
                            </div>
                            <div className="flex flex-col items-center px-6 py-4 bg-black/40 border border-white/5 rounded-2xl">
                                <i className="fas fa-fire text-lg text-red-600/40 mb-2"></i>
                                <span className="text-xs text-slate-600 font-bold">0</span>
                                <span className="text-[8px] text-slate-700 uppercase tracking-widest">Battles</span>
                            </div>
                            <div className="flex flex-col items-center px-6 py-4 bg-black/40 border border-white/5 rounded-2xl">
                                <i className="fas fa-users text-lg text-cyan-600/40 mb-2"></i>
                                <span className="text-xs text-slate-600 font-bold">0</span>
                                <span className="text-[8px] text-slate-700 uppercase tracking-widest">Players</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Leaderboard List */
                    <div className="space-y-2">
                        {PLACEHOLDER_PLAYERS.map((player) => {
                            const isTop3 = player.rank <= 3;
                            const style = RANK_STYLES[player.rank];
                            return (
                                <div
                                    key={player.rank}
                                    className={`
                                        flex items-center gap-4 p-4 rounded-xl border transition-all
                                        ${isTop3
                                            ? `bg-gradient-to-r ${style?.bg} ${style?.border} shadow-lg`
                                            : 'bg-black/30 border-white/5 hover:border-white/10'
                                        }
                                    `}
                                >
                                    {/* Rank Badge */}
                                    <div className={`
                                        w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0
                                        ${isTop3
                                            ? `bg-gradient-to-br from-white/10 to-white/5 ${style?.text} shadow-inner`
                                            : 'bg-white/5 text-slate-500'
                                        }
                                    `}>
                                        {isTop3 ? (
                                            <i className={`fas ${style?.icon} text-lg`}></i>
                                        ) : (
                                            <span>{player.rank}</span>
                                        )}
                                    </div>

                                    {/* Player Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-black text-sm uppercase tracking-wide truncate ${isTop3 ? 'text-white' : 'text-slate-300'}`}>
                                            {player.name}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-medium">
                                            {player.wins}W / {player.losses}L
                                        </div>
                                    </div>

                                    {/* Trophy Count */}
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-trophy text-yellow-500 text-xs"></i>
                                        <span className={`font-black text-sm ${isTop3 ? 'text-yellow-400' : 'text-slate-400'}`}>
                                            {player.trophies}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
