'use client'

import React, { useEffect, useState, useRef } from 'react'
import { toast, Toaster } from 'sonner'

export default function HomePage(){
  const [isMobile, setIsMobile] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null) 

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
          // use the back camera
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

          currentVideo.srcObject = stream; // Use the non-null local variable
          console.log("currentVideo.srcObject set to stream.");


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
              console.warn("Camera stream not active after timeout, or dimensions are zero.");
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
      console.log("Conditions met for camera setup. Calling setupCamera().");
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
  }, [isMobile, videoRef.current]); 

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-inter">
      <Toaster position="top-center" richColors />

      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
        <div className="w-full flex flex-col p-4">
          <h2 className="text-2xl font-bold mb-4">
            {isMobile ? "Capture Your Collection" : "Upload Your Collection (Desktop View)"}
          </h2>

          {isMobile ? (
            <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                autoPlay
                muted
              ></video>
            </div>
          ) : (
            <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500">
              Desktop Upload Area
            </div>
          )}
        </div>
        <div className="w-full p-4">
            <h2 className="text-2xl font-bold">Game Recommendations</h2>
            <p>Selectors and AI results will go here.</p>
        </div>
      </div>
    </div>
  );
}
