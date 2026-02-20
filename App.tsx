
import React, { useState, useEffect } from 'react';
import { AppView, CardData, Deck, GameProject, CardType } from './types';
import { Navigation } from './components/Navigation';
import { CardCreator } from './components/CardCreator';
import { DeckBuilder } from './components/DeckBuilder';
import { GameTable } from './components/GameTable';
import { RulesAssistant } from './components/RulesAssistant';
import { GameDashboard } from './components/GameDashboard';
import { GuideView } from './components/GuideView';
import { CardModal } from './components/CardModal';
import { StaticRules } from './components/StaticRules';
import { storageService } from './services/storageService';

// --- STARTER SET DATA (20 Cards) ---
const R2_BASE = 'https://pub-1c2e7d5133474fdbac45a2cebbed73c6.r2.dev/cards/GLOBAL_CORE';

const STARTER_CARDS: CardData[] = [
    // LANDS (4)
    { id: 'start_land_1', gameId: 'GLOBAL_CORE', name: 'Neon Citadel', type: CardType.LAND, cost: 0, description: 'Grants +1 Max Mana.', imageUrl: `${R2_BASE}/start_land_1.png`, createdAt: 0 },
    { id: 'start_land_2', gameId: 'GLOBAL_CORE', name: 'Ancient Ruins', type: CardType.LAND, cost: 0, description: 'Grants +1 Max Mana.', imageUrl: `${R2_BASE}/start_land_2.png`, createdAt: 0 },
    { id: 'start_land_3', gameId: 'GLOBAL_CORE', name: 'Orbital Station', type: CardType.LAND, cost: 0, description: 'Grants +1 Max Mana.', imageUrl: `${R2_BASE}/start_land_3.png`, createdAt: 0 },
    { id: 'start_land_4', gameId: 'GLOBAL_CORE', name: 'Deep Forest', type: CardType.LAND, cost: 0, description: 'Grants +1 Max Mana.', imageUrl: `${R2_BASE}/start_land_4.png`, createdAt: 0 },

    // UNITS (8)
    { id: 'start_unit_1', gameId: 'GLOBAL_CORE', name: 'Scout Drone', type: CardType.UNIT, cost: 1, attack: 1, health: 2, description: 'Fast and cheap.', imageUrl: `${R2_BASE}/start_unit_1.png`, createdAt: 0 },
    { id: 'start_unit_2', gameId: 'GLOBAL_CORE', name: 'Goblin Grunt', type: CardType.UNIT, cost: 1, attack: 2, health: 1, description: 'Haste. (Attacks immediately)', imageUrl: `${R2_BASE}/start_unit_2.png`, createdAt: 0 },
    { id: 'start_unit_3', gameId: 'GLOBAL_CORE', name: 'Cyber Wolf', type: CardType.UNIT, cost: 2, attack: 3, health: 2, description: 'A relentless hunter.', imageUrl: `${R2_BASE}/start_unit_3.png`, createdAt: 0 },
    { id: 'start_unit_4', gameId: 'GLOBAL_CORE', name: 'Shield Bearer', type: CardType.UNIT, cost: 2, attack: 1, health: 5, description: 'A solid defense.', imageUrl: `${R2_BASE}/start_unit_4.png`, createdAt: 0 },
    { id: 'start_unit_5', gameId: 'GLOBAL_CORE', name: 'Plasma Marine', type: CardType.UNIT, cost: 3, attack: 4, health: 3, description: 'Standard infantry.', imageUrl: `${R2_BASE}/start_unit_5.png`, createdAt: 0 },
    { id: 'start_unit_6', gameId: 'GLOBAL_CORE', name: 'Arcane Mage', type: CardType.UNIT, cost: 3, attack: 2, health: 2, description: 'On Play: Damage 2 to opponent.', imageUrl: `${R2_BASE}/start_unit_6.png`, createdAt: 0 },
    { id: 'start_unit_7', gameId: 'GLOBAL_CORE', name: 'Mech Titan', type: CardType.UNIT, cost: 5, attack: 6, health: 6, description: 'Heavy armor.', imageUrl: `${R2_BASE}/start_unit_7.png`, createdAt: 0 },
    { id: 'start_unit_8', gameId: 'GLOBAL_CORE', name: 'Void Dragon', type: CardType.UNIT, cost: 7, attack: 8, health: 8, description: 'Flying terror.', imageUrl: `${R2_BASE}/start_unit_8.png`, createdAt: 0 },

    // SPELLS (6)
    { id: 'start_spell_1', gameId: 'GLOBAL_CORE', name: 'Fireball', type: CardType.SPELL, cost: 2, description: 'Deal 3 Damage to opponent.', imageUrl: `${R2_BASE}/start_spell_1.png`, createdAt: 0 },
    { id: 'start_spell_2', gameId: 'GLOBAL_CORE', name: 'Data Leak', type: CardType.SPELL, cost: 3, description: 'Draw 2 Cards.', imageUrl: `${R2_BASE}/start_spell_2.png`, createdAt: 0 },
    { id: 'start_spell_3', gameId: 'GLOBAL_CORE', name: 'Nano Repair', type: CardType.SPELL, cost: 2, description: 'Heal 5 Health.', imageUrl: `${R2_BASE}/start_spell_3.png`, createdAt: 0 },
    { id: 'start_spell_4', gameId: 'GLOBAL_CORE', name: 'Overclock', type: CardType.SPELL, cost: 1, description: 'Buff Target Unit (+1/+1).', imageUrl: `${R2_BASE}/start_spell_4.png`, createdAt: 0 },
    { id: 'start_spell_5', gameId: 'GLOBAL_CORE', name: 'System Crash', type: CardType.SPELL, cost: 4, description: 'Destroy all units (Not really implemented, but sounds cool).', imageUrl: `${R2_BASE}/start_spell_5.png`, createdAt: 0 },
    { id: 'start_spell_6', gameId: 'GLOBAL_CORE', name: 'Energy Shield', type: CardType.SPELL, cost: 1, description: 'Heal 3.', imageUrl: `${R2_BASE}/start_spell_6.png`, createdAt: 0 },

    // ARTIFACTS (2)
    { id: 'start_art_1', gameId: 'GLOBAL_CORE', name: 'Mana Prism', type: CardType.ARTIFACT, cost: 2, description: 'Start turn with +1 Mana.', imageUrl: `${R2_BASE}/start_art_1.png`, createdAt: 0 },
    { id: 'start_art_2', gameId: 'GLOBAL_CORE', name: 'Auto Turret', type: CardType.ARTIFACT, cost: 3, description: 'Deal 1 Damage to opponent at start of turn.', imageUrl: `${R2_BASE}/start_art_2.png`, createdAt: 0 }
];

const App: React.FC = () => {
    const [view, setView] = useState<AppView>('dashboard');
    const [games, setGames] = useState<GameProject[]>([]);
    const [activeGameId, setActiveGameId] = useState<string | null>(null);

    // Local User State (Simulating Auth via LocalStorage)
    const [createdGameIds, setCreatedGameIds] = useState<string[]>([]);
    const [joinedGameIds, setJoinedGameIds] = useState<string[]>([]);

    const [cards, setCards] = useState<CardData[]>([]);
    const [decks, setDecks] = useState<Deck[]>([]);
    const [activeDeckId, setActiveDeckId] = useState<string | null>(null);

    // Card Inspection State
    const [inspectingCard, setInspectingCard] = useState<CardData | null>(null);
    const [loading, setLoading] = useState(false);

    // INITIAL LOAD
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            // Load Global Games from Server
            let g = await storageService.getGames();

            // CHECK IF GLOBAL CORE EXISTS IN FETCHED DATA
            const exists = g.some(game => game.id === 'GLOBAL_CORE');

            if (!exists) {
                const globalCore: GameProject = {
                    id: 'GLOBAL_CORE',
                    name: 'Global Armory',
                    description: 'A universal vault for cards that can traverse worlds.',
                    artStyle: 'MINIMALIST',
                    primaryColor: '#ffffff',
                    createdAt: 0,
                    inviteCode: 'GLOBAL',
                    rules: {
                        initialHealth: 30,
                        resourceType: 'MANA_RAMP',
                        maxResource: 10,
                        startingResource: 1,
                        cardsPerTurn: 1,
                        startingHandSize: 5,
                        winCondition: 'REDUCE_HEALTH',
                        boardType: 'NONE',
                        fullText: 'Standard Universal Rules apply.',
                        constraints: {
                            minCards: 5,
                            maxCards: 60,
                            // Explicitly use Enum values to match CardComponent checks
                            allowedTypes: [CardType.UNIT, CardType.SPELL, CardType.ARTIFACT, CardType.LAND],
                            maxCopiesPerCard: 4
                        },
                        multiplayerMode: 'CASUAL'
                    }
                };
                g = [globalCore, ...g];
            }

            setGames(g);

            // Load Local User Prefs
            const localCreated = JSON.parse(localStorage.getItem('cf_created_ids') || '[]');
            const localJoined = JSON.parse(localStorage.getItem('cf_joined_ids') || '[]');
            setCreatedGameIds(localCreated);
            setJoinedGameIds(localJoined);

            setLoading(false);
        };
        init();
    }, []);

    // LOAD GAME DATA WHEN GAME SELECTED
    useEffect(() => {
        if (activeGameId) {
            // 1. Wipe state immediately to prevent "ghosting"
            setCards([]);
            setDecks([]);
            setActiveDeckId(null);

            const loadGameData = async () => {
                setLoading(true);
                try {
                    const localCardsPromise = storageService.getCards(activeGameId);
                    const localDecksPromise = storageService.getDecks(activeGameId);
                    const globalDecksPromise = activeGameId !== 'GLOBAL_CORE'
                        ? storageService.getDecks('GLOBAL_CORE')
                        : Promise.resolve([] as Deck[]);

                    // NEW: Fetch Global Cards to check for Starter Set Injection
                    const globalCardsPromise = storageService.getCards('GLOBAL_CORE');

                    const [localCards, localDecks, globalDecks, globalCards] = await Promise.all([
                        localCardsPromise,
                        localDecksPromise,
                        globalDecksPromise,
                        globalCardsPromise
                    ]);

                    // --- INJECT OR UPGRADE STARTER SET ---
                    let needsInjection = false;
                    if (activeGameId === 'GLOBAL_CORE') {
                        if (globalCards.length === 0) {
                            needsInjection = true;
                        } else {
                            // Force an upgrade if old Unsplash placeholders or old local paths are found in the DB
                            const hasOldPlaceholders = globalCards.some(c => c.imageUrl && (c.imageUrl.includes('unsplash.com') || c.imageUrl.includes('/starter/')));
                            if (hasOldPlaceholders) {
                                needsInjection = true;
                                console.log("Old placeholder images detected in Global Core. Forcing starter deck upgrade to R2.");
                            }
                        }
                    }

                    if (needsInjection) {
                        console.log("Injecting/Upgrading Starter Set...");

                        // SEQUENTIAL SAVE (CRITICAL FIX): 
                        // Avoid Promise.all() for local storage writes to prevent race conditions causing infinite loops or missing data.
                        for (const c of STARTER_CARDS) {
                            await storageService.saveCard(c);
                        }

                        // Upsert CPU Starter Deck
                        let starterDeck = localDecks.find(d => d.id === 'cpu-starter-deck') || globalDecks.find(d => d.id === 'cpu-starter-deck');
                        if (!starterDeck) {
                            starterDeck = {
                                id: 'cpu-starter-deck',
                                gameId: 'GLOBAL_CORE',
                                name: 'CPU Standard',
                                cardIds: STARTER_CARDS.map(c => c.id) // Add all 20 cards
                            };
                            await storageService.saveDeck(starterDeck);
                        }

                        // Update Local State immediately
                        setCards(STARTER_CARDS);

                        // Merge the starter deck without duplicating if it already existed
                        const otherLocalDecks = localDecks.filter(d => d.id !== 'cpu-starter-deck');
                        const otherGlobalDecks = globalDecks.filter(d => d.id !== 'cpu-starter-deck');
                        setDecks([...otherLocalDecks, ...otherGlobalDecks, starterDeck]);

                    } else {
                        setCards(localCards);
                        setDecks([...localDecks, ...globalDecks]);
                    }

                } catch (error) {
                    console.error("Game data load failed", error);
                    alert("Connection unstable. Using offline mode.");
                } finally {
                    // Ensure loading is ALWAYS turned off
                    setLoading(false);
                }
            };
            loadGameData();
        }
    }, [activeGameId]);


    const handleCreateGame = async (game: GameProject) => {
        setGames(prev => [game, ...prev]);

        // Track ownership locally
        const newCreated = [...createdGameIds, game.id];
        const newJoined = [...joinedGameIds, game.id]; // Auto-join own game
        setCreatedGameIds(newCreated);
        setJoinedGameIds(newJoined);
        localStorage.setItem('cf_created_ids', JSON.stringify(newCreated));
        localStorage.setItem('cf_joined_ids', JSON.stringify(newJoined));

        await storageService.saveGame(game);
    };

    const handleJoinGame = (gameId: string) => {
        if (!joinedGameIds.includes(gameId)) {
            const newJoined = [...joinedGameIds, gameId];
            setJoinedGameIds(newJoined);
            localStorage.setItem('cf_joined_ids', JSON.stringify(newJoined));
            alert("World joined! Check 'My Worlds' tab.");
        }
    };

    const handleJoinByCode = (code: string) => {
        const game = games.find(g => g.inviteCode === code);
        if (game) {
            if (joinedGameIds.includes(game.id)) {
                alert(`You are already in ${game.name}.`);
            } else {
                handleJoinGame(game.id);
                alert(`Access Granted: Welcome to ${game.name}`);
            }
        } else {
            alert("Signal Lost: Invalid Access Code.");
        }
    };

    const handleSelectGame = (gameId: string) => {
        setActiveGameId(gameId);
        // If I created it, go to forge, otherwise go to play/decks first
        const isCreator = createdGameIds.includes(gameId);
        // If Global Core, go straight to Decks (Armory)
        if (gameId === 'GLOBAL_CORE') {
            setView('decks');
        } else {
            setView(isCreator ? 'create' : 'play');
        }
    };

    const handleDeleteGame = async (gameId: string) => {
        if (gameId === 'GLOBAL_CORE') { alert("Cannot delete the Global Armory."); return; }
        if (confirm("Are you sure? This deletes all cards and decks for this game from the Cloud.")) {
            await storageService.deleteGame(gameId);
            setGames(prev => prev.filter(g => g.id !== gameId));
            if (activeGameId === gameId) {
                setActiveGameId(null);
                setView('dashboard');
            }
        }
    };

    const handleSaveCard = async (newCard: CardData, deckId?: string) => {
        // Optimistic Update
        setCards(prev => [newCard, ...prev]);

        // Cloud Save
        await storageService.saveCard(newCard);

        // If a deck was selected in the creator, add it immediately
        if (deckId) {
            const deck = decks.find(d => d.id === deckId);
            if (deck) {
                const updatedDeck = { ...deck, cardIds: [...deck.cardIds, newCard.id] };
                setDecks(prev => prev.map(d => d.id === deckId ? updatedDeck : d));
                await storageService.saveDeck(updatedDeck);
                alert(`Card Saved and added to deck!`);
            }
        } else {
            alert("Card Saved to Library!");
        }
    };

    const handleSaveDeck = async (updatedDeck: Deck) => {
        setDecks(prev => {
            const index = prev.findIndex(d => d.id === updatedDeck.id);
            if (index >= 0) {
                const newDecks = [...prev];
                newDecks[index] = updatedDeck;
                return newDecks;
            }
            return [...prev, updatedDeck];
        });
        await storageService.saveDeck(updatedDeck);
    };

    const handleDeleteDeck = async (id: string) => {
        setDecks(prev => prev.filter(d => d.id !== id));
        if (activeDeckId === id) setActiveDeckId(null);
        await storageService.deleteDeck(id);
    };

    const handleUpdateRules = async (gameId: string, rulesData: any) => {
        const game = games.find(g => g.id === gameId);
        if (game) {
            // Destructure to separate the nested _extra fields (visuals) from the rule logic
            const { _extra, ...actualRules } = rulesData;

            const updatedGame: GameProject = {
                ...game,
                rules: { ...game.rules, ...actualRules },
                // Merge visual assets directly into the root GameProject where they belong
                ...(_extra || {})
            };

            setGames(prev => prev.map(g => g.id === gameId ? updatedGame : g));
            await storageService.saveGame(updatedGame);
        }
    };

    const activeGame = games.find(g => g.id === activeGameId);

    const renderView = () => {
        // ROUTE GUARD: Allow dashboard AND guide even if no active game.
        // Other views (create, decks, play, rules) require an active game.
        if (!activeGame && view !== 'dashboard' && view !== 'guide') {
            return (
                <GameDashboard
                    games={games}
                    createdGameIds={createdGameIds}
                    joinedGameIds={joinedGameIds}
                    onCreateGame={handleCreateGame}
                    onSelectGame={handleSelectGame}
                    onJoinGame={handleJoinGame}
                    onJoinByCode={handleJoinByCode}
                    onDeleteGame={handleDeleteGame}
                />
            );
        }

        switch (view) {
            case 'dashboard':
                return (
                    <GameDashboard
                        games={games}
                        createdGameIds={createdGameIds}
                        joinedGameIds={joinedGameIds}
                        onCreateGame={handleCreateGame}
                        onSelectGame={handleSelectGame}
                        onJoinGame={handleJoinGame}
                        onJoinByCode={handleJoinByCode}
                        onDeleteGame={handleDeleteGame}
                    />
                );
            case 'create':
                return activeGame ? <CardCreator game={activeGame} decks={decks} onSave={handleSaveCard} /> : null;
            case 'decks':
                return activeGame ? (
                    <DeckBuilder
                        game={activeGame}
                        cards={cards}
                        decks={decks}
                        onSaveDeck={handleSaveDeck}
                        onDeleteDeck={handleDeleteDeck}
                        onSelectDeck={setActiveDeckId}
                        activeDeckId={activeDeckId}
                        onInspectCard={setInspectingCard}
                    />
                ) : null;
            case 'play':
                return activeGame ? <GameTable game={activeGame} cards={cards} decks={decks} /> : null;
            case 'rules':
                if (!activeGame) return null;
                return activeGame.id === 'GLOBAL_CORE' ? (
                    <StaticRules game={activeGame} />
                ) : (
                    <RulesAssistant
                        game={activeGame}
                        onSaveRules={(r) => handleUpdateRules(activeGame.id, r)}
                        onClose={() => setView('dashboard')}
                    />
                );
            case 'guide':
                return <GuideView game={activeGame || null} />;
            default:
                return <div>View Not Found</div>;
        }
    };

    const handleSetView = (newView: AppView) => {
        // Auto-switch to GLOBAL_CORE if navigating to Create/Decks/Play without an active world
        if ((newView === 'create' || newView === 'decks' || newView === 'play') && !activeGameId) {
            setActiveGameId('GLOBAL_CORE');
        }
        setView(newView);
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-[#141218] text-[#E6E1E5] overflow-hidden font-sans">

            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="mt-4 text-fuchsia-400 font-bold uppercase tracking-widest text-xs">Syncing with Cloud...</span>
                    </div>
                </div>
            )}

            {/* Top Bar - Only show if not on dashboard to give more space there */}
            {view !== 'dashboard' && activeGame && (
                <div className="h-8 bg-black flex items-center px-4 justify-between z-50 shrink-0 border-b border-white/10">
                    <button
                        onClick={() => {
                            if (view === 'decks' && activeDeckId) {
                                setActiveDeckId(null);
                            } else {
                                setView('dashboard');
                            }
                        }}
                        className="text-[10px] text-[#CAC4D0] flex items-center gap-1 hover:text-white transition-colors uppercase"
                    >
                        <i className="fas fa-chevron-left"></i> {view === 'decks' && activeDeckId ? (activeGame.id === 'GLOBAL_CORE' ? 'Armory' : activeGame.name) : 'Worlds'}
                    </button>
                    <div className="flex items-center gap-2">
                        {activeGame.id === 'GLOBAL_CORE' && <i className="fas fa-globe text-cyan-400 text-xs"></i>}
                        <span className="text-[10px] font-bold text-fuchsia-400 tracking-widest">{activeGame.name.toUpperCase()}</span>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            {/* Added pb-24 to accommodate fixed footer */}
            <main className="flex-1 relative overflow-hidden pb-24">
                {renderView()}
            </main>

            {/* NAVIGATION FOOTER */}
            {/* Now a fixed footer, sibling of main */}
            <Navigation
                currentView={view}
                setView={handleSetView}
                hasActiveGame={!!activeGame}
            />

            {/* Global Card Modal (Has animations!) */}
            <CardModal card={inspectingCard} onClose={() => setInspectingCard(null)} />
        </div>
    );
};

export default App;
