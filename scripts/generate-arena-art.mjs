import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

const STYLES = {
    bg: "2D minimalist vector art, clean shapes, no text, atmospheric, low detail, suitable for a dark UI background layer, moody lighting. ",
    card: "Card game poster art, minimalist vector illustration, highly stylized, vibrant, clean flat colors, exciting, dynamic. "
};

const ART_REQUESTS = [
    {
        id: 'arena_training_bg',
        prompt: `${STYLES.bg} A peaceful heavily stylized forest clearing or training grounds at dusk, soft glowing light, target dummies.`
    },
    {
        id: 'arena_training_card',
        prompt: `${STYLES.card} A cute but fierce mechanical training dummy or wooden sparring robot standing in a glowing forest.`
    },
    {
        id: 'arena_1_bg',
        prompt: `${STYLES.bg} A dark imposing stone colosseum interior, lit by braziers, sandy floor, dramatic shadows, gladiatorial arena.`
    },
    {
        id: 'arena_1_card',
        prompt: `${STYLES.card} A grand and imposing colosseum arena entrance, crossing swords banner, glowing torches, epic competitive vibe.`
    }
];

const OUT_DIR = path.join(process.cwd(), 'public', 'arenas');
if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function generateAll() {
    console.log(`Starting generation of ${ART_REQUESTS.length} arena images...`);
    for (const art of ART_REQUESTS) {
        console.log(`Generating [${art.id}]...`);
        try {
            const responseImg = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: art.prompt }] },
                config: {
                    responseModalities: ["IMAGE"]
                },
            });

            if (responseImg.candidates && responseImg.candidates[0].content && responseImg.candidates[0].content.parts) {
                let found = false;
                for (const part of responseImg.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        const base64 = part.inlineData.data;
                        const buffer = Buffer.from(base64, 'base64');
                        const filePath = path.join(OUT_DIR, `${art.id}.png`);
                        fs.writeFileSync(filePath, buffer);
                        console.log(`✅ Saved ${art.id}.png`);
                        found = true;
                        break;
                    }
                }
                if (!found) console.warn(`⚠️ No inlineData found for ${art.id}`);
            } else {
                console.warn(`⚠️ Unexpected response format for ${art.id}`);
            }
        } catch (e) {
            console.error(`❌ Error generating ${art.id}:`, e.message);
        }

        // Anti rate-limit sleep
        console.log("Sleeping 2s...");
        await new Promise(r => setTimeout(r, 2000));
    }
    console.log("Done generating arena art!");
}

generateAll();
