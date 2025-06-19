import { router, publicProcedure } from '../trpc'
import { z } from 'zod'

const GameSchema = z.object({
    gameName: z.string(),
    bggId: z.string().nullable().optional() // less reliable variable until i implement canonicalization
})

export const aiRouter = router({
    identifyGamesInImage: publicProcedure
        .input(z.object({ imageDataUrl: z.string() })) //the Base 64 data from user's image
        .mutation(async ({ input }) => {
            // First: contact Gemini Vision to identify games
            const { imageDataUrl } = input // im starting to understand this type of destructure
            // --- NEW CRITICAL DEBUG LOGS ---
            console.log("DEBUG: Raw imageDataUrl received (first 100 chars):", imageDataUrl ? imageDataUrl.substring(0, Math.min(100, imageDataUrl.length)) : 'null/undefined/empty');
            console.log("DEBUG: Full imageDataUrl length:", imageDataUrl ? imageDataUrl.length : 'null/undefined/empty');
            console.log("DEBUG: Does imageDataUrl contain a comma? ", imageDataUrl ? imageDataUrl.includes(',') : false);
            // --- END NEW CRITICAL DEBUG LOGS ---

            const parts = imageDataUrl.split(',');
            console.log("DEBUG: Parts array after split:", parts);
            console.log("DEBUG: Parts array length:", parts.length);

            const base64Image = parts.length > 1 ? parts[1] : '';
            // DEBUGGING
            const mimeTypeMatch = imageDataUrl.match(/^data:(.*?);base64,/);
            const dynamicMimeType = mimeTypeMatch && mimeTypeMatch[1] ? mimeTypeMatch[1] : 'image/jpeg'; // Default to jpeg if extraction fails
            
            console.log("DEBUG: Dynamically determined mimeType:", dynamicMimeType);
            console.log("DEBUG: Type of base64Image:", typeof base64Image);
            console.log("DEBUG: Length of base64Image:", base64Image ? base64Image.length : 'null/undefined');
            if (base64Image) {
                console.log("DEBUG: First 50 chars of base64Image:", base64Image.substring(0, 50));
                console.log("DEBUG: Last 50 chars of base64Image:", base64Image.substring(base64Image.length - 50, base64Image.length));
            } else {
                console.log("DEBUG: base64Image is null or undefined.");
            }
            const visionPrompt = "Identify all unique board game titles visible in this image. List them as a comma-separated string, e.g., 'Catan, Ticket to Ride, Splendor'. If no board games are identified, respond with 'None'."
            
            let rawIdentifiedNames: string[]= []

            try {
                const apiKey = process.env.GEMINI_API_KEY

                const visionPayload = {
                    contents: [
                        {
                            role: "user",
                            parts: [
                                { text: visionPrompt },
                                {
                                    inline_data: {
                                        mime_type: "image/jpeg",
                                        data: base64Image
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.2,       // Make it more focused on identification
                        maxOutputTokens: 50,
                    }
                };
                console.log("Vision API Payload:", JSON.stringify(visionPayload, null, 2));
                const visionApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                const visionResponse = await fetch(visionApiUrl, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(visionPayload)
                })

                if (!visionResponse.ok) {
                    const errorBody = await visionResponse.text()
                    throw new Error(`Gemini Vision API failed: ${visionResponse.status} ${visionResponse.statusText} - ${errorBody}`)
                }

                const visionResult = await visionResponse.json()
                console.log("Raw Vision Response:", JSON.stringify(visionResult, null, 2));
                const visionText = visionResult.candidates?.[0]?.content?.parts?.[0]?.text // resolve to undefined if any property is missing

                if(visionText && visionText.toLowerCase().trim() !== 'none' && visionText.trim() !== ''){
                    rawIdentifiedNames = visionText.split(',').map((name: string) => name.trim()).filter((name: string) => name.length > 0)
                }
                console.log("Gemini Vision identified: ", rawIdentifiedNames);
            } catch(error){
                console.error('Image identification error: ', error)
            }

            /* NEXT: Canonicalize the games to validate and ensure consistency */
            const canonicalizationPrompt = `Given the following list of potential board game titles: ${rawIdentifiedNames.join(', ')}.
                 Please verify which of these are actual, real board game titles. For each real game, provide its most common, canonical name.
                 Format your response as a JSON array of objects, like this:
                 [{"gameName": "Canonical Game Name"}, {"gameName": "Another Canonical Game Name"}]
                 Do not include any games that are not real board games.`;

            try {
                const apiKey = process.env.GEMINI_API_KEY
                
                const textPayload = {
                    contents: [
                        { role: 'user',
                          parts: [{ text: canonicalizationPrompt}]
                        }
                    ],
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    "gameName": { "type": "STRING" }
                                },
                                "required": ["gameName"]
                            }
                        }
                    }
                }
                const textApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                
                const textResponse = await fetch(textApiUrl, {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json'},
                    body: JSON.stringify(textPayload)
                })

                if (!textResponse.ok){
                    const errorBody = await textResponse.text()
                    console.error("Gemini text API error: ", errorBody)
                    throw new Error(`Gemini text API call failed: ${textResponse.status} ${textResponse.statusText} - ${errorBody}`);
                }

                const textResult = await textResponse.json()
                console.log("Gemini canon result: ", textResult);

                const jsonString = textResult.candidates?.[0]?.content?.parts?.[0]?.text;
                let canonicalizedGames: { gameName: string; bggId: null }[] = []; 

                if(jsonString){
                    const parsedJson = JSON.parse(jsonString)
                    const validated = z.array(GameSchema.pick({ gameName: true })).parse(parsedJson)
                    canonicalizedGames = validated.map(game => ({ ...game, bggId: null}))
                    console.log("Gemini canond games", canonicalizedGames);
                }
                return canonicalizedGames
            } catch (error) {
                console.error('Game validation error', error)
            }
        })
})