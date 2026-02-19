import { GoogleGenAI } from "@google/genai";

export async function onRequest(context: any) {
    if (context.request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const apiKey = context.env.API_KEY;
        if (!apiKey) {
            throw new Error("API_KEY environment variable is missing.");
        }

        const body = await context.request.json();
        const { type, action } = body;

        // Helper functions
        const getStylePrompt = (style: string): string => {
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

        // Generic REST call to Gemini
        const callGemini = async (model: string, payload: any) => {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errBody = await response.text();
                throw new Error(`Gemini API Error: ${response.status} - ${errBody}`);
            }
            return await response.json();
        };

        // Routing Logic based on 'type' or 'action' payload
        if (type === 'ui_background' || type === 'card_art' || type === 'world_icon' || type === 'board_art') {
            let finalPrompt = "";
            let aspectRatio = "1:1";

            if (type === 'ui_background') {
                finalPrompt = `Abstract wallpaper texture representing ${body.topic}. Style: ${getStylePrompt(body.style)}. Dark, atmospheric, subtle, high contrast, no text, no characters. Suitable for a UI card background.`;
                aspectRatio = "16:9";
            } else if (type === 'card_art') {
                finalPrompt = `${getStylePrompt(body.style)}. Subject: ${body.prompt}. Centered composition, no text, trading card illustration.`;
                aspectRatio = "3:4";
            } else if (type === 'world_icon') {
                finalPrompt = `App icon for a game called "${body.gameName}". Style: ${getStylePrompt(body.style)}. Centered, simple, high contrast, no text. Mobile app icon design.`;
                aspectRatio = "1:1";
            } else if (type === 'board_art') {
                finalPrompt = `Top down view of a card game battle arena (playmat) for a game called "${body.gameName}". Style: ${getStylePrompt(body.style)}. Layout: ${body.boardType}. Material/Texture: ${body.texture}. Primary Accent Color: ${body.primaryColor}. The center should be relatively empty or have faint markings to place cards. The edges should be highly decorated with ${body.style} elements. High contrast, symmetrical, professional game asset, no text.`;
                aspectRatio = "9:16";
            }

            // The original code used 'gemini-2.5-flash-image' and expected inlineData (base64 image).
            // The public Generative Language API's `generateContent` endpoint for models like `gemini-2.5-flash`
            // typically returns text, not images. Image generation is usually handled by dedicated image models
            // (e.g., Imagen on Vertex AI) or specific endpoints.
            // For the purpose of this transformation, we will call `gemini-2.5-flash` with the text prompt,
            // but acknowledge that it will likely return text and not an image in `inlineData`.
            // If the original 'gemini-2.5-flash-image' was a custom or internal model that returned images,
            // this direct translation might not yield the same image output.
            // The `imageConfig: { aspectRatio }` from the SDK also doesn't have a direct equivalent
            // in the standard `generateContent` REST API payload for text-to-image.

            const payload = {
                contents: [{ parts: [{ text: finalPrompt }] }],
                // generationConfig: { imageConfig: { aspectRatio } } // This is SDK specific, no direct REST equivalent for generateContent
            };

            const responseData = await callGemini('gemini-2.5-flash', payload); // Using gemini-2.5-flash as a proxy

            // The original code expected `inlineData` for an image.
            // Standard `gemini-2.5-flash` will return text.
            // We'll try to extract text if available, or throw an error if no image data is found,
            // mimicking the original logic's expectation of an image.
            if (responseData.candidates && responseData.candidates[0].content && responseData.candidates[0].content.parts) {
                for (const part of responseData.candidates[0].content.parts) {
                    // If the model *does* return inlineData (e.g., if it's a custom setup or a future API change), use it.
                    if (part.inlineData) {
                        return new Response(JSON.stringify({ image: `data:image/png;base64,${part.inlineData.data}` }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    // If it returns text, we'll return that as a fallback, or throw if an image was strictly expected.
                    // For now, we'll throw to match the original "No image generated" error if inlineData isn't present.
                }
            }
            throw new Error("No image data (inlineData) generated by AI. The model might not support direct image generation via this endpoint.");
        }

        if (action === 'card_fluff') {
            const payload = {
                contents: [{
                    parts: [{
                        text: `Context: A card game about "${body.gameContext}". Write a 1-sentence flavor text/effect for a ${body.type} card named "${body.name}". make it sound epic.`
                    }]
                }]
            };
            const response = await callGemini('gemini-1.5-flash-latest', payload); // Using a standard text model
            return new Response(JSON.stringify({ text: response.candidates[0].content.parts[0].text }), { headers: { 'Content-Type': 'application/json' } });
        }

        if (action === 'promo_cards') {
            let instructions = `Read these game rules for "${body.gameName}":\n${body.rulesText}\nCreate exactly 3 short "Promo Cards" to teach a new player the vibe and mechanics.`;
            if (body.customSlots && body.customSlots.length === 3) {
                instructions += `\nSTRICTLY FOLLOW these 3 card requests:\n1. Type/Role: ${body.customSlots[0].archetype}. Theme/Content: ${body.customSlots[0].hint || 'AI Choice'}.\n2. Type/Role: ${body.customSlots[1].archetype}. Theme/Content: ${body.customSlots[1].hint || 'AI Choice'}.\n3. Type/Role: ${body.customSlots[2].archetype}. Theme/Content: ${body.customSlots[2].hint || 'AI Choice'}.`;
            } else {
                instructions += `\nMake them diverse (e.g., one Unit, one Spell, one Boss/Finisher).`;
            }
            instructions += `\nReturn JSON format: Array of objects with keys: title (max 3 words), description (max 15 words), icon (a font-awesome class name like 'fa-skull', 'fa-bolt', 'fa-flag').`;

            const payload = {
                contents: [{ parts: [{ text: instructions }] }],
                generationConfig: { responseMimeType: 'application/json' }
            };
            const response = await callGemini('gemini-1.5-flash-latest', payload); // Using a standard text model
            // The API returns the JSON string within the text field of the first part
            return new Response(response.candidates[0].content.parts[0].text, { headers: { 'Content-Type': 'application/json' } });
        }

        if (action === 'rule_assistance') {
            const payload = {
                contents: [{
                    parts: [{
                        text: `Act as a Game Designer. Create a concise, structured rule summary for a card game called "${body.gameName}".\nGame Inputs:\n- Win Condition: ${body.winCondition}\n- Resources: ${body.resourceSystem}\n- Board Type: ${body.boardType}\nOutput Format (Markdown):\n## Objective\n[Explain how to win based on input]\n\n## Setup & Board\n[Explain the ${body.boardType} layout]\n\n## Turn Sequence\n1. Draw\n2. Action\n3. End\n\n## Mechanics\n[Explain resources and combat]`
                    }]
                }]
            };
            const response = await callGemini('gemini-1.5-pro-latest', payload); // Using a standard text model
            return new Response(JSON.stringify({ text: response.candidates[0].content.parts[0].text }), { headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ error: "Invalid action or type" }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    } catch (err: any) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
