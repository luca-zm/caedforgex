
import { GoogleGenAI } from "@google/genai";
import { ArtStyle, BoardType, PromoCard } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getStylePrompt = (style: ArtStyle): string => {
  switch (style) {
    case 'FANTASY_OIL': return "Oil painting style, classical fantasy, highly detailed, dramatic lighting, Magic the Gathering style";
    case 'CYBERPUNK': return "Cyberpunk 2077 style, neon lights, high tech, low life, futuristic, digital art, glitch effects";
    case 'PIXEL_ART': return "16-bit pixel art, retro game style, vibrant colors, clean lines";
    case 'ANIME': return "Anime style, cell shaded, Studio Ghibli inspired, expressive, vibrant";
    case 'LOVECRAFT': return "Eldritch horror style, dark, gloomy, sketching, etching style, mysterious";
    case 'MINIMALIST': return "Vector art, flat design, minimalist, clean, bold shapes, tarot card style";
    default: return "Digital art, high quality";
  }
};

/**
 * Generates an abstract UI background for a specific section (e.g., "Health Mechanics").
 */
export const generateUIBackground = async (topic: string, style: ArtStyle): Promise<string> => {
    try {
      const styleInstruction = getStylePrompt(style);
      const finalPrompt = `Abstract wallpaper texture representing ${topic}. 
      Style: ${styleInstruction}. 
      Dark, atmospheric, subtle, high contrast, no text, no characters. 
      Suitable for a UI card background.`;
  
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: finalPrompt }],
        },
        config: {
          imageConfig: { aspectRatio: "16:9" },
        },
      });
  
      if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      throw new Error("No UI image generated.");
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
    const styleInstruction = getStylePrompt(style);
    const finalPrompt = `${styleInstruction}. Subject: ${prompt}. Centered composition, no text, trading card illustration.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: finalPrompt }],
      },
      config: {
        imageConfig: { aspectRatio: "3:4" },
      },
    });

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image generated.");
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
      const styleInstruction = getStylePrompt(style);
      const finalPrompt = `App icon for a game called "${gameName}". 
      Style: ${styleInstruction}. 
      Centered, simple, high contrast, no text. 
      Mobile app icon design.`;
  
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: finalPrompt }],
        },
        config: {
          imageConfig: { aspectRatio: "1:1" },
        },
      });
  
      if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      throw new Error("No icon generated.");
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
      const styleInstruction = getStylePrompt(style);
      // Specific prompt for a playmat/board with user customization
      const finalPrompt = `Top down view of a card game battle arena (playmat) for a game called "${gameName}". 
      Style: ${styleInstruction}. 
      Layout: ${boardType}.
      Material/Texture: ${texture}.
      Primary Accent Color: ${primaryColor}.
      The center should be relatively empty or have faint markings to place cards. 
      The edges should be highly decorated with ${style} elements. 
      High contrast, symmetrical, professional game asset, no text.`;
  
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: finalPrompt }],
        },
        config: {
          imageConfig: { aspectRatio: "9:16" }, // Mobile portrait aspect ratio
        },
      });
  
      if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      throw new Error("No board image generated.");
    } catch (error) {
      console.error("Error generating board art:", error);
      throw error;
    }
};

export const generateCardFluff = async (name: string, type: string, gameContext: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context: A card game about "${gameContext}". Write a 1-sentence flavor text/effect for a ${type} card named "${name}". make it sound epic.`,
    });
    return response.text || "";
  } catch (error) {
    return "A mysterious force surrounds this card...";
  }
};

export interface CodexSlot {
    archetype: string;
    hint: string;
}

/**
 * Generates 3 promo cards summarizing the game rules with optional user guidance.
 */
export const generatePromoCards = async (
    gameName: string, 
    rulesText: string,
    customSlots?: CodexSlot[]
): Promise<PromoCard[]> => {
    try {
        let instructions = `
            Read these game rules for "${gameName}":
            ${rulesText}

            Create exactly 3 short "Promo Cards" to teach a new player the vibe and mechanics.
        `;

        if (customSlots && customSlots.length === 3) {
            instructions += `
                STRICTLY FOLLOW these 3 card requests:
                1. Type/Role: ${customSlots[0].archetype}. Theme/Content: ${customSlots[0].hint || 'AI Choice'}.
                2. Type/Role: ${customSlots[1].archetype}. Theme/Content: ${customSlots[1].hint || 'AI Choice'}.
                3. Type/Role: ${customSlots[2].archetype}. Theme/Content: ${customSlots[2].hint || 'AI Choice'}.
            `;
        } else {
            instructions += `Make them diverse (e.g., one Unit, one Spell, one Boss/Finisher).`;
        }

        instructions += `
            Return JSON format: Array of objects with keys: title (max 3 words), description (max 15 words), icon (a font-awesome class name like 'fa-skull', 'fa-bolt', 'fa-flag').

            Example:
            [
                {"title": "Cosmic War", "description": "Battle for control of the galaxy using starships.", "icon": "fa-rocket"},
                ...
            ]
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: instructions,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text || "[]";
        return JSON.parse(text);
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Act as a Game Designer. Create a concise, structured rule summary for a card game called "${gameName}".
        
        Game Inputs:
        - Win Condition: ${winCondition}
        - Resources: ${resourceSystem}
        - Board Type: ${boardType}
        
        Output Format (Markdown):
        ## Objective
        [Explain how to win based on input]
        
        ## Setup & Board
        [Explain the ${boardType} layout]
        
        ## Turn Sequence
        1. Draw
        2. Action
        3. End
        
        ## Mechanics
        [Explain resources and combat]
      `,
    });
    return response.text || "";
  } catch (error) {
    return "The rulebook is lost to time.";
  }
};
