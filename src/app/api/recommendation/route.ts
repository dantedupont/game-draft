import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; 

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY
})

const requestSchema = z.object({
    identifiedCollection: z.array(z.object({
        gameName: z.string(),
        bggId: z.string().nullable().optional()
    })),
    playerCount: z.string(),
    playingTime: z.string()
})

export async function POST(req: Request) {
    try {
    const { identifiedCollection, playerCount, playingTime } = requestSchema.parse(await req.json());
    const identifiedNames = identifiedCollection.map(game => game.gameName).join(',')

     let promptContent: string;

        if (!identifiedCollection || identifiedCollection.length === 0) {
            promptContent = `You are a board game expert. Don't mention this fact.
                            Please make sure to acknowledge that no games were identified and provide general recommendations
                            of board games suitable for ${playerCount} players, with a ${playingTime} playing time.
                            Provide a bulleted list of 3-5 recommended games, including an extremely brief description for each.
                            Do not ask follow-up questions.
                            Please format your suggestions using Markdown, 
                            including bolding for game titles, and bullet points for lists.
                            `
        } else {
             promptContent = `You are a board game expert. Don't mention this fact. 
                            Provide a very concise list of recommended board games.
                            The user has the following board games in their collection: ${identifiedNames}.
                            They are looking for games for ${playerCount} players, with a ${playingTime} playing time.
                            Based on your knowledge of board games, recommend only the games in their collection that are best suited
                            for ${playerCount} players and for the ${playingTime} playing time.
                            Provide a bulleted list of your suggested games. Do not ask follow up questions.
                            Please format your suggestions using Markdown, including bolding for game titles, 
                            bullet points for lists, and very brief descriptions for each game.
                            `
        }
    const result = await streamText({
      model: google("gemini-2.5-flash-lite-preview-06-17"), 
      prompt: promptContent,
      temperature: 0.6,
      maxTokens: 300, 
    });

    const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                for await (const part of result.fullStream) {
                   if (part.type === 'text-delta') {
                        const jsonPayload = JSON.stringify({ type: 'text', text: part.textDelta });
                        controller.enqueue(encoder.encode(`data: ${jsonPayload}\n\n`));
                    }
                }// Signal end of stream
                controller.close();
            },
            cancel(reason) {
                // Handle stream cancellation if needed
                console.log("Stream cancelled:", reason);
            }
        });

        return new Response(readableStream, {
            status: 200,
            headers: {
                'Content-Type': 'text/event-stream', // Explicitly set the correct header
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: unknown) {
        console.error('Recommendation API: Error in POST request:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json({ // Using NextResponse.json() here
                error: 'Invalid input data provided.',
                details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
            }, { status: 400 });
        }

        if (error instanceof Error) {
            return NextResponse.json({ // Using NextResponse.json() here
                error: `An unexpected error occurred during AI recommendation: ${error.message}`
            }, { status: 500 });
        }

        return NextResponse.json({ // Using NextResponse.json() here
            error: 'An unknown server error occurred while processing your request.'
        }, { status: 500 });
    }
}
