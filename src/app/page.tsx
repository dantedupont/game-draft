'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { toast, Toaster } from 'sonner'
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// UI Components
import { CardHeader, CardTitle, CardContent} from 'src/components/ui/card'
import { Button } from 'src/components/ui/button'
import { Label } from 'src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select'
import { Spinner } from 'src/components/ui/spinner'

import { trpc } from '@/trpc/client'
import ImageInput from './ImageInput';

export default function HomePage(){
  const [isMobile, setIsMobile] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [playerCount, setPlayerCount] = useState('')
  const [directRecommendationOutput, setDirectRecommendationOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [buttonText, setButtonText] = useState("Recommend Games")

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
      toast.error("Please capture or select an image first.");
      return;
    }
    if (!playerCount) {
      toast.error("Please select player count.");
      return;
    }

    setIsLoading(true)
    setButtonText("Loading...")

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
                playerCount
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
                setIsLoading(false)
                setButtonText("Recommend Games")
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
    }
  },[
      image,
      playerCount,
      identifyGamesMutation,
    ]); // Removed AI SDK completion dependencies

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col p-2 font-inter">
      <Toaster position="bottom-center" richColors />

      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden md:flex flex-grow min-h-[90vh] min-w-[320px]">
        <div className="md:w-1/2 w-full flex flex-col p-4 flex-grow">
          <h2 className="text-2xl font-bold mb-4">
            {isMobile ? "Capture Your Collection" : "Upload Your Collection"}
          </h2>
          <ImageInput 
            image={image}
            setImage={setImage}
            isMobile={isMobile}
            onImageClear={() => setDirectRecommendationOutput('')}
          />
        </div>

        {/* SELECTION SECTION */}
        <div className="w-full p-4 flex-grow space-y-4">
            <CardHeader className="p4">
              <CardTitle className="text-xl font-semibold">Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Label className="text-sm">Player Count:</Label>
                <Select value={playerCount} onValueChange={setPlayerCount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select player count"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="7">7</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="9">9</SelectItem>
                    <SelectItem value="10+">10+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          </CardContent>
          <CardContent>
            <Button
              className="max-w-s"
              disabled={!image || isLoading}
              onClick={makeRecommendations}
            >
              {buttonText}
              {isLoading && (
                <Spinner size="small" className="text-gray-50" />
              )}
            </Button>
          </CardContent>

          {/*Recommendation Section*/}
          <CardContent>
            <h3 className="text-xl font-semibold mb-2">Recommendations:</h3>
            <div className="mt-2 p-4 h-100 overflow-y-auto leading-relaxed custom-scrollbar">
              {directRecommendationOutput ? (
                <div className="prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {directRecommendationOutput}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-gray-300">Recommendations will appear here...</p>
              )}
            </div>
          </CardContent>
        </div>

      </div>
    </div>
  );
}