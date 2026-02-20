
import React, { useState } from 'react';
import { CardData, CardType, GameProject, Deck } from '../types';
import { generateCardArt, generateCardFluff } from '../services/geminiService';
import { CardComponent } from './CardComponent';

interface CardCreatorProps {
    game: GameProject;
    decks: Deck[];
    onSave: (card: CardData, deckId?: string) => void;
}

type PanelMode = 'MINIMIZED' | 'DEFAULT' | 'EXPANDED';

export const CardCreator: React.FC<CardCreatorProps> = ({ game, decks, onSave }) => {
    const [loadingArt, setLoadingArt] = useState(false);
    const [loadingText, setLoadingText] = useState(false);
    const [imagePrompt, setImagePrompt] = useState('');
    const [targetDeckId, setTargetDeckId] = useState<string>("");
    const [activeTab, setActiveTab] = useState<'stats' | 'art' | 'lore'>('stats');

    // Replaces simple boolean with 3-state mode
    const [panelMode, setPanelMode] = useState<PanelMode>('DEFAULT');

    // Strict filter
    const gameDecks = decks.filter(d => d.gameId === game.id);

    const [card, setCard] = useState<CardData>({
        id: '',
        gameId: game.id,
        name: 'New Card',
        type: CardType.UNIT,
        cost: 1,
        attack: 2,
        health: 2,
        description: 'No ability.',
        imageUrl: '',
        createdAt: Date.now(),
    });

    const handleGenerateArt = async () => {
        if (!imagePrompt && card.name === 'New Card') return;
        setLoadingArt(true);
        try {
            const promptToUse = imagePrompt || card.name;
            const imageUrl = await generateCardArt(promptToUse, game.artStyle);
            setCard(prev => ({ ...prev, imageUrl }));
        } catch (e: any) {
            alert(`Art Gen Failed: ${e.message}`);
        } finally {
            setLoadingArt(false);
        }
    };

    const handleGenerateFluff = async () => {
        setLoadingText(true);
        try {
            const desc = await generateCardFluff(card.name, card.type, game.name);
            setCard(prev => ({ ...prev, description: desc }));
        } catch (e: any) {
            alert(`Text Gen Failed: ${e.message}`);
        } finally {
            setLoadingText(false);
        }
    };

    const handleSave = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        // Validation
        if (!card.name || card.name === 'New Card') {
            alert("Please give your card a unique name.");
            setActiveTab('stats');
            setPanelMode('DEFAULT');
            return;
        }

        if (!card.imageUrl) {
            alert("Card cannot be forged without visualization (Image). Please generate artwork first.");
            setActiveTab('art');
            setPanelMode('DEFAULT');
            return;
        }

        const newCard = { ...card, id: crypto.randomUUID(), gameId: game.id, createdAt: Date.now() };
        onSave(newCard, targetDeckId || undefined);

        // Soft Reset
        setCard(prev => ({
            ...prev,
            id: '',
            name: 'New Card',
            imageUrl: '',
            description: 'No ability.'
        }));
        setImagePrompt('');
        setPanelMode('DEFAULT');
    };

    // Logic to determine visual state of the card container
    const getCardContainerClass = () => {
        switch (panelMode) {
            case 'EXPANDED': return 'scale-75 opacity-40 blur-[2px] translate-y-[-20%]';
            case 'MINIMIZED': return 'scale-100 opacity-100 translate-y-[-12%] z-20'; // Lifted higher (-12%) so stats aren't covered
            default: return 'scale-100 opacity-100';
        }
    };

    const handleHeaderClick = () => {
        if (panelMode === 'MINIMIZED') setPanelMode('DEFAULT');
        else if (panelMode === 'DEFAULT') setPanelMode('EXPANDED');
        else setPanelMode('DEFAULT');
    };

    return (
        <div className="h-full flex flex-col bg-[#0f0b15] relative overflow-hidden">

            {/* Background Ambient Light */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-purple-900/30 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-900/30 blur-[100px] rounded-full pointer-events-none"></div>

            {/* 1. VIEWPORT AREA (Top Half) - 3D Card Display */}
            <div
                className={`flex-1 relative flex items-center justify-center z-10 perspective-1000 py-6 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${getCardContainerClass()}`}
                onClick={() => setPanelMode('MINIMIZED')} // Click background to admire card
            >
                {/* QUICK DECK SELECTOR (Top Right Floating) */}
                {gameDecks.length > 0 && panelMode !== 'MINIMIZED' && (
                    <div className="absolute top-4 right-4 z-40 flex flex-col items-end animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 mb-1 bg-black/40 px-2 py-0.5 rounded backdrop-blur-md border border-white/5">
                            <i className="fas fa-save text-[9px] text-fuchsia-400"></i>
                            <label className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">
                                Save Destination
                            </label>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-fuchsia-500/20 blur-md rounded-full group-hover:bg-fuchsia-500/40 transition-all"></div>
                            <select
                                value={targetDeckId}
                                onChange={(e) => setTargetDeckId(e.target.value)}
                                className="relative bg-black/60 backdrop-blur-xl border border-white/20 text-white text-xs font-bold rounded-full pl-4 pr-10 py-2.5 appearance-none outline-none focus:border-fuchsia-500 transition-all cursor-pointer hover:bg-white/10 shadow-xl w-48 text-right"
                            >
                                <option value="">Library Only (Default)</option>
                                {gameDecks.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                            <i className="fas fa-chevron-down absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-white/50 pointer-events-none"></i>
                        </div>
                    </div>
                )}

                <div className="relative z-20 transition-all duration-500 hover:scale-105 cursor-pointer">
                    {/* Increased scale from 1.05 to 1.2 for better visibility in Forge */}
                    <CardComponent card={card} scale={1.2} />

                    {/* Loading Overlay */}
                    {(loadingArt || loadingText) && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                            <div className="w-16 h-16 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin filter drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. CONTROL DECK (Bottom Slider) */}
            <div
                className={`
                absolute transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) glass-panel shadow-[0_-10px_60px_rgba(0,0,0,0.8)] border-white/15 flex flex-col
                ${panelMode === 'MINIMIZED'
                        ? 'bottom-28 left-4 right-4 h-16 rounded-full bg-black/90 border-fuchsia-500/50 z-50'
                        : panelMode === 'EXPANDED'
                            ? 'bottom-0 left-0 right-0 h-[92%] rounded-t-[25px] border-t z-[70] bg-[#141218]/95 backdrop-blur-xl' // EXPANDED: Almost full screen (92%)
                            : 'bottom-0 left-0 right-0 h-[55vh] rounded-t-[35px] border-t z-50' // DEFAULT: Anchored to bottom-0, taller height (55vh) to cover gap
                    }
            `}
            >
                {/* Action Bar (Floating above panel header) - Hidden when minimized */}
                <div className={`absolute -top-6 left-0 right-0 flex justify-center gap-4 z-40 pointer-events-none transition-all duration-300 ${panelMode === 'MINIMIZED' ? 'opacity-0 translate-y-10' : 'opacity-100'}`}>
                    <button
                        onClick={handleSave}
                        className={`${panelMode === 'MINIMIZED' ? 'pointer-events-none' : 'pointer-events-auto'} bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-black text-sm uppercase tracking-wider px-8 py-3 rounded-full shadow-[0_4px_15px_rgba(16,185,129,0.5)] hover:scale-110 transition-transform active:scale-95 flex items-center gap-2`}
                    >
                        <i className="fas fa-check"></i> Save Card
                    </button>
                </div>

                {/* Handle / Header - Click to Toggle */}
                <div
                    onClick={handleHeaderClick}
                    className="w-full h-full flex items-center justify-between px-8 cursor-pointer group shrink-0 relative hover:bg-white/5 transition-colors"
                    style={{ maxHeight: panelMode === 'MINIMIZED' ? '100%' : '56px', minHeight: '56px' }} // Added minHeight for stability
                >
                    {/* Minimized State Content (The Pill Content) */}
                    {panelMode === 'MINIMIZED' ? (
                        <div className="w-full flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/50 animate-pulse">
                                    <i className="fas fa-hammer text-fuchsia-400 text-xs"></i>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-widest">Editor Hidden</span>
                                    <span className="text-[9px] text-slate-500">Tap to resume forging</span>
                                </div>
                            </div>
                            <i className="fas fa-chevron-up text-white/50"></i>
                        </div>
                    ) : (
                        <>
                            {/* Eye Button (Minimize) */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setPanelMode('MINIMIZED'); }}
                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                            >
                                <i className="fas fa-eye text-xs"></i>
                            </button>

                            {/* Center Grip */}
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-1 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors mb-1"></div>
                                <i className={`fas fa-chevron-up text-[10px] text-white/30 transition-transform duration-500 ${panelMode === 'EXPANDED' ? 'rotate-180' : ''}`}></i>
                            </div>

                            {/* Spacer for layout balance */}
                            <div className="w-8"></div>
                        </>
                    )}
                </div>

                {/* Content Container - Fades out when minimized */}
                <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${panelMode === 'MINIMIZED' ? 'opacity-0 h-0 pointer-events-none' : 'opacity-100'}`}>

                    {/* Tabs */}
                    <div className="flex justify-center gap-2 sm:gap-8 mb-4 border-b border-white/5 pb-2 px-6 shrink-0">
                        <button onClick={() => setActiveTab('stats')} className={`flex-1 sm:flex-none text-sm font-bold uppercase tracking-widest pb-2 transition-all ${activeTab === 'stats' ? 'text-fuchsia-400 border-b-2 border-fuchsia-400' : 'text-slate-500'}`}>Stats</button>
                        <button onClick={() => setActiveTab('art')} className={`flex-1 sm:flex-none text-sm font-bold uppercase tracking-widest pb-2 transition-all ${activeTab === 'art' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500'}`}>Art</button>
                        <button onClick={() => setActiveTab('lore')} className={`flex-1 sm:flex-none text-sm font-bold uppercase tracking-widest pb-2 transition-all ${activeTab === 'lore' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-slate-500'}`}>Lore</button>
                    </div>

                    {/* Scrollable Form Area */}
                    <div className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar relative">

                        {/* === STATS TAB === */}
                        {activeTab === 'stats' && (
                            <div className="space-y-6 animate-fadeIn pb-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">Name</label>
                                    <input
                                        type="text"
                                        maxLength={24}
                                        value={card.name}
                                        onChange={(e) => setCard({ ...card, name: e.target.value })}
                                        className="w-full gaming-input px-4 py-4 font-bold text-xl bg-black/40"
                                    />
                                    {/* Soulbound Indicator */}
                                    <div className="flex items-center gap-2 mt-1 pl-1">
                                        <i className="fas fa-link text-xs text-fuchsia-600"></i>
                                        <span className="text-[9px] font-bold text-fuchsia-600 uppercase tracking-widest">Soulbound to: {game.name}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">Type</label>
                                        <div className="relative">
                                            <select
                                                value={card.type}
                                                onChange={(e) => setCard({ ...card, type: e.target.value as CardType })}
                                                className="w-full gaming-input px-4 py-3 font-medium appearance-none bg-black/40"
                                            >
                                                {Object.values(CardType).map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-500">
                                                <i className="fas fa-chevron-down text-xs"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider pl-1">Mana Cost</label>
                                        <input
                                            type="number"
                                            value={card.cost}
                                            onChange={(e) => setCard({ ...card, cost: Number(e.target.value) })}
                                            className="w-full gaming-input px-4 py-3 font-black text-cyan-400 text-center text-lg bg-black/40"
                                        />
                                    </div>
                                </div>

                                {card.type === CardType.UNIT && (
                                    <div className="grid grid-cols-2 gap-4 p-5 bg-black/30 rounded-2xl border border-white/5 shadow-inner">
                                        <div className="text-center space-y-3">
                                            <label className="block text-[10px] text-red-400 font-bold uppercase tracking-wider"><i className="fas fa-skull mr-1"></i> Attack</label>
                                            <div className="flex items-center justify-center gap-4">
                                                <button onClick={() => setCard({ ...card, attack: (card.attack || 0) - 1 })} className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-red-900 active:scale-95 transition-all text-white font-bold border border-white/10 shadow-lg">-</button>
                                                <span className="text-3xl font-black text-white w-12">{card.attack}</span>
                                                <button onClick={() => setCard({ ...card, attack: (card.attack || 0) + 1 })} className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-red-900 active:scale-95 transition-all text-white font-bold border border-white/10 shadow-lg">+</button>
                                            </div>
                                        </div>
                                        <div className="text-center space-y-3">
                                            <label className="block text-[10px] text-green-400 font-bold uppercase tracking-wider"><i className="fas fa-shield-alt mr-1"></i> Health</label>
                                            <div className="flex items-center justify-center gap-4">
                                                <button onClick={() => setCard({ ...card, health: (card.health || 0) - 1 })} className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-green-900 active:scale-95 transition-all text-white font-bold border border-white/10 shadow-lg">-</button>
                                                <span className="text-3xl font-black text-white w-12">{card.health}</span>
                                                <button onClick={() => setCard({ ...card, health: (card.health || 0) + 1 })} className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-green-900 active:scale-95 transition-all text-white font-bold border border-white/10 shadow-lg">+</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* === ART TAB === */}
                        {activeTab === 'art' && (
                            <div className="space-y-6 animate-fadeIn pb-10">
                                {/* Visual Synth Console */}
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-cyan-500/10 rounded-2xl blur-lg group-hover:bg-cyan-500/20 transition-all"></div>
                                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-1 rounded-2xl relative z-10 group-focus-within:border-cyan-500/50 transition-colors duration-300">
                                        <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-t-xl border-b border-white/5">
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-terminal text-cyan-400 text-xs"></i>
                                                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Visual Synth</span>
                                            </div>
                                            <div className="px-2 py-0.5 rounded bg-cyan-900/40 border border-cyan-500/30 text-[9px] font-bold text-cyan-300 uppercase">
                                                {game.artStyle}
                                            </div>
                                        </div>
                                        <textarea
                                            value={imagePrompt}
                                            onChange={(e) => setImagePrompt(e.target.value)}
                                            placeholder={`>> Describe ${card.name} visual data...\n>> E.g. "A glowing knight holding a sword of fire"`}
                                            className="w-full bg-transparent border-none p-4 text-sm text-cyan-50 font-mono placeholder-cyan-900/50 h-32 resize-none focus:ring-0 leading-relaxed"
                                        />
                                        {/* Decorative Corner */}
                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/30 rounded-br-lg m-2"></div>
                                    </div>
                                </div>

                                {/* Action Area */}
                                <div className="space-y-3">
                                    <button
                                        onClick={handleGenerateArt}
                                        disabled={loadingArt}
                                        className="w-full relative overflow-hidden bg-cyan-600 rounded-xl py-4 group hover:bg-cyan-500 transition-colors active:scale-[0.98]"
                                    >
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                                        <div className="relative flex items-center justify-center gap-3">
                                            {loadingArt ? (
                                                <i className="fas fa-circle-notch fa-spin text-white"></i>
                                            ) : (
                                                <>
                                                    <i className="fas fa-magic text-white text-lg group-hover:rotate-12 transition-transform"></i>
                                                    <span className="font-black text-white uppercase tracking-widest text-sm">Initialize Render</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-50"></div>
                                    </button>
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Credits: Gemini 2.5 + Nano</span>
                                        <i className="fas fa-wifi text-slate-600 text-xs"></i>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* === LORE TAB === */}
                        {activeTab === 'lore' && (
                            <div className="space-y-6 animate-fadeIn pb-10">
                                {/* Narrative Console */}
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-yellow-500/10 rounded-2xl blur-lg group-hover:bg-yellow-500/20 transition-all"></div>
                                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-1 rounded-2xl relative z-10 group-focus-within:border-yellow-500/50 transition-colors duration-300">
                                        <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-t-xl border-b border-white/5">
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-book-sparkles text-yellow-400 text-xs"></i>
                                                <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Card Chronicle</span>
                                            </div>
                                            <div className="px-2 py-0.5 rounded bg-yellow-900/40 border border-yellow-500/30 text-[9px] font-bold text-yellow-300 uppercase">
                                                TEXT
                                            </div>
                                        </div>
                                        <textarea
                                            value={card.description}
                                            onChange={(e) => setCard({ ...card, description: e.target.value })}
                                            className="w-full bg-transparent border-none p-4 text-sm text-yellow-50 font-serif leading-relaxed h-48 resize-none focus:ring-0 placeholder-yellow-900/50"
                                            placeholder="Enter card ability text or flavor lore..."
                                        />
                                        {/* Decorative Corner */}
                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-500/30 rounded-bl-lg m-2"></div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};
