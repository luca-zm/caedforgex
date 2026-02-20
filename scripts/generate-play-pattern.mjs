import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

const OUT_DIR = path.join(process.cwd(), 'public', 'arenas');
if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function generatePattern() {
    console.log(`Starting generation of play pattern background...`);
    const prompt = "A dark, perfectly seamless, repeating geometric pattern background, very subtle dark blue and black obsidian tiles, minimal, elegant, isometric grid, suitable for a professional card game UI background, low contrast.";

    try {
        const responseImg = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
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
                    const filePath = path.join(OUT_DIR, `play_pattern_bg.png`);
                    fs.writeFileSync(filePath, buffer);
                    console.log(`✅ Saved play_pattern_bg.png`);
                    found = true;
                    break;
                }
            }
            if (!found) console.warn(`⚠️ No inlineData found for play pattern`);
        } else {
            console.warn(`⚠️ Unexpected response format`);
        }
    } catch (e) {
        console.error(`❌ Error generating play pattern:`, e.message);
    }
}

generatePattern();
