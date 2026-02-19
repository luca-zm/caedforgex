-- Create Games Table
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    artStyle TEXT,
    primaryColor TEXT,
    createdAt INTEGER,
    inviteCode TEXT,
    rules TEXT -- JSON stored as text
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
    createdAt INTEGER
);

-- Create Decks Table
CREATE TABLE IF NOT EXISTS decks (
    id TEXT PRIMARY KEY,
    gameId TEXT NOT NULL,
    name TEXT NOT NULL,
    cardIds TEXT -- JSON array of strings
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cards_game ON cards(gameId);
CREATE INDEX IF NOT EXISTS idx_decks_game ON decks(gameId);