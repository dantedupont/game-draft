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
            const base64Image = imageDataUrl.split(','[1])
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
                                    inlineData: {
                                        mimeType: "image/jpeg",
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
                const visionApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                const visionResponse = await fetch(visionApiUrl, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(visionPayload)
                })

                if (!visionResponse.ok) {
                    const errorBody = await visionResponse.text
                    throw new Error(`Gemini Vision API failed: ${visionResponse.status} ${visionResponse.statusText} - ${errorBody}`)
                }

                const visionResult = await visionResponse.json()
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