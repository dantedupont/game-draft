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
    const [isDraggingOver, setIsDraggingOver] = useState(false)
    const [cameraStatus, setCameraStatus] = useState<'idle' | 'loading' | 'active'>('idle')

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
        onImageClear()
    },[onImageClear, setImage])

    ////////////////////////
    //CAMERA SET UP/////////
    ////////////////////////
    useEffect(() => {
      const currentVideo = videoRef.current;
      const setupCamera = async () => {
        if (currentVideo) {
            console.log("setupCamera called: currentVideo is available.");
            setCameraStatus('loading')
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
                setCameraStatus('active')
            };

            } catch (error) {
            console.error("Error accessing camera: ", error);
            toast.error("Failed to access camera. Please check permissions and try again.");
            }
        } else {
            console.log("videoRef.current is NOT available when setupCamera was called (inside camera effect).");
        }
        };

        if (isMobile && !image && cameraStatus === 'idle') {
            setupCamera();
        }
        return () => {
          if (currentVideo) {
              currentVideo.onloadedmetadata = null;
              currentVideo.oncanplay = null;
              if (currentVideo.srcObject) {
                (currentVideo.srcObject as MediaStream).getTracks().forEach(track => track.stop());
                currentVideo.srcObject = null
              }
          }
          setCameraStatus('idle')
        };
    }, [isMobile, image, cameraStatus]);

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
                  <>
                    {cameraStatus === 'active' ? (
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover flex-grow"
                        playsInline
                        autoPlay
                        muted
                      ></video>
                    ) : (
                      <div className="p-4">
                      {cameraStatus === 'idle' && (
                        <p className="text-lg text-gray-500">Initializing camera...</p>
                      )}
                      {cameraStatus === 'loading' && (
                        <p className="text-lg text-gray-500">
                          Please allow camera access if prompted
                          <span className="animate-pulse text-gray-500">● ● ●</span>
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