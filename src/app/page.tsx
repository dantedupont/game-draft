'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { toast, Toaster } from 'sonner'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx } from 'clsx'

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

import { trpc } from '@/trpc/client'

export default function HomePage(){
  const [isMobile, setIsMobile] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [playerCount, setPlayerCount] = useState('')
  const [directRecommendationOutput, setDirectRecommendationOutput] = useState('')
  const [isDraggingOver, setIsDraggigngOver] = useState(false)

  //tRPC hooks
  const identifyGamesMutation = trpc.ai.identifyGamesInImage.useMutation();

  // Reference to and html <video> element
  const videoRef = useRef<HTMLVideoElement>(null)
  // Ref to canvas element to get video frame
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // PHOTO BLOCK
  const takePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if(video && canvas){
      const context = canvas.getContext('2d')

      if(context){
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        const base64Data = canvas.toDataURL("image/jpeg", 0.9)
        console.log("image data: ", base64Data);

        setImage(base64Data)
        toast.success("Image captured!")
      }
    }
  }, [])

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
  //CAMERA SET UP/////////
  ////////////////////////
  useEffect(() => {
    const setupCamera = async () => {
      const currentVideo = videoRef.current;

      if (currentVideo) {
        console.log("setupCamera called: currentVideo is available.");
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } } });
          console.log("getUserMedia succeeded. Stream obtained:", stream);

          if (stream.getVideoTracks().length === 0) {
              console.error("Stream obtained but has NO VIDEO TRACKS!");
              toast.error("Camera stream has no video tracks. Is camera functional?");
              return;
          } else {
              console.log("Stream has video tracks. First track:", stream.getVideoTracks()[0]);
          }

          currentVideo.srcObject = stream;

          currentVideo.oncanplay = () => {
            currentVideo.play();
          };

          setTimeout(() => {
            if (!currentVideo.srcObject || currentVideo.paused || currentVideo.ended || currentVideo.videoWidth === 0) {
              toast.error("Camera feed did not activate visually after timeout.");
            }
          }, 3000);

        } catch (error) {
          console.error("Error accessing camera: ", error);
          toast.error("Failed to access camera. Please check permissions and try again.");
        }
      } else {
        console.log("videoRef.current is NOT available when setupCamera was called (inside camera effect).");
      }
    };

    if (isMobile && videoRef.current && !videoRef.current.srcObject) {
      setupCamera();
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = null;
        videoRef.current.oncanplay = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [isMobile, image]);

  ////////////////////////
  //DESKTOP DRAG AND DROP/
  ////////////////////////
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDraggigngOver(true)
  },[])
  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDraggigngOver(false)
  },[])
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDraggigngOver(false)

    if (event.dataTransfer.files.length > 0){
      const file = event.dataTransfer.files[0]

      // making sure its an image
      if (!file.type.startsWith('image/')){
        toast.error('Invalid file: please use an image file')
        return;
      }

      const reader = new FileReader()

      reader.onload = (event) => {
        if(event.target?.result && typeof event.target.result === "string"){
          setImage(event.target.result)
          toast.success("Image uploaded!")
        }
      }

      reader.readAsDataURL(file)
    }

  },[])

  ////////////////////////
  //RECOMMENDATIONS///////
  ////////////////////////
  const makeRecommendations = useCallback(async () => {
    setDirectRecommendationOutput(''); // Clear previous output

    if (!image) {
      toast.error("Please capture or select an image first.");
      return;
    }
    if (!playerCount) {
      toast.error("Please select player count.");
      return;
    }

    const identified = await identifyGamesMutation.mutateAsync({
        imageDataUrl: image,
    });
    toast.success(`AI identified ${identified?.length || 0} games!`);

    toast.info("Generating recommendations with AI (direct fetch)...");

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
                console.log("Stream complete.");
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
                        // Optionally re-throw or handle error to stop processing
                    }
                } else {
                    console.warn("Unexpected SSE line format:", line); // Log any lines not starting with 'data: '
                }
            }
        }
        toast.success("Recommendations generated (direct fetch)!");
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
    <div className="min-h-screen bg-gray-100 flex flex-col p-4 font-inter">
      <Toaster position="top-center" richColors />

      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden md:flex flex-grow min-h-[90vh]">
        <div className="md:w-1/2 w-full flex flex-col p-4 flex-grow">
          <h2 className="text-2xl font-bold mb-4">
            {isMobile ? "Capture Your Collection" : "Upload Your Collection"}
          </h2>

          {/* IMAGE SECTION */}
          <div className="flex-grow flex flex-col">
            {isMobile ? (
              <div className="relative w-full h-full flex-grow bg-gray-200 rounded-lg overflow-hidden">
                {image ? (
                  <Image
                    src={image}
                    alt="photo capture"
                    className="w-full h-full ibject-contain"
                    width={0}
                    height={0}
                    sizes="100vw"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover flex-grow"
                    playsInline
                    autoPlay
                    muted
                  ></video>
                )}
                <canvas ref={canvasRef} style={{ display: 'none'}}></canvas>
                <button
                  onClick={takePhoto}
                  className="
                    absolute bottom-4 left-1/2 -translate-x-1/2
                    w-20 h-20
                    rounded-full
                    bg-white
                    flex items-center justify-center
                    group
                  "
                >
                  <div
                    className="
                      w-16 h-16
                      rounded-full
                      bg-white
                      group-active:bg-gray-200
                      border-4
                      flex items-center justify-center
                    "
                  >
                  </div>
                </button>
              </div>
            ) : (
              <div className={clsx(
                "relative w-full max-h-64 flex-grow bg-gray-50 rounded-lg overflow-hidden",
                "border-2 border-dashed transition-colors duration-200",
                "flex items-center justify-center",
                isDraggingOver ? "border-indigo-600" : "border-gray-300"
              )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {image ? (
                  <Image 
                    src={image}
                    alt="uploaded image"
                    className="w-full h-full object-contain"
                    width={0}
                    height={0}
                    sizes="100vw"
                  />
                ) : (
                  <p className={clsx("text-lg transition-colors duration-200", isDraggingOver && "text-indigo-600")}>
                    Drag and Drop Here
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SELECTION SECTION */}
        <div className="w-full p-4 flex-grow space-y-4">
            <CardHeader className="p4">
              <CardTitle className="text-2xl font-bold">Preferences</CardTitle>
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
              disabled={!image || !playerCount}
              onClick={makeRecommendations}
            >
              Recommend Games
            </Button>
          </CardContent>
        </div>

        {/*Recommendation Section*/}
        {directRecommendationOutput &&
            <CardContent>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {directRecommendationOutput}
              </ReactMarkdown>
            </CardContent>
        }
      </div>
    </div>
  );
}