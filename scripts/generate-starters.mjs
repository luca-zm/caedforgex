import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

// Using node --env-file=.env.local for environment variables

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey || apiKey === "PLACEHOLDER_API_KEY") {
    console.error("ERROR: Please set a valid GEMINI_API_KEY in .env.local");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const STYLE_PROMPT = "Vector art, flat design, minimalist, clean, bold shapes, tarot card style, vibrant colors";

const CARDS = [
    { id: 'start_land_1', name: 'Neon Citadel', type: 'Land', desc: 'Grants +1 Max Mana.' },
    { id: 'start_land_2', name: 'Ancient Ruins', type: 'Land', desc: 'Grants +1 Max Mana.' },
    { id: 'start_land_3', name: 'Orbital Station', type: 'Land', desc: 'Grants +1 Max Mana.' },
    { id: 'start_land_4', name: 'Deep Forest', type: 'Land', desc: 'Grants +1 Max Mana.' },
    { id: 'start_unit_1', name: 'Scout Drone', type: 'Unit', desc: 'Fast and cheap.' },
    { id: 'start_unit_2', name: 'Goblin Grunt', type: 'Unit', desc: 'Haste.' },
    { id: 'start_unit_3', name: 'Cyber Wolf', type: 'Unit', desc: 'A relentless hunter.' },
    { id: 'start_unit_4', name: 'Shield Bearer', type: 'Unit', desc: 'A solid defense.' },
    { id: 'start_unit_5', name: 'Plasma Marine', type: 'Unit', desc: 'Standard infantry.' },
    { id: 'start_unit_6', name: 'Arcane Mage', type: 'Unit', desc: 'Damage 2 to opponent.' },
    { id: 'start_unit_7', name: 'Mech Titan', type: 'Unit', desc: 'Heavy armor.' },
    { id: 'start_unit_8', name: 'Void Dragon', type: 'Unit', desc: 'Flying terror.' },
    { id: 'start_spell_1', name: 'Fireball', type: 'Spell', desc: 'Deal 3 Damage to opponent.' },
    { id: 'start_spell_2', name: 'Data Leak', type: 'Spell', desc: 'Draw 2 Cards.' },
    { id: 'start_spell_3', name: 'Nano Repair', type: 'Spell', desc: 'Heal 5 Health.' },
    { id: 'start_spell_4', name: 'Overclock', type: 'Spell', desc: 'Buff Target Unit.' },
    { id: 'start_spell_5', name: 'System Crash', type: 'Spell', desc: 'Destroy all units.' },
    { id: 'start_spell_6', name: 'Energy Shield', type: 'Spell', desc: 'Heal 3.' },
    { id: 'start_art_1', name: 'Mana Prism', type: 'Artifact', desc: 'Start turn with +1 Mana.' },
    { id: 'start_art_2', name: 'Auto Turret', type: 'Artifact', desc: 'Deal 1 Damage at start of turn.' }
];

const OUTPUT_DIR = path.join(process.cwd(), "public", "starter");

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateCardImage(card) {
    const filePath = path.join(OUTPUT_DIR, `${card.id}.png`);

    // Skip if already generated (useful for resuming if rate limited)
    if (fs.existsSync(filePath)) {
        console.log(`Skipping ${card.name} (${card.id}), image already exists.`);
        return;
    }

    console.log(`Generating image for: ${card.name} (${card.type})...`);

    const prompt = `A centered, iconic illustration of "${card.name}". It is a ${card.type} card for a digital trading card game. Concept: ${card.desc}. Style: ${STYLE_PROMPT}. No text, no borders, just the central artwork artwork.`;

    try {
        const responseList = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseModalities: ["IMAGE"]
            },
        });

        if (responseList.candidates && responseList.candidates[0].content && responseList.candidates[0].content.parts) {
            for (const part of responseList.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    const imgBuffer = Buffer.from(part.inlineData.data, "base64");
                    fs.writeFileSync(filePath, imgBuffer);
                    console.log(`✅ Saved ${card.id}.png`);
                    return;
                }
            }
        }
        console.error(`❌ Failed to find inlineData for ${card.name}`);

    } catch (e) {
        console.error(`❌ Error generating ${card.name}:`, e.message);
    }
}

async function main() {
    console.log("Starting starter deck image generation (20 cards)...");

    for (let i = 0; i < CARDS.length; i++) {
        await generateCardImage(CARDS[i]);
        // Sleep for 10 seconds to respect Nano Banana free tier quotas and avoid rate limits
        if (i < CARDS.length - 1) {
            console.log("Sleeping for 10 seconds to prevent rate limiting...");
            await new Promise(r => setTimeout(r, 10000));
        }
    }

    console.log("🎉 All 20 cards processed!");
}

main();
