
import React, { useState, useEffect, useRef } from 'react';
import { CardData, Deck, GameProject, CardType, GameRules, BoardInstance } from '../types';
import { CardComponent } from './CardComponent';
import { Scoreboard } from './Scoreboard';
import { storageService } from '../services/storageService';
import { generateBoardArt } from '../services/geminiService';

interface GameTableProps {
    game: GameProject;
    cards: CardData[];
    decks: Deck[];
}

type PlayState = 'LOBBY' | 'SEARCHING' | 'GAME';

export const GameTable: React.FC<GameTableProps> = ({ game, cards, decks }) => {
    const [playState, setPlayState] = useState<PlayState>('LOBBY');
    const [selectedDeckId, setSelectedDeckId] = useState<string>('');
    const [useGlobalDecks, setUseGlobalDecks] = useState(false);
    const [playerName, setPlayerName] = useState('Player 1');
    const [lobbyBg, setLobbyBg] = useState(game.boardTheme?.backgroundUrl || '');
    const [showDeckSelector, setShowDeckSelector] = useState(false);
    const [showScoreboard, setShowScoreboard] = useState(false);

    // CLASH ROYALE UX STATE
    const arenas = [
        { id: 'cpu', name: 'Training Camp', desc: 'VS CPU', bg: '/arenas/arena_training_bg.png', cardBg: '/arenas/arena_training_card.png' },
        { id: 'pvp', name: 'Arena 1', desc: 'LOCAL PVP', bg: '/arenas/arena_1_bg.png', cardBg: '/arenas/arena_1_card.png' }
    ];
    const [selectedArenaIdx, setSelectedArenaIdx] = useState(0);
    const [activeRules] = useState<GameRules>(game.rules || {
        initialHealth: 20,
        resourceType: 'MANA_RAMP',
        maxResource: 10,
        startingResource: 1,
        cardsPerTurn: 1,
        startingHandSize: 5,
        winCondition: 'REDUCE_HEALTH',
        boardType: 'NONE',
        fullText: '',
        constraints: { minCards: 10, maxCards: 60, allowedTypes: [], maxCopiesPerCard: 3 },
        multiplayerMode: 'CASUAL'
    });

    // GAME STATE
    const [turn, setTurn] = useState(0);

    // Player Stats
    const [mana, setMana] = useState(0);
    const [maxMana, setMaxMana] = useState(0);
    const [playerHealth, setPlayerHealth] = useState(20);
    const [hand, setHand] = useState<string[]>([]);
    const [library, setLibrary] = useState<string[]>([]);
    const [graveyard, setGraveyard] = useState<string[]>([]);

    // CPU Stats
    const [opponentHealth, setOpponentHealth] = useState(20);
    const [opponentMana, setOpponentMana] = useState(0);
    const [opponentMaxMana, setOpponentMaxMana] = useState(0);
    const [opponentHand, setOpponentHand] = useState<string[]>([]);
    const [opponentLibrary, setOpponentLibrary] = useState<string[]>([]);

    const [isTurnTransitioning, setIsTurnTransitioning] = useState(false);
    const [board, setBoard] = useState<BoardInstance[]>([]);

    // Interaction State
    const [targetingSourceId, setTargetingSourceId] = useState<string | null>(null);

    // Async Data for Global Decks
    const [globalDecks, setGlobalDecks] = useState<Deck[]>([]);
    const [globalCards, setGlobalCards] = useState<CardData[]>([]);

    // Load Global Data if requested
    useEffect(() => {
        const loadGlobal = async () => {
            if (useGlobalDecks && globalDecks.length === 0) {
                const d = await storageService.getDecks('GLOBAL_CORE');
                const c = await storageService.getCards('GLOBAL_CORE');
                setGlobalDecks(d);
                setGlobalCards(c);
            }
        };
        loadGlobal();
    }, [useGlobalDecks]);

    // Combined pools
    const activeDecks = useGlobalDecks ? globalDecks : decks.filter(d => d.gameId === game.id);
    const activeCards = useGlobalDecks ? globalCards : cards;

    // Auto-select first deck
    useEffect(() => {
        if (activeDecks.length > 0) {
            const currentExists = activeDecks.find(d => d.id === selectedDeckId);
            if (!currentExists) setSelectedDeckId(activeDecks[0].id);
        } else {
            setSelectedDeckId('');
        }
    }, [activeDecks, selectedDeckId]);

    const getCardData = (id: string, searchGlobalFirst = false) => {
        // Helper to find card data. If CPU is playing, we might need to search Global list
        let c = activeCards.find(c => c.id === id);
        if (!c) c = globalCards.find(c => c.id === id); // Fallback for CPU cards
        return c;
    };

    const isDeckValid = (deck: Deck): boolean => {
        const constraints = activeRules.constraints;
        if (!constraints) return true;
        if (deck.cardIds.length < constraints.minCards) return false;
        if (deck.cardIds.length > constraints.maxCards) return false;
        return true;
    };

    const handleStartSearch = async () => {
        if (!selectedDeckId) return;
        if (!playerName.trim()) { alert("Enter your name commander!"); return; }
        setPlayState('SEARCHING');

        // Ensure we have the CPU Starter cards loaded for the opponent
        if (globalDecks.length === 0) {
            const d = await storageService.getDecks('GLOBAL_CORE');
            const c = await storageService.getCards('GLOBAL_CORE');
            setGlobalDecks(d);
            setGlobalCards(c);
        }

        // Simulate Search Delay
        setTimeout(() => {
            const deck = activeDecks.find(d => d.id === selectedDeckId);
            if (deck) {
                startGame(deck);
                setPlayState('GAME');
            } else {
                setPlayState('LOBBY');
            }
        }, 2000);
    };

    // --- INITIALIZATION ---
    const startGame = (playerDeck: Deck) => {
        // 1. Setup Player
        const pShuffled = [...playerDeck.cardIds].sort(() => Math.random() - 0.5);
        const startSize = activeRules.startingHandSize;

        setHand(pShuffled.slice(0, startSize));
        setLibrary(pShuffled.slice(startSize));
        setPlayerHealth(activeRules.initialHealth);

        // 2. Setup CPU (Use "cpu-starter-deck" or generic 20 cards if not found)
        let cpuDeckIds: string[] = [];
        const cpuDeck = globalDecks.find(d => d.id === 'cpu-starter-deck');
        if (cpuDeck) {
            cpuDeckIds = [...cpuDeck.cardIds];
        } else {
            // Fallback: Use first 20 global cards found
            cpuDeckIds = globalCards.slice(0, 20).map(c => c.id);
        }

        const cpuShuffled = cpuDeckIds.sort(() => Math.random() - 0.5);
        setOpponentHand(cpuShuffled.slice(0, startSize));
        setOpponentLibrary(cpuShuffled.slice(startSize));
        setOpponentHealth(activeRules.initialHealth);

        // 3. Common
        setBoard([]);
        setGraveyard([]);
        setTurn(1);

        if (activeRules.resourceType === 'FIXED_ENERGY') {
            setMana(activeRules.maxResource);
            setMaxMana(activeRules.maxResource);
            setOpponentMana(activeRules.maxResource);
            setOpponentMaxMana(activeRules.maxResource);
        } else {
            setMana(activeRules.startingResource);
            setMaxMana(activeRules.startingResource);
            setOpponentMana(activeRules.startingResource);
            setOpponentMaxMana(activeRules.startingResource);
        }

        setIsTurnTransitioning(false);
    };

    // --- PLAYER ACTIONS ---

    const drawCard = (target: 'PLAYER' | 'CPU', count: number = 1) => {
        if (target === 'PLAYER') {
            setLibrary(prevLib => {
                if (prevLib.length === 0) return prevLib;
                const available = Math.min(count, prevLib.length);
                const drawn = prevLib.slice(0, available);
                setHand(prevHand => [...prevHand, ...drawn]);
                return prevLib.slice(available);
            });
        } else {
            setOpponentLibrary(prevLib => {
                if (prevLib.length === 0) return prevLib;
                const available = Math.min(count, prevLib.length);
                const drawn = prevLib.slice(0, available);
                setOpponentHand(prevHand => [...prevHand, ...drawn]);
                return prevLib.slice(available);
            });
        }
    };

    const playCard = (cardId: string, indexInHand: number, owner: 'PLAYER' | 'CPU') => {
        const card = getCardData(cardId);
        if (!card) return;

        if (owner === 'PLAYER') {
            if (isTurnTransitioning) return;
            if (card.cost > mana) { alert("Not enough Mana!"); return; }

            setMana(p => p - card.cost);
            setHand(p => p.filter((_, i) => i !== indexInHand));
        } else {
            setOpponentMana(p => p - card.cost);
            setOpponentHand(p => p.filter((_, i) => i !== indexInHand));
        }

        // Resolve Logic
        if (card.type === CardType.UNIT) {
            const newUnit: BoardInstance = {
                instanceId: crypto.randomUUID(),
                cardId,
                owner,
                tapped: false, x: 0, y: 0,
                currentHealth: card.health || 1,
                currentAttack: card.attack || 0,
                summoningSickness: true
            };
            // Haste Logic
            if (card.description.toLowerCase().includes("haste")) newUnit.summoningSickness = false;

            setBoard(prev => [...prev, newUnit]);

            // On Play Effect
            resolveEffect(card.description, owner, newUnit.instanceId);

        } else if (card.type === CardType.SPELL) {
            resolveEffect(card.description, owner);
            // Add to graveyard visual?
        } else if (card.type === CardType.LAND) {
            if (activeRules.resourceType === 'MANA_RAMP') {
                if (owner === 'PLAYER') {
                    setMaxMana(p => Math.min(p + 1, activeRules.maxResource));
                    setMana(p => Math.min(p + 1, activeRules.maxResource));
                } else {
                    setOpponentMaxMana(p => Math.min(p + 1, activeRules.maxResource));
                    setOpponentMana(p => Math.min(p + 1, activeRules.maxResource));
                }
            }
            setBoard(prev => [...prev, {
                instanceId: crypto.randomUUID(), cardId, owner, tapped: false, x: 0, y: 0,
                currentHealth: 1, currentAttack: 0, summoningSickness: true
            }]);
        } else {
            // Artifact
            const art: BoardInstance = {
                instanceId: crypto.randomUUID(), cardId, owner, tapped: false, x: 0, y: 0,
                currentHealth: 5, currentAttack: 0, summoningSickness: true
            };
            setBoard(prev => [...prev, art]);
            resolveEffect(card.description, owner, art.instanceId);
        }
    };

    // --- EFFECT ENGINE (Dual Target Support) ---
    const resolveEffect = (text: string, caster: 'PLAYER' | 'CPU', sourceInstanceId?: string) => {
        const desc = text.toLowerCase();

        // DRAW
        if (desc.includes("draw")) {
            const match = desc.match(/draw (\d+)/);
            const count = match ? parseInt(match[1]) : 1;
            drawCard(caster, count);
        }

        // HEAL
        if (desc.includes("heal")) {
            const match = desc.match(/heal (\d+)/);
            const amount = match ? parseInt(match[1]) : 3;
            if (caster === 'PLAYER') setPlayerHealth(p => p + amount);
            else setOpponentHealth(p => p + amount);
        }

        // DAMAGE (Direct)
        if (desc.includes("damage")) {
            const match = desc.match(/damage (\d+)/);
            const amount = match ? parseInt(match[1]) : 3;
            dealDamage(caster === 'PLAYER' ? 'CPU' : 'PLAYER', amount);
        }

        // BUFF (Self +1/+1)
        if (sourceInstanceId && (desc.includes("buff") || desc.includes("grow"))) {
            setBoard(prev => prev.map(b =>
                b.instanceId === sourceInstanceId
                    ? { ...b, currentAttack: b.currentAttack + 1, currentHealth: b.currentHealth + 1 }
                    : b
            ));
        }
    };

    const dealDamage = (target: 'PLAYER' | 'CPU', amount: number) => {
        if (target === 'PLAYER') setPlayerHealth(p => Math.max(0, p - amount));
        else setOpponentHealth(p => Math.max(0, p - amount));
    };

    // --- CPU AI LOGIC ---
    const executeCPUTurn = async () => {
        // 1. START PHASE: Untap & Resources
        setBoard(prev => prev.map(b => b.owner === 'CPU' ? { ...b, tapped: false, summoningSickness: false } : b));

        if (activeRules.resourceType === 'FIXED_ENERGY') {
            setOpponentMaxMana(activeRules.maxResource);
            setOpponentMana(activeRules.maxResource);
        } else {
            setOpponentMaxMana(prev => Math.min(prev + 1, activeRules.maxResource));
            setOpponentMana(prev => Math.min(prev + 1, activeRules.maxResource) + 1); // +1 from potential land ramp logic simplified
            // Fix: Actually set mana to Max
            setOpponentMana(prev => prev + 1); // Temp visual
        }

        // Force sync mana to max for simple AI logic
        // We need to use functional updates to ensure we have the latest Max
        let currentAiMana = 0;
        setOpponentMaxMana(max => {
            setOpponentMana(max);
            currentAiMana = max;
            return max;
        });

        // 2. DRAW PHASE
        drawCard('CPU', activeRules.cardsPerTurn);

        await new Promise(r => setTimeout(r, 800)); // Thinking...

        // 3. MAIN PHASE (Play Cards)
        // We need to access the LATEST state. In React functional components, this is tricky inside setTimeout.
        // We will cheat slightly by passing a function to state setters or using Refs, but here we'll simplify:
        // We iterate the hand state available at closure time? No, that's stale.
        // We must implement a recursive play function or use Refs. Let's use a simple approach:

        setOpponentHand(currentHand => {
            // AI LOGIC: Find playable cards
            let tempHand = [...currentHand];
            let tempMana = currentAiMana;

            // Sort by cost descending (Big plays first)
            // We need card data.
            const playableIndices: number[] = [];

            // Simple loop to find what to play
            // Since we can't do async inside this setter easily without side effects, 
            // we'll just determine WHAT to play and trigger `playCard` via a useEffect or separate trigger.
            // Actually, let's just trigger one play per "tick" to animate it.
            return currentHand;
        });

        // BETTER AI IMPLEMENTATION:
        // We'll perform one action at a time with delays.
        // 1. Play Units/Spells
        // 2. Attack

        // Accessing state via functional updates for logic is hard. 
        // Let's use a "Phase" effect? No, too complex.
        // Let's just blindly try to play the first 3 cards in hand if affordable.

        // TRIGGER: AI ATTACK
        setBoard(boardState => {
            const cpuUnits = boardState.filter(b => b.owner === 'CPU' && !b.tapped && !b.summoningSickness);
            cpuUnits.forEach(unit => {
                // ATTACK FACE
                setPlayerHealth(h => h - unit.currentAttack);
                // Visual Tap
                unit.tapped = true;
                triggerShake(unit.instanceId);
            });
            return [...boardState]; // Trigger re-render
        });

        // TRIGGER: AI PLAY CARDS (Simplified: Just add random unit from hand if mana permits)
        // In a real app, use a proper state machine. Here, we simulate playing *one* card.
        setOpponentHand(h => {
            if (h.length > 0) {
                const cardId = h[0];
                const cData = getCardData(cardId);
                if (cData) {
                    // Play it for free (AI cheating slightly for smoothness) or assume mana check passed
                    // To do it right:
                    playCard(cardId, 0, 'CPU');
                    // This call updates state, so we return the unfiltered hand here, 
                    // allowing playCard to filter it. BUT playCard expects index.
                    // So we return h, and playCard handles the rest.
                }
            }
            return h;
        });

        // End AI Turn
        await new Promise(r => setTimeout(r, 1000));

        // 4. PLAYER START TURN
        setTurn(t => t + 1);
        setBoard(prev => prev.map(b => b.owner === 'PLAYER' ? { ...b, tapped: false, summoningSickness: false } : b));

        if (activeRules.resourceType === 'FIXED_ENERGY') {
            setMaxMana(activeRules.maxResource);
            setMana(activeRules.maxResource);
        } else {
            setMaxMana(p => Math.min(p + 1, activeRules.maxResource));
            setMana(p => Math.min(p + 1, activeRules.maxResource));
        }
        drawCard('PLAYER', activeRules.cardsPerTurn);

        setIsTurnTransitioning(false);
    };

    const handlePassTurn = () => {
        if (isTurnTransitioning) return;
        setIsTurnTransitioning(true);
        executeCPUTurn();
    };

    // --- COMBAT ---
    const handleCombatAction = (instance: BoardInstance, action: 'FACE' | 'STRIKE') => {
        if (isTurnTransitioning) return;
        if (instance.tapped || instance.summoningSickness) return;

        // Tap Attacker
        setBoard(prev => prev.map(b => b.instanceId === instance.instanceId ? { ...b, tapped: true } : b));
        const cardData = getCardData(instance.cardId);

        if (action === 'FACE') {
            dealDamage('CPU', instance.currentAttack);
            triggerShake(instance.instanceId);
            if (cardData && cardData.description.toLowerCase().includes("attack")) resolveEffect(cardData.description, 'PLAYER', instance.instanceId);

        } else if (action === 'STRIKE') {
            setTargetingSourceId(instance.instanceId);
        }
    };

    const resolveUnitCombat = (targetInstanceId: string) => {
        if (!targetingSourceId) return;

        const attacker = board.find(b => b.instanceId === targetingSourceId);
        const defender = board.find(b => b.instanceId === targetInstanceId);

        if (attacker && defender && attacker.instanceId !== defender.instanceId) {
            if (attacker.owner === defender.owner) { alert("Friendly Fire!"); setTargetingSourceId(null); return; }

            applyDamage(defender.instanceId, attacker.currentAttack);
            applyDamage(attacker.instanceId, defender.currentAttack);

            triggerShake(attacker.instanceId);
            triggerShake(defender.instanceId);
        }
        setTargetingSourceId(null);
    };

    const applyDamage = (instanceId: string, amount: number) => {
        setBoard(prev => {
            const updated = prev.map(b => {
                if (b.instanceId !== instanceId) return b;
                return { ...b, currentHealth: b.currentHealth - amount, damageIndicator: amount };
            });

            // Clear damage number after delay
            setTimeout(() => {
                setBoard(curr => curr.map(cb => cb.instanceId === instanceId ? { ...cb, damageIndicator: null } : cb));
            }, 1000);

            // Remove Dead Units
            const deaths = updated.filter(b => b.currentHealth <= 0);
            if (deaths.length > 0) {
                setGraveyard(g => [...g, ...deaths.map(d => d.cardId)]);
                return updated.filter(b => b.currentHealth > 0);
            }
            return updated;
        });
    };

    const triggerShake = (id: string) => {
        setBoard(prev => prev.map(b => b.instanceId === id ? { ...b, shake: true } : b));
        setTimeout(() => setBoard(prev => prev.map(b => b.instanceId === id ? { ...b, shake: false } : b)), 500);
    };

    // --- RENDER ---
    const playmatUrl = game.boardTheme?.backgroundUrl
        ? `url('${game.boardTheme.backgroundUrl}')`
        : "url('https://www.transparenttextures.com/patterns/dark-matter.png')";
    const bgSize = game.boardTheme?.backgroundUrl ? 'cover' : 'auto';

    // Lobby & Matching logic omitted for brevity (same as previous) but keeping essential structure
    if (playState === 'SEARCHING') {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-black relative">
                <h2 className="text-white animate-pulse">CONNECTING TO CPU...</h2>
            </div>
        )
    }
    if (playState === 'LOBBY') {
        const selectedDeck = activeDecks.find(d => d.id === selectedDeckId);
        const isValid = selectedDeck ? isDeckValid(selectedDeck) : false;
        const currentArena = arenas[selectedArenaIdx];

        return (
            <div className="flex flex-col h-full bg-[#050407] relative overflow-hidden font-sans">
                {/* DYNAMIC BACKGROUND */}
                <div className="absolute inset-0 z-0 bg-[#0a0a0c]">
                    <div
                        className="absolute inset-0 opacity-40 z-10"
                        style={{
                            backgroundImage: "url('/arenas/play_pattern_bg.png')",
                            backgroundSize: '200px 200px',
                            backgroundRepeat: 'repeat'
                        }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 z-20"></div> {/* Vignette */}
                </div>

                {/* TOP BAR / TITLE */}
                <div className="relative z-30 pt-12 pb-4 px-6 flex items-center justify-between">
                    <div className="w-10"></div>
                    <h1 className="text-3xl font-black text-white italic uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-center" style={{ textShadow: '0 2px 10px rgba(0,0,0,1)' }}>
                        {game.name}
                    </h1>
                    {game.id !== 'GLOBAL_CORE' ? (
                        <button
                            onClick={() => setShowScoreboard(true)}
                            className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all shadow-lg"
                        >
                            <i className="fas fa-trophy text-sm"></i>
                        </button>
                    ) : (
                        <div className="w-10"></div>
                    )}
                </div>

                {/* MAIN CONTENT PORTAL */}
                <div className="relative z-30 flex-1 flex flex-col items-center justify-between pb-8 w-full max-w-md mx-auto">

                    {/* ARENA CAROUSEL */}
                    <div className="w-full px-4 mt-12 mb-8">
                        <div className="relative flex flex-col items-center justify-center">

                            <div className="flex items-center justify-between w-full">
                                <button
                                    onClick={() => setSelectedArenaIdx(prev => prev > 0 ? prev - 1 : arenas.length - 1)}
                                    className="w-12 h-12 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 border-2 border-yellow-100 shadow-[0_8px_20px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.6)] flex items-center justify-center text-black hover:scale-110 hover:brightness-110 transition-all active:scale-95"
                                >
                                    <i className="fas fa-chevron-left text-xl drop-shadow-md"></i>
                                </button>

                                <div className="flex flex-col items-center animate-fade-in text-center px-4">
                                    <div className="w-48 h-64 mb-4 rounded-3xl border-[6px] border-[#334155] shadow-[0_20px_40px_rgba(0,0,0,0.95),inset_0_4px_8px_rgba(255,255,255,0.2),inset_0_-10px_15px_rgba(0,0,0,0.7)] overflow-hidden relative bg-slate-800 transform transition-all duration-500 hover:scale-[1.03] hover:border-blue-400 group">
                                        <img src={currentArena.cardBg} className="w-full h-full object-cover scale-[1.15] relative z-10 transition-transform duration-700 group-hover:scale-[1.12]" alt={currentArena.name} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10 z-20 pointer-events-none"></div>
                                        {/* Glossy overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-60 z-30 pointer-events-none"></div>
                                    </div>
                                    <h2 className="text-3xl font-black text-white tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{currentArena.name}</h2>
                                    <span className="text-xs font-bold text-indigo-300 uppercase mt-1 tracking-widest bg-black/50 px-3 py-1 rounded-full mt-2 border border-white/10 backdrop-blur-sm">{currentArena.desc}</span>
                                </div>

                                <button
                                    onClick={() => setSelectedArenaIdx(prev => prev < arenas.length - 1 ? prev + 1 : 0)}
                                    className="w-12 h-12 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 border-2 border-yellow-100 shadow-[0_8px_20px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.6)] flex items-center justify-center text-black hover:scale-110 hover:brightness-110 transition-all active:scale-95"
                                >
                                    <i className="fas fa-chevron-right text-xl drop-shadow-md"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* DECK SELECTOR SLOT */}
                    <div className="w-full px-6 mt-auto mb-6">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-2">Active Deck</span>
                            <button
                                onClick={() => setShowDeckSelector(true)}
                                className="w-full relative group"
                            >
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
                                <div className="relative flex items-center justify-between bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
                                    <div className="flex items-center gap-3">
                                        {selectedDeck && selectedDeck.cardIds.length > 0 ? (
                                            <div className="w-12 h-16 bg-slate-800 rounded border border-slate-600 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0">
                                                <img
                                                    src={cards.find(c => c.id === selectedDeck.cardIds[0])?.imageUrl}
                                                    className="w-full h-full object-cover scale-[1.3]"
                                                    alt="Deck Cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 bg-slate-800 rounded border border-slate-600 flex items-center justify-center shadow-inner flex-shrink-0">
                                                <i className="fas fa-layer-group text-slate-400"></i>
                                            </div>
                                        )}
                                        <div className="flex flex-col items-start ml-1">
                                            <span className="font-bold text-white text-sm text-left truncate max-w-[160px]">{selectedDeck ? selectedDeck.name : "Select a Deck"}</span>
                                            <span className="text-[10px] text-slate-400">{selectedDeck ? `${selectedDeck.cardIds.length} Cards` : 'No deck chosen'}</span>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors flex-shrink-0">
                                        <i className="fas fa-exchange-alt text-xs"></i>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* MASSIVE BATTLE BUTTON */}
                    <div className="w-full px-6 mb-4">
                        <button
                            onClick={handleStartSearch}
                            disabled={!isValid || selectedArenaIdx !== 0} // Disable PvP for now if not implemented
                            className={`w-full relative group ${!isValid || selectedArenaIdx !== 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                        >
                            {/* Supercell Button Stack Effect */}
                            <div className="absolute inset-0 bg-[#b45309] rounded-[20px] translate-y-2"></div>
                            <div className="relative bg-gradient-to-b from-[#fde047] via-[#eab308] to-[#ca8a04] px-8 py-5 rounded-[20px] border-2 border-[#fef08a] shadow-[0_10px_25px_rgba(0,0,0,0.9),inset_0_2px_0_rgba(255,255,255,0.6),inset_0_-4px_0_rgba(0,0,0,0.2)] flex items-center justify-center transform transition-transform active:translate-y-2 active:shadow-[0_0_0_rgba(0,0,0,0.9)]">
                                <span className="font-black text-[28px] text-white tracking-widest uppercase italic font-sans" style={{ textShadow: '2px 2px 0 #854d0e, -1px -1px 0 #854d0e, 1px -1px 0 #854d0e, -1px 1px 0 #854d0e, 1px 1px 0 #854d0e, 0px 4px 5px rgba(0,0,0,0.5)' }}>
                                    {selectedArenaIdx === 0 ? 'BATTLE' : 'COMING SOON'}
                                </span>
                            </div>
                        </button>
                        {selectedArenaIdx !== 0 && <p className="text-center text-red-400 text-[10px] mt-3 uppercase font-bold tracking-widest">PvP Matchmaking unavailable</p>}
                        {!isValid && selectedArenaIdx === 0 && <p className="text-center text-red-400 text-[10px] mt-3 uppercase font-bold tracking-widest">Invalid Deck Selected</p>}
                    </div>

                    {/* Context Switch (Small at bottom) */}
                    <button
                        onClick={() => { setUseGlobalDecks(!useGlobalDecks); setSelectedDeckId(''); }}
                        className="text-[9px] text-slate-500 font-bold uppercase tracking-widest hover:text-white transition-colors"
                    >
                        <i className={`fas ${useGlobalDecks ? 'fa-globe text-cyan-500' : 'fa-home'} mr-1`}></i>
                        {useGlobalDecks ? 'Viewing: Global Armory Decks' : `Viewing: Local ${game.name} Decks`}
                    </button>
                </div>

                {/* FULL SCREEN DECK SELECTOR MODAL (Clash Royale Style popup) */}
                {showDeckSelector && (
                    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col animate-slide-up">
                        <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shadow-md">
                            <h3 className="text-white font-black text-lg uppercase tracking-widest">Select Deck</h3>
                            <button onClick={() => setShowDeckSelector(false)} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3 pb-4">
                            {activeDecks.map(deck => {
                                const valid = isDeckValid(deck);
                                return (
                                    <button
                                        key={deck.id}
                                        onClick={() => {
                                            if (valid) {
                                                setSelectedDeckId(deck.id);
                                                setShowDeckSelector(false);
                                            }
                                        }}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedDeckId === deck.id ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'} ${!valid ? 'opacity-50 grayscale' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center shadow-inner">
                                                <i className={`fas fa-layer-group ${selectedDeckId === deck.id ? 'text-blue-400' : 'text-slate-500'} text-xl`}></i>
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="font-bold text-white text-base">{deck.name}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${valid ? 'text-green-400' : 'text-red-400'}`}>
                                                    {valid ? `${deck.cardIds.length} Cards - Valid` : `${deck.cardIds.length} Cards - Invalid`}
                                                </span>
                                            </div>
                                        </div>
                                        {selectedDeckId === deck.id && (
                                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                                                <i className="fas fa-check text-[10px]"></i>
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                            {activeDecks.length === 0 && (
                                <div className="text-center text-slate-500 mt-10">
                                    <i className="fas fa-box-open text-4xl mb-4 opacity-50"></i>
                                    <p className="font-bold uppercase tracking-widest text-xs">No decks found in this context.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* SCOREBOARD OVERLAY (for custom worlds only) */}
                {showScoreboard && game.id !== 'GLOBAL_CORE' && (
                    <Scoreboard game={game} onClose={() => setShowScoreboard(false)} />
                )}
            </div>
        )
    }

    // GAME BOARD
    return (
        <div className="h-full flex flex-col bg-[#050407] relative overflow-hidden perspective-1000">
            <div className="absolute inset-0 pointer-events-none bg-center bg-no-repeat transition-all" style={{ backgroundImage: playmatUrl, backgroundSize: bgSize, opacity: 0.2 }}></div>

            {/* TOP HUD (CPU) */}
            <div className="absolute top-0 left-0 right-0 z-40 p-2 flex justify-between items-start pointer-events-none">
                <button onClick={() => setPlayState('LOBBY')} className="pointer-events-auto bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center"><i className="fas fa-chevron-left"></i></button>

                {/* CPU Stats */}
                <div className="flex flex-col items-center pointer-events-auto bg-black/40 p-2 rounded-xl backdrop-blur-md border border-red-500/20">
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <i className="fas fa-heart text-red-500"></i>
                            <span className="ml-1 text-white font-black">{opponentHealth}</span>
                        </div>
                        <div className="text-center">
                            <i className="fas fa-bolt text-yellow-500"></i>
                            <span className="ml-1 text-white font-bold">{opponentMana}/{opponentMaxMana}</span>
                        </div>
                        <div className="text-center">
                            <i className="fas fa-layer-group text-slate-400"></i>
                            <span className="ml-1 text-white text-xs">{opponentHand.length}</span>
                        </div>
                    </div>
                    <div className="mt-1 text-[9px] font-bold text-red-400 uppercase">CPU (Level 1)</div>
                </div>
                <div className="w-8"></div>
            </div>

            {/* TURN BANNER */}
            <div className="absolute top-24 left-1/2 transform -translate-x-1/2 pointer-events-none text-center z-10">
                <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${isTurnTransitioning ? 'text-red-500 animate-pulse' : 'text-white/30'}`}>
                    {isTurnTransitioning ? "CPU THINKING..." : `YOUR TURN (${turn})`}
                </span>
            </div>

            {/* 3D BOARD AREA */}
            <div className="flex-1 overflow-hidden relative flex items-center justify-center perspective-1000 mt-12 mb-20">
                <div className="w-full h-full relative transform rotate-x-20 overflow-visible p-4" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(25deg) scale(0.95)' }}>

                    {/* OPPONENT ROW (Far side) */}
                    <div className="absolute top-0 left-0 right-0 h-1/2 flex justify-center items-start pt-10 gap-2 pointer-events-none" style={{ transform: 'translateZ(-50px)' }}>
                        {board.filter(b => b.owner === 'CPU').map(instance => {
                            const data = getCardData(instance.cardId);
                            if (!data) return null;
                            return (
                                <div key={instance.instanceId}
                                    onClick={() => targetingSourceId ? resolveUnitCombat(instance.instanceId) : null}
                                    className={`relative transition-all duration-300 pointer-events-auto ${instance.shake ? 'animate-bounce' : ''} ${targetingSourceId ? 'cursor-crosshair hover:scale-110' : ''}`}
                                    style={{ transform: `rotate(180deg) ${instance.tapped ? 'rotate(90deg)' : ''}` }}
                                >
                                    {instance.damageIndicator && <div className="absolute -bottom-10 left-1/2 text-4xl text-red-500 font-black animate-bounce rotate-180 z-50">-{instance.damageIndicator}</div>}
                                    <CardComponent card={{ ...data, health: instance.currentHealth, attack: instance.currentAttack }} scale={0.45} />
                                </div>
                            )
                        })}
                    </div>

                    {/* TARGETING OVERLAY */}
                    {targetingSourceId && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                            <div className="bg-red-500/10 border border-red-500 px-4 py-1 rounded-full animate-pulse text-xs font-bold text-red-300 uppercase tracking-widest">Select Enemy Target</div>
                        </div>
                    )}

                    {/* PLAYER ROW (Near side) */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 flex justify-center items-end pb-10 gap-2" style={{ transform: 'translateZ(20px)' }}>
                        {board.filter(b => b.owner === 'PLAYER').map(instance => {
                            const data = getCardData(instance.cardId);
                            if (!data) return null;
                            const isSource = targetingSourceId === instance.instanceId;
                            return (
                                <div key={instance.instanceId} className={`relative transition-all duration-300 group ${instance.shake ? 'animate-bounce' : ''} ${isSource ? 'ring-2 ring-red-500 scale-105' : ''}`}>
                                    {instance.damageIndicator && <div className="absolute -top-10 left-1/2 text-4xl text-red-500 font-black animate-bounce z-50">-{instance.damageIndicator}</div>}

                                    <div onClick={(e) => {
                                        if (!instance.tapped && !instance.summoningSickness && !targetingSourceId) {
                                            e.stopPropagation();
                                            handleCombatAction(instance, 'STRIKE');
                                        }
                                    }}>
                                        <CardComponent card={{ ...data, health: instance.currentHealth, attack: instance.currentAttack }} scale={0.55} isTapped={instance.tapped} />
                                    </div>

                                    {/* Quick Actions (Hover) */}
                                    {!instance.tapped && !instance.summoningSickness && !isTurnTransitioning && !targetingSourceId && (
                                        <div className="absolute -bottom-8 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50">
                                            <button onClick={() => handleCombatAction(instance, 'FACE')} className="bg-red-600 text-white text-[9px] font-bold px-3 py-1 rounded-full shadow-lg border border-white hover:scale-110">FACE</button>
                                        </div>
                                    )}
                                    {instance.summoningSickness && <div className="absolute top-2 right-2 bg-black/50 text-[10px] text-white px-1 rounded">zzz</div>}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* RIGHT CONTROLS */}
            <div className="absolute right-4 bottom-32 flex flex-col gap-4 z-40 pointer-events-auto">
                <button
                    onClick={handlePassTurn}
                    disabled={isTurnTransitioning}
                    className={`w-16 h-16 rounded-full border-4 flex flex-col items-center justify-center transition-all ${isTurnTransitioning ? 'bg-slate-800 border-slate-600 grayscale' : 'bg-gradient-to-br from-yellow-500 to-amber-600 border-white/20 hover:scale-110 shadow-lg'}`}
                >
                    {isTurnTransitioning ? <i className="fas fa-hourglass-half text-white animate-spin"></i> : <span className="text-[8px] font-black uppercase text-black">End Turn</span>}
                </button>
            </div>

            {/* PLAYER HUD */}
            <div className="absolute left-4 bottom-32 flex flex-col gap-4 z-40">
                <div className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center shadow-lg relative overflow-hidden bg-blue-900/80 border-blue-400`}>
                        <div className="absolute bottom-0 left-0 right-0 bg-blue-500 opacity-50 transition-all duration-500" style={{ height: `${(mana / maxMana) * 100}%` }}></div>
                        <span className="text-white font-black text-lg relative z-10">{mana}/{maxMana}</span>
                    </div>
                </div>
                <div className="flex flex-col items-center mt-2">
                    <div className="w-12 h-12 bg-green-900/80 rounded-full border-2 border-green-500 flex items-center justify-center shadow-lg">
                        <span className="text-white font-black text-lg">{playerHealth}</span>
                    </div>
                    <span className="text-[9px] font-bold text-green-400 mt-1 uppercase bg-black/50 px-2 py-0.5 rounded">{playerName}</span>
                </div>
            </div>

            {/* PLAYER HAND */}
            <div className="fixed bottom-0 left-0 right-0 h-40 z-50 pointer-events-none flex justify-center items-end pb-4">
                <div className="relative w-full max-w-2xl h-full flex justify-center items-end pointer-events-auto">
                    {hand.map((cardId, idx) => {
                        const data = getCardData(cardId);
                        if (!data) return null;
                        const isPlayable = data.cost <= mana && !isTurnTransitioning;

                        // Fan math
                        const total = hand.length;
                        const center = (total - 1) / 2;
                        const offset = idx - center;
                        const rotate = offset * 4;
                        const ty = Math.abs(offset) * 8;

                        return (
                            <div key={`${cardId}-${idx}`}
                                onClick={() => playCard(cardId, idx, 'PLAYER')}
                                className={`absolute transform transition-all duration-300 origin-bottom hover:z-50 hover:scale-125 hover:-translate-y-20 hover:rotate-0 cursor-pointer ${isPlayable ? 'brightness-110' : 'brightness-50 grayscale'}`}
                                style={{ marginLeft: `${offset * 50}px`, transform: `rotate(${rotate}deg) translateY(${ty}px)`, zIndex: idx }}
                            >
                                <CardComponent card={data} scale={0.6} />
                            </div>
                        )
                    })}
                </div>
            </div>

        </div>
    );
};
