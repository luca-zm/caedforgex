
import React, { useState, useEffect } from 'react';
import { GameProject, ArtStyle } from '../types';
import { storageService } from '../services/storageService';
import { generateWorldIcon } from '../services/geminiService';
import { useAuth } from './AuthProvider';
import { auth } from '../services/firebase';

interface GameDashboardProps {
    games: GameProject[];
    createdGameIds: string[];
    joinedGameIds: string[];
    onCreateGame: (game: GameProject) => void;
    onSelectGame: (gameId: string) => void;
    onJoinGame: (gameId: string) => void;
    onJoinByCode: (code: string) => void;
    onDeleteGame: (gameId: string) => void;
}

// STATIC ASSETS CONFIGURATION
const THEME_ASSETS: Record<ArtStyle, { bg: string }> = {
    'FANTASY_OIL': { bg: 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2574&auto=format&fit=crop' },
    'CYBERPUNK': { bg: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2670&auto=format&fit=crop' },
    'PIXEL_ART': { bg: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2670&auto=format&fit=crop' },
    'ANIME': { bg: 'https://images.unsplash.com/photo-1560933446-4dc5c48b264e?q=80&w=2670&auto=format&fit=crop' },
    'LOVECRAFT': { bg: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2568&auto=format&fit=crop' },
    'MINIMALIST': { bg: 'https://images.unsplash.com/photo-1506259091721-347f798196d4?q=80&w=2670&auto=format&fit=crop' }
};

const GLOBAL_VAULT_ASSETS = {
    bg: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2022&auto=format&fit=crop',
    icon: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=200&h=200&auto=format&fit=crop'
};

// Internal Component: 3D Floating Background
const VoidBackground = () => {
    const particles = Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`,
        duration: `${10 + Math.random() * 10}s`,
        size: Math.random() > 0.5 ? 'card' : 'particle',
        opacity: 0.1 + Math.random() * 0.3
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#0a0510]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0510] to-[#0a0510]"></div>
            <div className="absolute bottom-0 left-[-50%] right-[-50%] h-[50vh] bg-[linear-gradient(transparent_0%,rgba(88,28,135,0.2)_1px,transparent_1px),linear-gradient(90deg,transparent_0%,rgba(88,28,135,0.2)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(500px)_rotateX(60deg)] opacity-30"></div>
            {particles.map((p) => (
                <div
                    key={p.id}
                    className={`absolute bottom-[-10%] bg-gradient-to-t from-white/10 to-transparent border border-white/20 backdrop-blur-sm
                        ${p.size === 'card' ? 'w-24 h-32 rounded-lg' : 'w-4 h-4 rounded-full'}
                    `}
                    style={{
                        left: p.left,
                        opacity: p.opacity,
                        animation: `floatUp ${p.duration} linear infinite`,
                        animationDelay: p.delay,
                    }}
                ></div>
            ))}
            <style>{`
                @keyframes floatUp {
                    0% { transform: translateY(0) rotateX(0deg) rotateY(0deg) scale(0.8); opacity: 0; }
                    20% { opacity: 0.5; }
                    80% { opacity: 0.5; }
                    100% { transform: translateY(-120vh) rotateX(180deg) rotateY(360deg) scale(1.2); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export const GameDashboard: React.FC<GameDashboardProps> = ({
    games, createdGameIds, joinedGameIds, onCreateGame, onSelectGame, onJoinGame, onJoinByCode, onDeleteGame
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [isInboxOpen, setIsInboxOpen] = useState(false);
    const [inspectingGame, setInspectingGame] = useState<GameProject | null>(null);
    const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);

    // CHANGED: Added 'CORE' tab to explicitly separate the Global World
    const [activeTab, setActiveTab] = useState<'CORE' | 'MY_WORLDS' | 'EXPLORE'>('MY_WORLDS');
    const [searchQuery, setSearchQuery] = useState('');
    const [inviteCodeInput, setInviteCodeInput] = useState('');
    const { currentUser } = useAuth();

    // Avatar cycling logic for the profile badge
    const avatars = [
        '/avatars/avatar_cyberpunk.png',
        '/avatars/avatar_fantasy.png',
        '/avatars/avatar_paladin.png',
        '/avatars/avatar_lovecraft.png',
        '/avatars/avatar_pixel.png',
        '/avatars/avatar_scifi.png'
    ];
    const [avatarIndex, setAvatarIndex] = useState(0);

    // Try to load saved avatar preference or default to first
    useEffect(() => {
        const saved = localStorage.getItem(`avatar_${currentUser?.uid}`);
        if (saved) setAvatarIndex(parseInt(saved));
    }, [currentUser]);

    const cycleAvatar = () => {
        const next = (avatarIndex + 1) % avatars.length;
        setAvatarIndex(next);
        localStorage.setItem(`avatar_${currentUser?.uid}`, next.toString());
    };

    const [newGame, setNewGame] = useState<Partial<GameProject>>({
        name: '',
        description: '',
        artStyle: 'FANTASY_OIL',
        primaryColor: '#6750A4'
    });

    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const joinCode = urlParams.get('join');
        if (joinCode) {
            setInviteCodeInput(joinCode);
            setIsInboxOpen(true);
        }
    }, []);

    const handleCreate = async () => {
        if (!newGame.name) return;
        setIsGeneratingIcon(true);
        try {
            let iconUrl = '';
            try {
                iconUrl = await generateWorldIcon(newGame.name, newGame.artStyle as ArtStyle);
            } catch (e) { console.error("Icon Gen Failed", e); }

            const game: GameProject = {
                id: crypto.randomUUID(),
                name: newGame.name,
                description: newGame.description || 'A new adventure awaits.',
                artStyle: newGame.artStyle as ArtStyle,
                primaryColor: newGame.primaryColor || '#6750A4',
                createdAt: Date.now(),
                iconUrl: iconUrl
            };
            onCreateGame(game);
            setIsCreating(false);
            onSelectGame(game.id);
        } catch (e) {
            alert("Creation failed.");
        } finally {
            setIsGeneratingIcon(false);
            setNewGame({ name: '', description: '', artStyle: 'FANTASY_OIL', primaryColor: '#6750A4' });
        }
    };

    const handleCodeSubmit = () => {
        if (inviteCodeInput) {
            onJoinByCode(inviteCodeInput);
            setInviteCodeInput('');
            setIsInboxOpen(false);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    };

    const handleSystemInit = async () => {
        if (!confirm("Initialize Cloudflare D1 Database Tables?")) return;
        try {
            await storageService.setupCloudDatabase();
            alert("System Initialized!");
            window.location.reload();
        } catch (e: any) {
            alert("Init Failed: " + e.message);
        }
    };

    const styleOptions: { id: ArtStyle; label: string; icon: string; color: string }[] = [
        { id: 'FANTASY_OIL', label: 'Fantasy', icon: 'fa-dragon', color: 'from-amber-600 to-red-800' },
        { id: 'CYBERPUNK', label: 'Cyber', icon: 'fa-robot', color: 'from-cyan-500 to-blue-700' },
        { id: 'PIXEL_ART', label: 'Pixel', icon: 'fa-gamepad', color: 'from-purple-500 to-pink-600' },
        { id: 'ANIME', label: 'Anime', icon: 'fa-star', color: 'from-pink-400 to-orange-400' },
        { id: 'LOVECRAFT', label: 'Horror', icon: 'fa-eye', color: 'from-gray-700 to-black' },
        { id: 'MINIMALIST', label: 'Minimal', icon: 'fa-square', color: 'from-slate-400 to-slate-600' },
    ];

    // CHANGED: Filter logic now strictly respects the active tab to avoid duplicates
    const filteredGames = games.filter(g => {
        // 1. CORE Tab -> Return EMPTY for the list, because we render the Hero Banner manually.
        if (activeTab === 'CORE') {
            return false;
        }

        // For other tabs, exclude GLOBAL_CORE so it doesn't appear in the grid
        if (g.id === 'GLOBAL_CORE') return false;

        // 2. Text Search
        if (searchQuery && !g.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        // 3. Tab Filter
        if (activeTab === 'MY_WORLDS') {
            return joinedGameIds.includes(g.id);
        } else {
            return !joinedGameIds.includes(g.id); // Explore means games I haven't joined yet
        }
    });

    // ... (Inspector Modal and Invite Modal code remains the same, omitted for brevity but preserved in output logic)
    const renderInspector = () => {
        if (!inspectingGame) return null;
        const isJoined = joinedGameIds.includes(inspectingGame.id);
        return (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col animate-fadeIn">
                <div className="p-6 flex justify-between items-start">
                    <div>
                        <div className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-widest mb-1">{inspectingGame.artStyle}</div>
                        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">{inspectingGame.name}</h2>
                    </div>
                    <button onClick={() => setInspectingGame(null)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 pb-4 no-scrollbar space-y-8">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">Game Features</label>
                        <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
                            {(!inspectingGame.promoCards || inspectingGame.promoCards.length === 0) && (
                                <div className="w-full text-slate-500 text-sm italic">The creator hasn't published guide cards yet.</div>
                            )}
                            {inspectingGame.promoCards?.map((card, i) => (
                                <div key={i} className="snap-center shrink-0 w-64 h-80 relative rounded-2xl overflow-hidden group shadow-2xl border border-white/10 bg-black">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-black opacity-80"></div>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                        <i className={`fas ${card.icon} text-6xl text-white/20 mb-6 group-hover:scale-110 transition-transform duration-500`}></i>
                                        <h3 className="text-2xl font-black text-white uppercase mb-4">{card.title}</h3>
                                        <p className="text-sm text-slate-300 leading-relaxed">{card.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {inspectingGame.boardTheme?.backgroundUrl && (
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">Arena Preview</label>
                            <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-lg relative group">
                                <img src={inspectingGame.boardTheme.backgroundUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" alt="Arena" />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-xs font-bold text-white uppercase tracking-widest bg-black/50 px-3 py-1 rounded backdrop-blur">Battlefield</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Lore</label>
                        <p className="text-slate-300 text-sm leading-relaxed">{inspectingGame.description}</p>
                    </div>
                </div>
                <div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur">
                    {isJoined ? (
                        <button
                            onClick={() => { onSelectGame(inspectingGame.id); setInspectingGame(null); }}
                            className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform"
                        >
                            Enter World
                        </button>
                    ) : (
                        <button
                            onClick={() => { onJoinGame(inspectingGame.id); setInspectingGame(null); }}
                            className="w-full py-4 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                        >
                            Join Universe
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const renderInbox = () => {
        if (!isInboxOpen) return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center">
                <VoidBackground />
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-10" onClick={() => setIsInboxOpen(false)}></div>
                <div className="relative z-20 w-[90%] max-w-md animate-slideUp">
                    <div className="glass-panel p-1 rounded-[30px] border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                        <div className="bg-black/80 rounded-[26px] p-6 overflow-hidden relative">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%] pointer-events-none z-30"></div>
                            <div className="flex justify-between items-center mb-6 border-b border-green-500/20 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-green-900/40 flex items-center justify-center border border-green-500/50">
                                        <i className="fas fa-satellite-dish text-green-400 animate-pulse"></i>
                                    </div>
                                    <h2 className="text-xl font-black text-green-400 tracking-widest uppercase">Transmissions</h2>
                                </div>
                                <button onClick={() => setIsInboxOpen(false)} className="text-green-600 hover:text-green-400">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="mb-6">
                                <label className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-2 block">Decrypt Frequency (Invite Code)</label>
                                <div className="flex gap-2">
                                    <input
                                        value={inviteCodeInput}
                                        onChange={(e) => setInviteCodeInput(e.target.value)}
                                        placeholder="XXXX-0000"
                                        className="flex-1 bg-black border-2 border-green-900 text-green-400 font-mono text-center tracking-[0.2em] py-3 rounded-lg focus:border-green-500 outline-none uppercase placeholder-green-900"
                                    />
                                    <button onClick={handleCodeSubmit} className="px-4 bg-green-600 text-black font-bold rounded-lg hover:bg-green-500">
                                        <i className="fas fa-key"></i>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-3 block">Pending Signals</label>
                                <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                                    <div className="text-center py-4 text-[10px] text-green-800 italic">No other signals detected...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ==================== DASHBOARD LIST ====================
    return (
        <div className="h-full flex flex-col relative overflow-hidden">
            <VoidBackground />
            {renderInspector()}
            {renderInbox()}

            {/* CREATE GAME MODAL - FIXED LAYOUT */}
            {isCreating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    {/* Background Overlay */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10" onClick={() => !isGeneratingIcon && setIsCreating(false)}></div>
                    <VoidBackground />

                    {/* Modal Content */}
                    <div className="relative z-20 w-[90%] max-w-lg animate-slideUp">
                        <div className="glass-panel p-8 rounded-[30px] border border-white/20 shadow-[0_0_50px_rgba(139,92,246,0.3)]">
                            <div className="text-center mb-8">
                                <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-[0.3em]">Genesis Protocol</span>
                                <h2 className="text-4xl font-black text-white tracking-tighter mt-1 italic">FORGE REALM</h2>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">World Name</label>
                                    <input
                                        disabled={isGeneratingIcon}
                                        className="w-full bg-black/50 border-2 border-white/10 rounded-2xl px-6 py-4 text-xl font-bold text-white focus:border-fuchsia-500 transition-colors outline-none placeholder-white/20 disabled:opacity-50"
                                        value={newGame.name}
                                        onChange={e => setNewGame({ ...newGame, name: e.target.value })}
                                        placeholder="e.g. Aetheria"
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Art Direction</label>
                                    <div className="grid grid-cols-2 gap-3 h-48 overflow-y-auto pr-1 no-scrollbar">
                                        {styleOptions.map(opt => (
                                            <button
                                                key={opt.id}
                                                disabled={isGeneratingIcon}
                                                onClick={() => setNewGame({ ...newGame, artStyle: opt.id })}
                                                className={`relative overflow-hidden p-3 rounded-xl border transition-all duration-200 group text-left ${newGame.artStyle === opt.id ? 'border-fuchsia-400 bg-fuchsia-900/20' : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30 disabled:opacity-30'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${opt.color} flex items-center justify-center shadow-lg`}>
                                                        <i className={`fas ${opt.icon} text-sm text-white`}></i>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-white uppercase">{opt.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button disabled={isGeneratingIcon} onClick={() => setIsCreating(false)} className="flex-1 py-4 text-slate-400 font-bold hover:text-white transition-colors uppercase tracking-widest text-xs disabled:opacity-50">Cancel</button>
                                    <button
                                        onClick={handleCreate}
                                        disabled={isGeneratingIcon}
                                        className="flex-[2] py-4 bg-white text-black rounded-xl font-black shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
                                    >
                                        {isGeneratingIcon ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-bolt text-fuchsia-600"></i>}
                                        {isGeneratingIcon ? "Generating Icon..." : "Initialize"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative z-10 flex flex-col h-full">

                {/* Hero Header Area */}
                <div className="p-6 pb-2">
                    <div className="flex justify-between items-start mb-6">
                        <div className="relative cursor-pointer" onClick={cycleAvatar}>
                            {/* User Profile Badge (Replaces basic Card Forge logo on MY WORLDS/EXPLORE) */}
                            <div className="flex items-center gap-3 bg-[#1a1b26]/80 backdrop-blur-md pr-4 pl-1 py-1 rounded-[24px] border border-[#24283b] shadow-xl hover:border-blue-500/50 transition-all group">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#24283b] group-hover:border-blue-400 group-active:scale-95 transition-all relative">
                                    <img src={avatars[avatarIndex]} alt="User Avatar" className="w-full h-full object-cover" />
                                    {/* Small online indicator */}
                                    <div className="absolute right-0 bottom-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1b26]"></div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Active Agent</span>
                                    <span className="text-sm font-bold text-white leading-none truncate max-w-[120px]">
                                        {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Player'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsInboxOpen(true)}
                                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur border border-white/20 flex items-center justify-center hover:bg-green-500/20 hover:border-green-500 hover:text-green-400 text-slate-300 transition-all shadow-lg relative"
                            >
                                <i className="fas fa-satellite-dish text-xs"></i>
                                <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]"></div>
                            </button>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center hover:bg-fuchsia-500 hover:text-white text-white transition-all shadow-lg"
                            >
                                <i className="fas fa-plus"></i>
                            </button>
                            <button
                                onClick={() => { if (confirm("Log out?")) auth.signOut(); }}
                                className="w-10 h-10 rounded-full bg-red-900/30 backdrop-blur border border-red-500/30 flex items-center justify-center hover:bg-red-500 text-red-300 hover:text-white transition-all shadow-lg"
                            >
                                <i className="fas fa-power-off text-xs"></i>
                            </button>
                        </div>
                    </div>

                    {/* 3-WAY TAB SYSTEM (Replaces Buttons) */}
                    <div className="flex bg-black/40 p-1 rounded-xl mb-6 border border-white/10 relative">
                        <button
                            onClick={() => setActiveTab('CORE')}
                            className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'CORE' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            <i className="fas fa-globe mr-1"></i> The Core
                        </button>
                        <button
                            onClick={() => setActiveTab('MY_WORLDS')}
                            className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'MY_WORLDS' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            <i className="fas fa-planet-ringed mr-1"></i> My Worlds
                        </button>
                        <button
                            onClick={() => setActiveTab('EXPLORE')}
                            className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'EXPLORE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            <i className="fas fa-search mr-1"></i> Explore
                        </button>
                    </div>

                    {/* Search Bar (Only valid for Non-Core) */}
                    {activeTab !== 'CORE' && (
                        <div className="relative mb-2">
                            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                            <input
                                type="text"
                                placeholder="Search universes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:bg-white/10 focus:border-fuchsia-500/50 transition-all outline-none"
                            />
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar pb-4 px-6 pt-2">
                    <div className="flex flex-col gap-4">

                        {/* GLOBAL CORE SPECIAL DISPLAY */}
                        {activeTab === 'CORE' && (
                            <div className="animate-fadeIn">
                                <button
                                    onClick={() => onSelectGame('GLOBAL_CORE')}
                                    className="w-full mb-4 relative h-64 rounded-3xl overflow-hidden border-2 border-cyan-500/30 group cursor-pointer shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                                >
                                    <img src={GLOBAL_VAULT_ASSETS.bg} alt="Global" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 group-hover:scale-105 transform" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

                                    <div className="absolute inset-0 p-8 flex flex-col justify-end items-start">
                                        <div className="w-16 h-16 rounded-2xl bg-cyan-500 flex items-center justify-center shadow-lg mb-4 text-black">
                                            <i className="fas fa-infinity text-3xl"></i>
                                        </div>
                                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter group-hover:text-cyan-400 transition-colors">Global Armory</h3>
                                        <p className="text-sm text-cyan-200/80 mt-2 max-w-[80%] font-medium">The central vault. Forge cards and decks that transcend dimensions.</p>

                                        <div className="mt-6 bg-white/10 backdrop-blur px-6 py-3 rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest hover:bg-cyan-500 hover:text-black hover:border-cyan-500 transition-all">
                                            Enter Vault <i className="fas fa-arrow-right ml-2"></i>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Empty State for other tabs */}
                        {activeTab !== 'CORE' && filteredGames.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-[30vh] animate-fadeIn opacity-50">
                                <i className="fas fa-meteor text-4xl text-slate-600 mb-4"></i>
                                <h3 className="text-xl font-bold text-slate-400 italic">NOTHING FOUND</h3>
                                <p className="text-xs text-slate-600">
                                    {activeTab === 'MY_WORLDS' ? "You haven't forged any worlds yet." : "No new universes discovered."}
                                </p>
                                {activeTab === 'MY_WORLDS' && (
                                    <button onClick={() => setIsCreating(true)} className="mt-4 text-xs font-bold text-fuchsia-400 uppercase border-b border-fuchsia-400 pb-1">Create New World</button>
                                )}
                            </div>
                        )}

                        {/* Game List */}
                        {filteredGames.map(game => (
                            <div
                                key={game.id}
                                onClick={() => setInspectingGame(game)}
                                className="group relative h-40 w-full rounded-3xl overflow-hidden transition-all duration-500 border border-white/5 hover:border-white/30 shadow-xl bg-black/40 cursor-pointer"
                            >
                                <img
                                    src={THEME_ASSETS[game.artStyle]?.bg || THEME_ASSETS['MINIMALIST'].bg}
                                    className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-all duration-700 group-hover:scale-105"
                                    alt="Background"
                                />
                                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

                                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded bg-black/40 backdrop-blur text-[8px] font-black uppercase tracking-widest text-white border border-white/10 shadow-sm">
                                                {game.artStyle.replace('_', ' ')}
                                            </span>
                                            {createdGameIds.includes(game.id) && (
                                                <span className="px-2 py-0.5 rounded bg-yellow-500/20 backdrop-blur text-[8px] font-black uppercase tracking-widest text-yellow-400 border border-yellow-500/30 shadow-sm flex items-center gap-1">
                                                    <i className="fas fa-crown text-[8px]"></i> Owner
                                                </span>
                                            )}
                                        </div>
                                        {createdGameIds.includes(game.id) && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) onDeleteGame(game.id); }}
                                                className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all border border-red-500/20"
                                            >
                                                <i className="fas fa-trash text-xs"></i>
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-4 max-w-[75%]">
                                            <div className="w-14 h-14 shrink-0 rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg group-hover:border-white/40 transition-colors bg-black">
                                                {game.iconUrl ? (
                                                    <img src={game.iconUrl} className="w-full h-full object-cover" alt="Icon" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                        <i className="fas fa-gamepad text-xl text-white/20"></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-2xl font-black text-white italic tracking-tighter drop-shadow-lg leading-none mb-1 group-hover:text-fuchsia-200 transition-colors truncate">{game.name}</h3>
                                                <p className="text-slate-300 text-[10px] line-clamp-1">{game.description}</p>
                                            </div>
                                        </div>
                                        {activeTab === 'EXPLORE' ? (
                                            <button className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2 rounded-full uppercase tracking-wide transition-all border border-white/20">
                                                Inspect
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onSelectGame(game.id); }}
                                                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)] transform hover:scale-110 transition-all"
                                            >
                                                <i className="fas fa-play ml-1"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}


                    </div>
                </div>
            </div>
        </div>
    );
};
