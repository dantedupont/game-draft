'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { clsx } from 'clsx'
import { toast } from 'sonner'

interface ImageInputProps {
    image: string | null,
    setImage: (image: string | null) => void,
    isMobile: boolean,
    onImageClear: () => void
}

export default function ImageInput({ image, setImage, isMobile, onImageClear }: ImageInputProps) {
    console.log("ImageInput: Component Rendered"); 
    console.log('isMobile:', isMobile)
    const [isDraggingOver, setIsDraggingOver] = useState(false)
    const [cameraStatus, setCameraStatus] = useState<'idle' | 'loading' | 'active' | 'error'>('idle')
    const [videoContainerHeight, setVideoContainerHeight] = useState<number | undefined>(undefined);

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
    }, [setImage])

    const retakePhoto = useCallback(() => {
        setImage(null)
        setCameraStatus('idle');
        onImageClear()
    },[onImageClear, setImage])

    ////////////////////////
    //CAMERA SET UP/////////
    ////////////////////////
    useEffect(() => {
      console.log("ImageInput useEffect: Effect Mounted or Dependencies Changed");
      const currentVideo = videoRef.current;
      const setupCamera = async () => {
        if (currentVideo) {
            console.log("setupCamera called: currentVideo is available.");
            if (currentVideo.srcObject) {
              console.log("Clearing previous stream from video element before new setup.");
              (currentVideo.srcObject as MediaStream).getTracks().forEach(track => track.stop());
              currentVideo.srcObject = null; // Important to nullify the reference
            }
            setCameraStatus('loading')
            try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } } });
            console.log("getUserMedia succeeded. Stream obtained:", stream);

            if (stream.getVideoTracks().length === 0) {
                console.error("Stream obtained but has NO VIDEO TRACKS!");
                toast.error("Camera stream has no video tracks. Is camera functional?");
                setCameraStatus('error')
                return;
            } else {
                const videoTrack = stream.getVideoTracks()[0];
                console.log("Stream has video tracks. First track:", videoTrack);
                console.log("First track readyState (immediately after getting track):", videoTrack.readyState);

                // Set onended listener for the track
                videoTrack.onended = () => {
                    console.error("!!!! MediaStreamTrack ENDED EVENT FIRED! Current readyState:", videoTrack.readyState, "!!!!");
                    toast.error("Camera stream ended unexpectedly. Device/OS issue or camera conflict?");
                };

                // Correct Placement: Set oninactive listener for the STREAM here
                // immediately after obtaining the 'stream' object
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (stream as any).oninactive = () => { // Use type assertion
                    console.error("!!!! MediaStream INACTIVE EVENT FIRED! Stream active status:", stream.active, "!!!!");
                    toast.error("Camera stream became inactive. Re-initializing...");
                    setCameraStatus('idle'); // Set to idle, so the useEffect can attempt to restart
                };
            }

            currentVideo.srcObject = stream;
            console.log("Stream attached to video element. srcObject:", currentVideo.srcObject);
            console.log("Video element readyState AFTER srcObject set:", currentVideo.readyState);
            currentVideo.onloadedmetadata = () => {
              console.log("onloadedmetadata event fired!");
              console.log("Video dimensions:", currentVideo.videoWidth, "x", currentVideo.videoHeight);
              console.log("Video element readyState onloadedmetadata:", currentVideo.readyState);
              if (currentVideo.videoWidth > 0 && currentVideo.videoHeight > 0) {
                // Get the actual rendered width of the video element (which should be w-full of its parent)
                const renderedWidth = currentVideo.offsetWidth; // This gives us the real pixel width
                const aspectRatio = currentVideo.videoHeight / currentVideo.videoWidth;
                const calculatedHeight = renderedWidth * aspectRatio;

                console.log(`Dynamically setting container height to: ${calculatedHeight}px (Based on width: ${renderedWidth}px, Aspect Ratio: ${aspectRatio.toFixed(2)})`);
                setVideoContainerHeight(calculatedHeight);
              } else {
                  setVideoContainerHeight(undefined); // Reset if dimensions are invalid
              }
            };

            currentVideo.oncanplay = () => {
              console.log("oncanplay event fired!");
              console.log("Video element readyState oncanplay:", currentVideo.readyState); // NEW LOG
              currentVideo.play()
                .then(() => {
                  setCameraStatus('active');
                  console.log('Video play() successful, camera status active!');
                  toast.success("Camera feed should be active!");
                })
                .catch(playError => {
                    console.error('Error attempting to play video:', playError);
                    toast.error("Failed to play camera stream. Autoplay might be blocked or device issue.");
                });
            };

            } catch (error) {
            console.error("Error accessing camera: ", error);
            toast.error("Failed to access camera. Please check permissions and try again.");
            setCameraStatus('error');
            }
        } else {
            console.log("videoRef.current is NOT available when setupCamera was called (inside camera effect).");
        }
        };

        if (isMobile && !image && cameraStatus === 'idle') {
            setupCamera();
        }
        return () => {
          console.log("ImageInput useEffect: Cleanup Running");
          if (currentVideo) {
              currentVideo.onloadedmetadata = null;
              currentVideo.oncanplay = null;
              if (currentVideo.srcObject) {
                console.log("ImageInput useEffect Cleanup: Stopping camera tracks.");
                (currentVideo.srcObject as MediaStream).getTracks().forEach(track => track.stop());
                currentVideo.srcObject = null
              }
          }
        };
    // This ESLint rule is disabled because 'cameraStatus' is used in the 'if' condition
    // but its changes should NOT trigger a re-run of this effect.
    // Including it would cause an infinite loop of camera activation/deactivation.
    // The effect should only re-run when 'isMobile' or 'image' changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMobile, image]);

    ////////////////////////
    //DESKTOP DRAG AND DROP/
    ////////////////////////
    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setIsDraggingOver(true)
    },[])
    const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setIsDraggingOver(false)
    },[])
    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setIsDraggingOver(false)

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

    },[setImage])

    return(
        <div className="flex-grow flex flex-col min-h-0">
            {isMobile ? (
              <div className="relative w-full bg-gray-200 rounded-lg overflow-hidden"
              style={videoContainerHeight ? { height: `${videoContainerHeight}px` } : {}}
              >
                {image ? (
                    <Image
                      src={image}
                      alt="photo capture"
                      className="absolute top-0 left-0 w-full h-full object-contain"
                      width={0}
                      height={0}
                      sizes="100vw"
                    />
                ) : (
                  <>
                    <video
                        ref={videoRef}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        playsInline
                        autoPlay
                        muted
                      ></video>
                    {cameraStatus !== 'active' && (
                      <div className="p-4">
                        {cameraStatus === 'idle' && (
                          <p className="text-lg text-gray-500">Initializing camera...</p>
                        )}
                        {cameraStatus === 'loading' && (
                          <p className="text-lg text-gray-500">
                            Please allow camera access when prompted
                            <span className="animate-pulse text-gray-500">● ● ●</span>
                          </p>
                        )}
                        {cameraStatus === 'error' && (
                          <p className="text-lg text-red-600 font-semibold">
                            Camera access failed.
                            <br/>Please check permissions.
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                <canvas ref={canvasRef} style={{ display: 'none'}}></canvas>

                {/*Take picture button*/}
                {(!image && cameraStatus === 'active') && (
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
                )}

                {/*Retake picture button*/}
                {image && (
                  <button
                    onClick={retakePhoto}
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
                      text-gray-400
                      font-semibold
                      text-xs
                    "
                  >
                    clear image
                  </div>
                </button>
                )}
                
              </div>
            ) : (
              // if not mobile, show drag and drop area
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
                  <p className={clsx("text-lg transition-colors duration-200 text-gray-300", isDraggingOver && "text-indigo-600")}>
                    Drag and Drop Here
                  </p>
                )}
              </div>
            )}
          </div>
    )
}