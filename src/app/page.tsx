'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { toast, Toaster } from 'sonner'
import Image from 'next/image'
import { trpc } from '@/trpc/client'

import { Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card'
import ImageInput from './ImageInput';
import Recommendations from './Recommendations';
import Preferences from './Preferences'

export default function HomePage(){
  const [isMobile, setIsMobile] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [directRecommendationOutput, setDirectRecommendationOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // Preference Selectors
  const [playerCount, setPlayerCount] = useState('')
  const [playingTime, setPlayingTime] = useState('')

  //tRPC hooks
  const identifyGamesMutation = trpc.ai.identifyGamesInImage.useMutation();

  // check for mobile to use video feed
  useEffect(() => {
    const checkMobile = () => {
      const mobileCheck = window.innerWidth < 768;
      return mobileCheck;
    };
    setIsMobile(checkMobile());

    const handleResize = () => {
      const mobileCheck = window.innerWidth < 768;
      setIsMobile(mobileCheck);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  ////////////////////////
  //RECOMMENDATIONS///////
  ////////////////////////
  const makeRecommendations = useCallback(async () => {
    setDirectRecommendationOutput('');

    if (!image) {
      toast.error("Please provide an image first.");
      return;
    }
    if (!playerCount || !playingTime) {
      toast.error("Please select a player count and playing time");
      return;
    }

    setIsLoading(true)

    const identified = await identifyGamesMutation.mutateAsync({
        imageDataUrl: image,
    });
    toast.success(`I found some games!`);

    try {
        const response = await fetch('/api/recommendation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // This is for the request body
            },
            body: JSON.stringify({
                identifiedCollection: identified || [],
                playerCount,
                playingTime
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Body: ${errorBody}`);
        }

        const reader = response.body?.getReader();
        if (!reader){
          console.error("Failed to get stream reader from response")
          return
        }

        const decoder = new TextDecoder();
        let fullStreamText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            const chunk = decoder.decode(value, { stream: true });
            console.log("Raw SSE Chunk received:", chunk); // Log the raw chunk

            // Parse SSE data: Look for 'data: {json}\n'
            // Split by newline to handle multiple SSE messages in one chunk
            const lines = chunk.split('\n').filter(line => line.trim().length > 0);

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.substring(5).trim(); // Remove 'data: ' prefix and trim
                    if (jsonStr === '[DONE]') { // Check for the specific [DONE] signal
                        console.log("SSE [DONE] signal received.");
                        break; // Exit the loop as stream is done
                    }
                    try {
                        const parsedData = JSON.parse(jsonStr);
                        if (parsedData && typeof parsedData.text === 'string') {
                            fullStreamText += parsedData.text;
                            setDirectRecommendationOutput(prev => prev + parsedData.text);
                        } else {
                            console.warn("SSE data line missing 'text' property or not a string:", parsedData);
                        }
                    } catch (parseError) {
                        console.error("Failed to parse JSON from SSE line:", jsonStr, parseError);
                        toast.error("Error parsing stream data.");
                    }
                } else {
                    console.warn("Unexpected SSE line format:", line); // Log any lines not starting with 'data: '
                }
            }
        }
        console.log("Full direct recommendation output:", fullStreamText);

     } catch (error: unknown) { // 'error' is of type 'unknown'
        // This is the type guard that resolves the error:
        if (error instanceof Error) {
            toast.error("Recommendation failed (direct fetch): " + error.message);
            console.error("Direct fetch Recommendation error:", error);
        } else {
            // This 'else' block handles cases where the caught thing isn't an Error object
            // (e.g., it might be a string, a number, or a plain object)
            toast.error("An unexpected error occurred during recommendation.");
            console.error("Direct fetch Recommendation error:", error);
        }
    } finally {
        setIsLoading(false)
    }
  },[
      image,
      playerCount,
      identifyGamesMutation,
      playingTime
    ]); // Removed AI SDK completion dependencies

  return (
    <div className="min-h-screen bg-background flex flex-col p-3 font-inter items-center">
    <Toaster position="bottom-center" richColors />

    <div className="w-full max-w-6xl md:flex md:gap-2 flex-grow">

    {/* --- LEFT COLUMN --- */}
    <div className="md:w-1/2 w-full flex flex-col">
      <Card className="flex-grow flex flex-col">
        <CardHeader className="flex flex-row items-center gap-1">
          <Image
            src="/logo.svg"
            alt="Game Draft Logo"
            width={512}
            height={512}
            className="h-10 w-auto" 
          />
          <CardTitle className="text-xl font-bold">
            {isMobile ? "Snap Some Games" : "Upload Your Collection"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
          <ImageInput
            image={image}
            setImage={setImage}
            isMobile={isMobile}
            onImageClear={() => setDirectRecommendationOutput('')}
          />
        </CardContent>
      </Card>
    </div>

    <div className="md:w-1/2 w-full flex flex-col gap-2 mt-2 md:mt-0">

      {/* Card 1: Preferences */}
      <Preferences 
        playerCount={playerCount}
        setPlayerCount={setPlayerCount}
        playingTime={playingTime}
        setPlayingTime={setPlayingTime}
        isLoading={isLoading}
        makeRecommendations={makeRecommendations}
        image={image}
      />

      {/* Card 2: Recommendations */}
      <Recommendations output={directRecommendationOutput} />

    </div>
  </div>
</div>
  );
}

