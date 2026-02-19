import { onRequestGet as __api_cards_ts_onRequestGet } from "/Users/lucazammariello/Desktop/REPOS GoogleAI/cardforge-ai/functions/api/cards.ts"
import { onRequestPost as __api_cards_ts_onRequestPost } from "/Users/lucazammariello/Desktop/REPOS GoogleAI/cardforge-ai/functions/api/cards.ts"
import { onRequestDelete as __api_decks_ts_onRequestDelete } from "/Users/lucazammariello/Desktop/REPOS GoogleAI/cardforge-ai/functions/api/decks.ts"
import { onRequestGet as __api_decks_ts_onRequestGet } from "/Users/lucazammariello/Desktop/REPOS GoogleAI/cardforge-ai/functions/api/decks.ts"
import { onRequestPost as __api_decks_ts_onRequestPost } from "/Users/lucazammariello/Desktop/REPOS GoogleAI/cardforge-ai/functions/api/decks.ts"
import { onRequestDelete as __api_games_ts_onRequestDelete } from "/Users/lucazammariello/Desktop/REPOS GoogleAI/cardforge-ai/functions/api/games.ts"
import { onRequestGet as __api_games_ts_onRequestGet } from "/Users/lucazammariello/Desktop/REPOS GoogleAI/cardforge-ai/functions/api/games.ts"
import { onRequestPost as __api_games_ts_onRequestPost } from "/Users/lucazammariello/Desktop/REPOS GoogleAI/cardforge-ai/functions/api/games.ts"
import { onRequestPost as __api_setup_ts_onRequestPost } from "/Users/lucazammariello/Desktop/REPOS GoogleAI/cardforge-ai/functions/api/setup.ts"
import { onRequest as __api_generate_ts_onRequest } from "/Users/lucazammariello/Desktop/REPOS GoogleAI/cardforge-ai/functions/api/generate.ts"

export const routes = [
    {
      routePath: "/api/cards",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_cards_ts_onRequestGet],
    },
  {
      routePath: "/api/cards",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_cards_ts_onRequestPost],
    },
  {
      routePath: "/api/decks",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_decks_ts_onRequestDelete],
    },
  {
      routePath: "/api/decks",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_decks_ts_onRequestGet],
    },
  {
      routePath: "/api/decks",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_decks_ts_onRequestPost],
    },
  {
      routePath: "/api/games",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_games_ts_onRequestDelete],
    },
  {
      routePath: "/api/games",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_games_ts_onRequestGet],
    },
  {
      routePath: "/api/games",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_games_ts_onRequestPost],
    },
  {
      routePath: "/api/setup",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_setup_ts_onRequestPost],
    },
  {
      routePath: "/api/generate",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_generate_ts_onRequest],
    },
  ]