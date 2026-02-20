
export enum CardType {
  UNIT = 'UNIT',
  SPELL = 'SPELL',
  ARTIFACT = 'ARTIFACT',
  LAND = 'LAND'
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  allowedTypes: CardType[];
  maxHealth?: number;
  maxAttack?: number;
  minCost?: number;
  tier: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

export type ArtStyle = 'FANTASY_OIL' | 'CYBERPUNK' | 'PIXEL_ART' | 'ANIME' | 'LOVECRAFT' | 'MINIMALIST';

export type BoardType = 'NONE' | 'LANES' | 'GRID' | 'MAP';

// NEW: Strict Resource Logic
export type ResourceType = 'MANA_RAMP' | 'FIXED_ENERGY' | 'NO_COST';

export interface DeckConstraints {
  minCards: number;
  maxCards: number;
  allowedTypes: CardType[];
  maxCopiesPerCard: number;
}

export interface PromoCard {
  title: string;
  description: string;
  icon: string; // FontAwesome icon class
}

export interface BoardTheme {
  backgroundUrl: string; // AI Generated Image
  borderColor: string;
  texture: 'MAT' | 'WOOD' | 'METAL' | 'HOLOGRAPHIC';
}

export interface GameRules {
  // Core Stats
  initialHealth: number; // e.g., 20, 30, 40

  // Economy
  resourceType: ResourceType;
  maxResource: number; // Cap (e.g. 10 mana or 3 action points)
  startingResource: number; // Turn 1 resource

  // Turn Logic
  cardsPerTurn: number; // Draw count per turn
  startingHandSize: number;

  // Victory
  winCondition: 'REDUCE_HEALTH' | 'MILL_DECK'; // Can expand later

  // Legacy / Fluff
  boardType: BoardType;
  fullText: string; // Generated explanation
  constraints: DeckConstraints;
  multiplayerMode: 'RANKED' | 'CASUAL' | 'INVITE_ONLY';

  // UI Visuals for Rules Editor
  sectionBgs?: {
    vitality: string;
    economy: string;
    hand: string;
    constraints: string;
  };
}

export interface GameProject {
  id: string;
  name: string;
  description: string;
  artStyle: ArtStyle;
  primaryColor: string;
  createdAt: number;
  inviteCode?: string; // Unique code for multiplayer
  iconUrl?: string; // AI Generated Square Icon for the World
  promoCards?: PromoCard[]; // The "N Cards" carousel
  boardTheme?: BoardTheme; // Custom 1v1 Arena
  rules?: GameRules;
}

export interface CardData {
  id: string;
  gameId: string;
  name: string;
  type: CardType;
  cost: number;
  attack?: number;
  health?: number;
  description: string;
  imageUrl: string;
  createdAt: number;
}

export interface Deck {
  id: string;
  gameId: string;
  name: string;
  cardIds: string[];
}

export interface BoardInstance {
  instanceId: string;
  cardId: string;
  owner: 'PLAYER' | 'CPU'; // NEW FIELD
  tapped: boolean;
  x: number;
  y: number;
  currentHealth: number;
  currentAttack: number;
  summoningSickness: boolean;
  shake?: boolean; // For visual feedback
  damageIndicator?: number | null; // For floating damage numbers
  dummy?: boolean;
}

export interface GameState {
  hand: string[];
  board: BoardInstance[];
  deck: string[];
  graveyard: string[];
}

export type AppView = 'dashboard' | 'create' | 'decks' | 'play' | 'rules' | 'guide';
