import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

const STYLES = {
    rules: "Flat vector UI art, clean minimalist shapes, solid vibrant colors, dramatic lighting, highly stylized trading card game aesthetic, 2D mobile game asset, UI illustration. NO text. Abstract representation. "
};

const RULES_ART = [
    {
        id: 'rule_deck',
        prompt: `${STYLES.rules} A beautifully organized deck of 20 playing cards floating magically. A glowing holographic number 20 hovers above them. A glowing holographic number 4 hovers above a hand of cards.`
    },
    {
        id: 'rule_energy',
        prompt: `${STYLES.rules} A glowing blue energy crystal or mana gem recharging. Sparks of magical power radiating outward in a bright burst, symbolizing +1 energy gain per turn.`
    },
    {
        id: 'rule_combat',
        prompt: `${STYLES.rules} Two stylized fantasy characters or abstract avatars clashing in combat. A bright explosion or impact effect in the center. A health bar depleting to zero.`
    }
];

const OUT_DIR = path.join(process.cwd(), 'public', 'rules');
if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function generateAll() {
    console.log(`Starting generation of ${RULES_ART.length} rules images...`);
    for (const art of RULES_ART) {
        console.log(`Generating [${art.id}]...`);
        try {
            const response = await ai.models.generateImages({
                model: 'imagen-3.0-generate-002',
                prompt: art.prompt,
                config: {
                    numberOfImages: 1,
                    aspectRatio: "16:9",
                    outputMimeType: "image/png"
                }
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64 = response.generatedImages[0].image.imageBytes;
                const buffer = Buffer.from(base64, 'base64');
                const filePath = path.join(OUT_DIR, `${art.id}.png`);
                fs.writeFileSync(filePath, buffer);
                console.log(`✅ Saved ${art.id}.png`);
            } else {
                console.warn(`⚠️ No image returned for ${art.id}`);
            }
        } catch (e) {
            console.error(`❌ Error generating ${art.id}:`, e.message);
        }

        // Anti rate-limit sleep
        console.log("Sleeping 2s...");
        await new Promise(r => setTimeout(r, 2000));
    }
    console.log("Done generating rules art!");
}

generateAll();
