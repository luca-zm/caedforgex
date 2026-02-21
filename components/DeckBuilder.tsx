
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CardData, Deck, GameProject, CardType } from '../types';
import { CardComponent } from './CardComponent';

interface DeckBuilderProps {
    game: GameProject;
    cards: CardData[];
    decks: Deck[];
    onSaveDeck: (deck: Deck) => void;
    onDeleteDeck: (id: string) => void;
    onSelectDeck: (deckId: string) => void;
    activeDeckId: string | null;
    onInspectCard: (card: CardData) => void;
}

// --- SUB-COMPONENTS ---

// 1. Mana Curve Visualization
const ManaCurve = ({ cards }: { cards: CardData[] }) => {
    // Buckets: 0-1, 2, 3, 4, 5, 6+
    const distribution = [0, 0, 0, 0, 0, 0];
    let maxCount = 0;

    cards.forEach(c => {
        const cost = Math.min(Math.max(0, c.cost), 5); // Clamp between 0 and 5 (where 5 is 5+)
        const bucket = cost === 0 || cost === 1 ? 0 : cost === 6 ? 5 : cost - 1;
        // Logic fix: 
        // Bucket 0: Cost 0-1
        // Bucket 1: Cost 2
        // Bucket 2: Cost 3
        // Bucket 3: Cost 4
        // Bucket 4: Cost 5
        // Bucket 5: Cost 6+
        let idx = 0;
        if (c.cost <= 1) idx = 0;
        else if (c.cost === 2) idx = 1;
        else if (c.cost === 3) idx = 2;
        else if (c.cost === 4) idx = 3;
        else if (c.cost === 5) idx = 4;
        else idx = 5;

        distribution[idx]++;
        if (distribution[idx] > maxCount) maxCount = distribution[idx];
    });

    const safeMax = maxCount || 1;

    return (
        <div className="flex items-end gap-1 h-8 w-24 opacity-80">
            {distribution.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end h-full group relative">
                    <div
                        className={`w-full rounded-t-sm transition-all duration-500 ${count > 0 ? 'bg-cyan-400' : 'bg-white/10'}`}
                        style={{ height: `${(count / safeMax) * 100}%`, minHeight: count > 0 ? '2px' : '0' }}
                    ></div>
                </div>
            ))}
        </div>
    );
};

// 2. Tactile Grid Card (Supercell Style)
// Tap = toggle in deck, Long Press (300ms) = inspect/zoom card
const AutoScalingCard = ({ card, count, isSelected, onToggle, onInspect }: any) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const didLongPress = useRef(false);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                setScale(entries[0].contentRect.width / 240);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const handlePointerDown = () => {
        didLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            didLongPress.current = true;
            onInspect(card);
        }, 300);
    };

    const handlePointerUp = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        // Only toggle if it wasn't a long press
        if (!didLongPress.current) {
            onToggle(card.id);
        }
    };

    const handlePointerLeave = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    return (
        <div
            ref={containerRef}
            className="w-full relative group aspect-[240/340] cursor-pointer select-none"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div className={`
                absolute top-0 left-0 origin-top-left transition-all duration-300 ease-out pointer-events-none
                ${isSelected ? '-translate-y-2 drop-shadow-[0_10px_15px_rgba(217,70,239,0.3)]' : 'drop-shadow-md group-hover:-translate-y-1'}
                active:scale-[0.92]
            `} style={{ transform: `scale(${isSelected ? scale * 1.02 : scale})`, width: 240, height: 340 }}>
                <CardComponent card={card} scale={1} staticMode={true} />
            </div>

            {/* Level/Count Badge */}
            {count > 0 && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-cyan-500 rounded-md border-2 border-[#0f0b15] shadow-lg flex items-center justify-center z-20 pointer-events-none">
                    <span className="text-white font-black text-sm drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">x{count}</span>
                </div>
            )}

            {/* Inspect Button (larger for mobile) */}
            <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onInspect(card); }}
                className="absolute top-1 right-1 w-9 h-9 rounded-full bg-black/70 text-white/80 hover:bg-fuchsia-500 hover:text-white flex items-center justify-center z-20 border border-white/20 backdrop-blur-md shadow-lg transition-colors active:scale-90"
            >
                <i className="fas fa-search text-xs"></i>
            </button>
        </div>
    );
};


export const DeckBuilder: React.FC<DeckBuilderProps> = ({
    game, cards, decks, onSaveDeck, onDeleteDeck, onSelectDeck, activeDeckId, onInspectCard
}) => {
    // VIEW STATE: 'LOBBY' (List of decks) or 'EDITOR' (Inside a deck)
    const [viewMode, setViewMode] = useState<'LOBBY' | 'EDITOR'>(activeDeckId ? 'EDITOR' : 'LOBBY');

    // EDITOR STATE
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<CardType | 'ALL'>('ALL');
    const [costFilter, setCostFilter] = useState<number | 'ALL'>('ALL');

    // CREATION STATE
    const [isCreating, setIsCreating] = useState(false);
    const [newDeckName, setNewDeckName] = useState('');

    // Sync internal view mode with prop updates
    useEffect(() => {
        if (activeDeckId) setViewMode('EDITOR');
        else setViewMode('LOBBY');
    }, [activeDeckId]);

    // --- DERIVED DATA ---
    const isGlobalContext = game.id === 'GLOBAL_CORE';
    const displayedDecks = decks.filter(d => d.gameId === game.id);
    const gameCards = cards.filter(c => c.gameId === game.id);
    const currentDeck = decks.find(d => d.id === activeDeckId);
    const deckCards = currentDeck ? currentDeck.cardIds.map(id => gameCards.find(c => c.id === id)).filter(Boolean) as CardData[] : [];

    // --- FILTER LOGIC ---
    const filteredLibrary = useMemo(() => {
        return gameCards.filter(card => {
            // 1. Search
            if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            // 2. Type
            if (typeFilter !== 'ALL' && card.type !== typeFilter) return false;
            // 3. Cost
            if (costFilter !== 'ALL' && card.cost !== costFilter) return false;
            return true;
        });
    }, [gameCards, searchQuery, typeFilter, costFilter]);


    // --- HANDLERS ---

    const handleCreateDeck = () => {
        if (!newDeckName.trim()) return;
        const newDeck: Deck = {
            id: crypto.randomUUID(),
            gameId: game.id,
            name: newDeckName,
            cardIds: []
        };
        onSaveDeck(newDeck);
        setNewDeckName('');
        setIsCreating(false);
        onSelectDeck(newDeck.id); // Auto enter editor
    };

    const toggleCardInDeck = (cardId: string) => {
        if (!currentDeck) return;

        const exists = currentDeck.cardIds.includes(cardId);
        let newCardIds;

        // Logic: If present, remove all copies (or reduce count? Standard builders usually toggle remove one by one or remove all).
        // Let's go with: Tap to ADD. If exists, it adds another copy up to max. 
        // BUT user asked for "Toggle". Let's refine interaction:
        // Tap Library Card -> Add to Deck.
        // Tap Deck Tray Card -> Remove from Deck.

        // Checking constraints
        const currentCopies = currentDeck.cardIds.filter(id => id === cardId).length;
        const maxCopies = game.rules?.constraints?.maxCopiesPerCard || 3;
        const deckSize = currentDeck.cardIds.length;
        const maxDeckSize = game.rules?.constraints?.maxCards || 40;

        if (currentCopies < maxCopies && deckSize < maxDeckSize) {
            newCardIds = [...currentDeck.cardIds, cardId];
            onSaveDeck({ ...currentDeck, cardIds: newCardIds });
        } else {
            // Feedback for full/max
            if (currentCopies >= maxCopies) alert("Max copies reached!");
            else if (deckSize >= maxDeckSize) alert("Deck is full!");
        }
    };

    const removeCardFromDeck = (cardId: string) => {
        if (!currentDeck) return;
        const index = currentDeck.cardIds.lastIndexOf(cardId);
        if (index > -1) {
            const newIds = [...currentDeck.cardIds];
            newIds.splice(index, 1);
            onSaveDeck({ ...currentDeck, cardIds: newIds });
        }
    };

    const getDeckStatus = (deck: Deck) => {
        const min = game.rules?.constraints?.minCards || 0;
        const max = game.rules?.constraints?.maxCards || 99;
        const count = deck.cardIds.length;
        if (count < min) return { label: `Need ${min - count} more`, color: 'text-yellow-400', valid: false };
        if (count > max) return { label: `Remove ${count - max}`, color: 'text-red-400', valid: false };
        return { label: 'Ready for Battle', color: 'text-emerald-400', valid: true };
    };

    // ================= RENDER: LOBBY VIEW =================
    if (viewMode === 'LOBBY') {
        return (
            <div className="h-full flex flex-col bg-[#0f0b15] relative overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="p-6 pb-4 bg-gradient-to-b from-black/60 to-transparent z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <i className={`fas ${isGlobalContext ? 'fa-globe text-cyan-400' : 'fa-layer-group text-fuchsia-400'}`}></i>
                                <span className={`text-[10px] font-bold tracking-widest uppercase ${isGlobalContext ? 'text-cyan-400' : 'text-fuchsia-400'}`}>
                                    {isGlobalContext ? 'Universal Context' : 'Local Context'}
                                </span>
                            </div>
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{isGlobalContext ? 'Armory' : game.name}</h2>
                        </div>
                    </div>
                </div>

                {/* Deck Grid */}
                <div className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Create New Deck Card */}
                        <button
                            onClick={() => setIsCreating(true)}
                            className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-fuchsia-500/50 transition-all flex flex-col items-center justify-center gap-3 group"
                        >
                            <div className="w-14 h-14 rounded-full bg-white/5 group-hover:bg-fuchsia-500 group-hover:text-white text-white/30 flex items-center justify-center transition-colors">
                                <i className="fas fa-plus text-xl"></i>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">New Deck</span>
                        </button>

                        {/* Existing Decks */}
                        {displayedDecks.map(deck => {
                            const status = getDeckStatus(deck);
                            const coverCard = deck.cardIds.length > 0 ? gameCards.find(c => c.id === deck.cardIds[0]) : null;

                            return (
                                <div
                                    key={deck.id}
                                    onClick={() => onSelectDeck(deck.id)}
                                    className="relative aspect-[3/4] rounded-2xl bg-slate-900 border border-white/10 overflow-hidden cursor-pointer group hover:scale-[1.02] transition-transform shadow-xl"
                                >
                                    {/* Cover Image */}
                                    {coverCard ? (
                                        <img src={coverCard.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt="cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                                            <i className="fas fa-box-open text-4xl text-white/10"></i>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

                                    {/* Content */}
                                    <div className="absolute inset-0 p-4 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase backdrop-blur-md border ${status.valid ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'}`}>
                                                {status.valid ? 'Ready' : 'WIP'}
                                            </span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); if (confirm("Delete Deck?")) onDeleteDeck(deck.id); }}
                                                className="w-6 h-6 rounded-full bg-black/40 text-white/50 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
                                            >
                                                <i className="fas fa-trash text-[10px]"></i>
                                            </button>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-white leading-tight mb-1 drop-shadow-md truncate">{deck.name}</h3>
                                            <p className="text-[10px] text-slate-300 font-medium">{deck.cardIds.length} Cards</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Create Modal Overlay */}
                {isCreating && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
                        <div className="w-full max-w-sm bg-[#1a1824] border border-white/20 rounded-2xl p-6 shadow-2xl">
                            <h3 className="text-lg font-black text-white uppercase italic mb-4">Christen Your Deck</h3>
                            <input
                                autoFocus
                                value={newDeckName}
                                onChange={(e) => setNewDeckName(e.target.value)}
                                placeholder="e.g. Aggro Fire"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-fuchsia-500 mb-6"
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setIsCreating(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold uppercase text-xs">Cancel</button>
                                <button onClick={handleCreateDeck} className="flex-1 py-3 rounded-xl bg-fuchsia-600 text-white font-bold uppercase text-xs shadow-lg hover:bg-fuchsia-500">Create</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ================= RENDER: EDITOR VIEW =================
    if (!currentDeck) return null; // Should prevent crash

    const status = getDeckStatus(currentDeck);
    // Group deck cards for the "Tray" to show duplicates cleanly
    const distinctDeckCards = Array.from(new Set(currentDeck.cardIds)).map(id => {
        const card = gameCards.find(c => c.id === id);
        const count = currentDeck.cardIds.filter(cid => cid === id).length;
        return { card, count };
    }).filter(d => d.card) as { card: CardData, count: number }[];


    const maxDeckCards = game.rules?.constraints.maxCards || 40;

    // Expand distinct cards by their count so each physical card gets a slot in the tray
    const fullTrayCards: CardData[] = [];
    distinctDeckCards.forEach(({ card, count }) => {
        for (let i = 0; i < count; i++) {
            fullTrayCards.push(card);
        }
    });

    return (
        <div className="h-full flex flex-col bg-[#0f0b15] relative animate-fadeIn">

            {/* 1. DECK HEADER & TRAY (Sticky Top) */}
            <div className="shrink-0 bg-[#16141c] border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-30">
                {/* Info Bar */}
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => onSelectDeck('')} className="w-9 h-9 active:scale-95 transition-transform rounded-full bg-[#2a2638] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#342f44]">
                            <i className="fas fa-chevron-left text-sm"></i>
                        </button>
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-wider">{currentDeck.name}</h2>
                            <div className={`text-[10px] font-bold uppercase drop-shadow-md ${status.color}`}>
                                {fullTrayCards.length}/{maxDeckCards} • {status.label}
                            </div>
                        </div>
                    </div>
                    {/* Mana Curve Visual */}
                    <ManaCurve cards={deckCards} />
                </div>

                {/* Deck Tray (Horizontal Scroll with Sockets) */}
                <div className="bg-[#0f0b15]/50 py-3 shadow-inner">
                    <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar items-center pb-2">
                        {/* Render exact number of sockets based on max deck size */}
                        {Array.from({ length: maxDeckCards }).map((_, index) => {
                            const filledCard = fullTrayCards[index];

                            return (
                                <div key={index} className="relative shrink-0 w-[51px] h-[72px]">
                                    {/* Empty Socket Base */}
                                    <div className="absolute inset-0 rounded-md bg-[#1a1724] border-2 border-dashed border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"></div>

                                    {/* Filled Card */}
                                    {filledCard && (
                                        <div
                                            onClick={() => removeCardFromDeck(filledCard.id)}
                                            className="absolute inset-0 cursor-pointer hover:-translate-y-1 active:scale-90 transition-all group flex items-center justify-center overflow-visible"
                                        >
                                            <div className="pointer-events-none absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.2125)' }}>
                                                <CardComponent card={filledCard} scale={1} staticMode={true} />
                                            </div>

                                            {/* Remove Overlay */}
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[4px] z-50">
                                                <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-200">
                                                    <i className="fas fa-times text-[10px]"></i>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 2. FILTERS (Sticky below header) */}
            <div className="shrink-0 px-4 py-3 bg-[#0f0b15]/95 backdrop-blur z-20 border-b border-white/5 space-y-3">
                {/* Search */}
                <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search library..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:border-fuchsia-500 outline-none"
                    />
                </div>

                {/* Tags Row */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    <button onClick={() => setTypeFilter('ALL')} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap ${typeFilter === 'ALL' ? 'bg-white text-black border-white' : 'bg-transparent text-slate-500 border-white/10'}`}>All</button>
                    <button onClick={() => setTypeFilter(CardType.UNIT)} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap ${typeFilter === CardType.UNIT ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-transparent text-slate-500 border-white/10'}`}>Units</button>
                    <button onClick={() => setTypeFilter(CardType.SPELL)} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap ${typeFilter === CardType.SPELL ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'bg-transparent text-slate-500 border-white/10'}`}>Spells</button>
                    <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
                    {[1, 2, 3, 4, 5].map(cost => (
                        <button
                            key={cost}
                            onClick={() => setCostFilter(costFilter === cost ? 'ALL' : cost)}
                            className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center border ${costFilter === cost ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-transparent text-slate-500 border-white/10'}`}
                        >
                            {cost}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. CARD LIBRARY GRID (4 Columns) */}
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 no-scrollbar bg-black/20">
                {filteredLibrary.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                        <i className="fas fa-filter text-2xl mb-2"></i>
                        <p className="text-xs uppercase font-bold">No cards match filters</p>
                    </div>
                )}

                <div className="grid grid-cols-5 gap-2">
                    {filteredLibrary.map(card => {
                        const count = currentDeck.cardIds.filter(id => id === card.id).length;
                        return (
                            <AutoScalingCard
                                key={card.id}
                                card={card}
                                count={count}
                                isSelected={count > 0}
                                onToggle={toggleCardInDeck}
                                onInspect={onInspectCard}
                            />
                        );
                    })}
                </div>
            </div>

        </div>
    );
};
