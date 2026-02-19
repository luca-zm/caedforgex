
import { ArtStyle, BoardType, PromoCard } from "../types";

// Base API URL builder to handle both local dev and production
const getApiUrl = (path: string) => {
  return `/api${path}`;
};

/**
 * Generates an abstract UI background for a specific section (e.g., "Health Mechanics").
 */
export const generateUIBackground = async (topic: string, style: ArtStyle): Promise<string> => {
  try {
    const response = await fetch(getApiUrl('/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'ui_background', topic, style })
    });
    if (!response.ok) throw new Error('Failed to generate UI background');
    const data = await response.json();
    return data.image;
  } catch (error) {
    console.error("Error generating UI BG:", error);
    throw error;
  }
};

/**
 * Generates card artwork enforcing the Game Project's visual identity.
 */
export const generateCardArt = async (prompt: string, style: ArtStyle): Promise<string> => {
  try {
    const response = await fetch(getApiUrl('/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'card_art', prompt, style })
    });
    if (!response.ok) throw new Error('Failed to generate card art');
    const data = await response.json();
    return data.image;
  } catch (error) {
    console.error("Error generating card art:", error);
    throw error;
  }
};

/**
 * Generates a Square Icon for a World.
 */
export const generateWorldIcon = async (gameName: string, style: ArtStyle): Promise<string> => {
  try {
    const response = await fetch(getApiUrl('/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'world_icon', gameName, style })
    });
    if (!response.ok) throw new Error('Failed to generate world icon');
    const data = await response.json();
    return data.image;
  } catch (error) {
    console.error("Error generating world icon:", error);
    throw error;
  }
};

/**
 * Generates a top-down Game Board / Playmat background with custom texture and color.
 */
export const generateBoardArt = async (
  gameName: string,
  style: ArtStyle,
  boardType: string,
  texture: string,
  primaryColor: string
): Promise<string> => {
  try {
    const response = await fetch(getApiUrl('/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'board_art', gameName, style, boardType, texture, primaryColor })
    });
    if (!response.ok) throw new Error('Failed to generate board art');
    const data = await response.json();
    return data.image;
  } catch (error) {
    console.error("Error generating board art:", error);
    throw error;
  }
};

export const generateCardFluff = async (name: string, type: string, gameContext: string): Promise<string> => {
  try {
    const response = await fetch(getApiUrl('/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'card_fluff', name, type, gameContext })
    });
    if (!response.ok) throw new Error('Failed to generate card fluff');
    const data = await response.json();
    return data.text;
  } catch (error) {
    return "A mysterious force surrounds this card...";
  }
};

export interface CodexSlot {
  archetype: string;
  hint: string;
}

export const generatePromoCards = async (
  gameName: string,
  rulesText: string,
  customSlots?: CodexSlot[]
): Promise<PromoCard[]> => {
  try {
    const response = await fetch(getApiUrl('/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'promo_cards', gameName, rulesText, customSlots })
    });
    if (!response.ok) throw new Error('Failed to generate promo cards');
    const data = await response.json();
    return JSON.parse(data.text || "[]");
  } catch (e) {
    return [
      { title: "Welcome", description: "A new world awaits.", icon: "fa-door-open" },
      { title: "Battle", description: "Defeat your foes.", icon: "fa-sword" },
      { title: "Win", description: "Claim victory.", icon: "fa-trophy" }
    ];
  }
}

export const generateRuleAssistance = async (
  gameName: string,
  winCondition: string,
  resourceSystem: string,
  boardType: BoardType
): Promise<string> => {
  try {
    const response = await fetch(getApiUrl('/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rule_assistance', gameName, winCondition, resourceSystem, boardType })
    });
    if (!response.ok) throw new Error('Failed to generate rules');
    const data = await response.json();
    return data.text || "";
  } catch (error) {
    return "The rulebook is lost to time.";
  }
};
