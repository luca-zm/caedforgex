
import { GameProject, CardData, Deck } from "../types";

// When deployed on Cloudflare Pages with Functions, the backend is on the same domain at /api
// Local development requires 'wrangler pages dev' proxying.
const API_URL = "/api"; 

export const storageService = {
  
  // ================= SETUP =================
  async setupCloudDatabase(): Promise<void> {
      try {
          const res = await fetch(`${API_URL}/setup`, { method: 'POST' });
          if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || "Setup failed");
          }
      } catch (e) {
          console.error("DB Setup Error:", e);
          throw e;
      }
  },

  // ================= GAMES =================
  async getGames(): Promise<GameProject[]> {
    try {
        const res = await fetch(`${API_URL}/games`);
        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType || !contentType.includes("application/json")) {
            throw new Error("Invalid API Response");
        }
        return await res.json();
    } catch (e) {
        console.warn("Using LocalStorage fallback for Games (Backend unreachable)");
        const local = localStorage.getItem('cf_games');
        return local ? JSON.parse(local) : [];
    }
  },

  async saveGame(game: GameProject): Promise<void> {
    try {
        const res = await fetch(`${API_URL}/games`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(game)
        });
        if (!res.ok) throw new Error("API Save Failed");
    } catch (e) {
        console.warn("Saving to LocalStorage fallback");
        const games = await storageService.getGames();
        const idx = games.findIndex(g => g.id === game.id);
        const newGames = idx >= 0 ? games.map(g => g.id === game.id ? game : g) : [game, ...games];
        localStorage.setItem('cf_games', JSON.stringify(newGames));
    }
  },

  async deleteGame(gameId: string): Promise<void> {
    try {
        const res = await fetch(`${API_URL}/games?id=${gameId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("API Delete Failed");
    } catch (e) {
        const games = await storageService.getGames();
        localStorage.setItem('cf_games', JSON.stringify(games.filter(g => g.id !== gameId)));
    }
  },

  // ================= CARDS =================
  async getCards(gameId: string): Promise<CardData[]> {
    try {
        const res = await fetch(`${API_URL}/cards?gameId=${gameId}`);
        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType || !contentType.includes("application/json")) {
            throw new Error("Invalid API Response");
        }
        return await res.json();
    } catch (e) {
        const local = localStorage.getItem('cf_cards');
        const all: CardData[] = local ? JSON.parse(local) : [];
        return all.filter(c => c.gameId === gameId);
    }
  },

  async saveCard(card: CardData): Promise<void> {
    try {
        // The backend handles R2 upload and D1 save
        const res = await fetch(`${API_URL}/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(card)
        });
        if (!res.ok) throw new Error("API Save Failed");
    } catch (e) {
         const local = localStorage.getItem('cf_cards');
         const all: CardData[] = local ? JSON.parse(local) : [];
         // Simple upsert
         const idx = all.findIndex(c => c.id === card.id);
         let newCards;
         if (idx >= 0) {
             newCards = [...all];
             newCards[idx] = card;
         } else {
             newCards = [card, ...all];
         }
         localStorage.setItem('cf_cards', JSON.stringify(newCards));
    }
  },

  // ================= DECKS =================
  async getDecks(gameId: string): Promise<Deck[]> {
      try {
        const res = await fetch(`${API_URL}/decks?gameId=${gameId}`);
        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType || !contentType.includes("application/json")) {
            throw new Error("Invalid API Response");
        }
        return await res.json();
    } catch (e) {
        const local = localStorage.getItem('cf_decks');
        const all: Deck[] = local ? JSON.parse(local) : [];
        return all.filter(d => d.gameId === gameId);
    }
  },

  async saveDeck(deck: Deck): Promise<void> {
      try {
        const res = await fetch(`${API_URL}/decks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deck)
        });
        if (!res.ok) throw new Error("API Save Failed");
    } catch (e) {
         const local = localStorage.getItem('cf_decks');
         const all: Deck[] = local ? JSON.parse(local) : [];
         const idx = all.findIndex(d => d.id === deck.id);
         const newDecks = idx >= 0 ? all.map(d => d.id === deck.id ? deck : d) : [...all, deck];
         localStorage.setItem('cf_decks', JSON.stringify(newDecks));
    }
  },
  
  async deleteDeck(deckId: string): Promise<void> {
      try {
        const res = await fetch(`${API_URL}/decks?id=${deckId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("API Delete Failed");
    } catch (e) {
        const local = localStorage.getItem('cf_decks');
        const all: Deck[] = local ? JSON.parse(local) : [];
        localStorage.setItem('cf_decks', JSON.stringify(all.filter(d => d.id !== deckId)));
    }
  }
};
