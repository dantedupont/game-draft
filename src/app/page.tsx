'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { toast, Toaster } from 'sonner'
import Image from 'next/image'

// UI Components
import { CardHeader, CardTitle, CardContent} from 'src/components/ui/card'
import { Label } from 'src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select'

export default function HomePage(){
  const [isMobile, setIsMobile] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [playerCount, setIsPlayerCount] = useState('')
  // reference to and html <video> element
  const videoRef = useRef<HTMLVideoElement>(null) 
  // ref to canvas element to get video frame
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
      // The camera setup for resize will now be handled by the dedicated cameraEffect below.
    };
    window.addEventListener('resize', handleResize);

    // Cleanup function for the resize listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); 

  useEffect(() => {
    const setupCamera = async () => {
      const currentVideo = videoRef.current; // Capture ref.current into a local variable, get video object

      if (currentVideo) { 
        console.log("setupCamera called: currentVideo is available.");
        try {
          // Initiate camera access, use the back camera
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } } });
          console.log("getUserMedia succeeded. Stream obtained:", stream);

          // Check if stream actually has video tracks
          if (stream.getVideoTracks().length === 0) {
              console.error("Stream obtained but has NO VIDEO TRACKS!");
              toast.error("Camera stream has no video tracks. Is camera functional?");
              return; // Stop here if no video tracks
          } else {
              console.log("Stream has video tracks. First track:", stream.getVideoTracks()[0]);
          }

          // assign camera stream to <video> element
          currentVideo.srcObject = stream; 

          // Listener to confirm when video is actually ready to play
          currentVideo.oncanplay = () => { 
            currentVideo.play(); 
             // Added listener to check if video actually starts playing and has dimensions
            currentVideo.onloadedmetadata = () => { 
              if (currentVideo.videoWidth === 0 || currentVideo.videoHeight === 0) { 
                toast.error("Camera stream appears to be inactive (0 dimensions).");
              } else {
                toast.success("Camera feed should be active!");
              }
            };
          };

          // Fallback if oncanplay or onloadedmetadata doesn't fire promptly
          setTimeout(() => {
            if (!currentVideo.srcObject || currentVideo.paused || currentVideo.ended || currentVideo.videoWidth === 0) {
              toast.error("Camera feed did not activate visually after timeout.");
            }
          }, 3000); // 3 second timeout

        } catch (error) {
          console.error("Error accessing camera: ", error);
          toast.error("Failed to access camera. Please check permissions and try again.");
        }
      } else {
        console.log("videoRef.current is NOT available when setupCamera was called (inside camera effect).");
      }
    };

    // only start stream if no other stream is running and the video element is available
    if (isMobile && videoRef.current && !videoRef.current.srcObject) {
      setupCamera();
    }
    // Cleanup function for the camera stream
    return () => {
      // Remove listeners to prevent memory leaks
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = null;
        videoRef.current.oncanplay = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
    // ignoring warning because for this use case, 
    // the effect must ben run when videoRef gets a valid DOM element to be assigned to (and doesnt need to re-render the the component)
  }, [isMobile, videoRef.current]); 

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col p-4 font-inter">
      <Toaster position="top-center" richColors />

      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden md:flex flex-grow min-h-[90vh]">
        <div className="md:w-1/2 w-full flex flex-col p-4 flex-grow">
          <h2 className="text-2xl font-bold mb-4">
            {isMobile ? "Capture Your Collection" : "Upload Your Collection (Desktop View)"}
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
                    // assign DOM node to the ref we created
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
              <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500">
                Desktop Upload Area
              </div>
            )}
          </div>
        </div>

        {/* SELECTION SECTION */}
        <div className="w-full p-4 flex-grow">
            <CardHeader className="p4">
              <CardTitle className="text-2xl font-bold">Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <Label className="text-lg">Player Count</Label>
              <Select value={playerCount} onValueChange={setIsPlayerCount}>
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
            </CardContent>
        </div>
      
      </div>
    </div>
  );
}
