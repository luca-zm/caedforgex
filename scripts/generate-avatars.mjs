import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

// Define the avatars we want to generate
const AVATARS = [
    {
        id: 'avatar_cyberpunk',
        prompt: 'A premium, highly detailed, centered headshot avatar icon of a Cyberpunk Hacker with neon blue and pink glowing augments, clean vector art style, thick borders, solid dark background, Nintendo style UI icon, vibrant colors.'
    },
    {
        id: 'avatar_fantasy',
        prompt: 'A premium, highly detailed, centered headshot avatar icon of a high fantasy elven mage with glowing purple eyes and gold trim hood, clean vector art style, thick borders, solid dark background, Nintendo style UI icon, vibrant colors.'
    },
    {
        id: 'avatar_paladin',
        prompt: 'A premium, highly detailed, centered headshot avatar icon of a heavily armored holy crusader knight paladin with a glowing winged helmet, clean vector art style, thick borders, solid dark background, Nintendo style UI icon, vibrant colors.'
    },
    {
        id: 'avatar_lovecraft',
        prompt: 'A premium, highly detailed, centered headshot avatar icon of a creepy cultist warlock with a deep green hooded robe and glowing green tentacle magic, clean vector art style, thick borders, solid dark background, Nintendo style UI icon, vibrant colors.'
    },
    {
        id: 'avatar_pixel',
        prompt: 'A premium, highly detailed, centered headshot avatar icon of a retro 16-bit pixel art hero with a red headband and sword hilt over shoulder, clean colorful minimalist style, thick borders, solid dark background, Nintendo style UI icon, vibrant colors.'
    },
    {
        id: 'avatar_scifi',
        prompt: 'A premium, highly detailed, centered headshot avatar icon of a futuristic galactic space marine with a shiny orange and white visor helmet, clean vector art style, thick borders, solid dark background, Nintendo style UI icon, vibrant colors.'
    }
];

// Initialize GenAI client
// Assuming GEMINI_API_KEY is available in the environment when the script runs
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateAvatars() {
    const outDir = path.join(process.cwd(), 'public', 'avatars');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    console.log(`Generating ${AVATARS.length} premium avatars...`);

    for (const avatar of AVATARS) {
        console.log(`Generating: ${avatar.id}...`);
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: avatar.prompt }] },
                config: {
                    responseModalities: ["IMAGE"],
                    aspectRatio: '1:1', // Perfect square for avatars
                }
            });

            if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
                let found = false;
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        const base64Data = part.inlineData.data;
                        const buffer = Buffer.from(base64Data, 'base64');
                        const filePath = path.join(outDir, `${avatar.id}.png`);
                        fs.writeFileSync(filePath, buffer);
                        console.log(`✅ Saved: ${filePath}`);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    console.error(`❌ No image data found in response for ${avatar.id}`);
                }
            } else {
                console.error(`❌ Failed to generate image for ${avatar.id}`);
            }
        } catch (error) {
            console.error(`❌ Error generating ${avatar.id}:`, error);
        }

        // Brief pause to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log("Avatar generation complete!");
}

generateAvatars();
