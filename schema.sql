-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Firebase UID
    email TEXT UNIQUE NOT NULL,
    displayName TEXT,
    createdAt INTEGER
);

-- Create Games Table
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    artStyle TEXT,
    primaryColor TEXT,
    createdAt INTEGER,
    inviteCode TEXT,
    rules TEXT, -- JSON stored as text
    userId TEXT -- Creator
);

-- Create Cards Table
CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    gameId TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    cost INTEGER,
    attack INTEGER,
    health INTEGER,
    description TEXT,
    imageUrl TEXT,
    createdAt INTEGER,
    userId TEXT -- Creator
);

-- Create Decks Table
CREATE TABLE IF NOT EXISTS decks (
    id TEXT PRIMARY KEY,
    gameId TEXT NOT NULL,
    name TEXT NOT NULL,
    cardIds TEXT, -- JSON array of strings
    userId TEXT -- Creator
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cards_game ON cards(gameId);
CREATE INDEX IF NOT EXISTS idx_decks_game ON decks(gameId);
CREATE INDEX IF NOT EXISTS idx_games_user ON games(userId);
CREATE INDEX IF NOT EXISTS idx_cards_user ON cards(userId);
CREATE INDEX IF NOT EXISTS idx_decks_user ON decks(userId);