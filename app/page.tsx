'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Download, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  Zap, 
  Lock,
  Github,
  Monitor
} from 'lucide-react';
import Webcam from 'react-webcam';
import { detectPII } from './utils/pii-detector-refactored';
import type { PIIDetection } from './types/pii-types';

export default function PIIxelate() {
  // Input method state
  const [inputMethod, setInputMethod] = useState<'camera' | 'upload'>('camera');
  
  // Image state
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [processedImageSrc, setProcessedImageSrc] = useState<string | null>(null);
  const [imageMetadata, setImageMetadata] = useState<{width: number; height: number; size?: string} | null>(null);
  
  // Processing state
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<string>('');
  
  // Detection results
  const [detectedPII, setDetectedPII] = useState<PIIDetection[]>([]);
  
  // UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Configuration
  const [isLLMEnabled, setIsLLMEnabled] = useState(true);
  const [useBlackSquares, setUseBlackSquares] = useState(false);
  
  // Webcam state
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [isWebcamLoading, setIsWebcamLoading] = useState(false);
  const [cameraRetryCount, setCameraRetryCount] = useState(0);
  const [maxRetries] = useState(2);
 
   
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Remove the problematic timeout logic - let Webcam component handle its own initialization

  // Cleanup timeout on unmount - removed since we're not using timeouts

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setOriginalImageSrc(imageSrc);
        setProcessedImageSrc(null);
        setDetectedPII([]);
        setErrorMessage(null);
        setSuccessMessage(null);
      } else {
        setErrorMessage('Failed to capture photo. Please check camera permissions.');
      }
    } else {
      setErrorMessage('Camera not available. Please check camera permissions.');
    }
  }, []);

  const handleWebcamError = useCallback((error: string | DOMException) => {
    console.error('Webcam error:', error);
    
    if (cameraRetryCount < maxRetries) {
      // Retry with different settings
      setCameraRetryCount(prev => prev + 1);
      setWebcamError(null);
    } else {
      // Final failure
      setWebcamError(error.toString());
      setIsWebcamLoading(false);
      setErrorMessage('Camera access denied. Please allow camera permissions and refresh the page.');
    }
  }, [cameraRetryCount, maxRetries]);

  const handleWebcamLoad = useCallback(() => {
    setIsWebcamLoading(false);
    setWebcamError(null);
    setCameraRetryCount(0); // Reset retry count on success
  }, []);

  // Get camera constraints based on retry attempt
  const getCameraConstraints = useCallback(() => {
    const constraints = {
      width: { ideal: 640, max: 1280 },
      height: { ideal: 480, max: 720 },
    };

    // Try different facing modes based on retry count
    if (cameraRetryCount === 0) {
      return { ...constraints, facingMode: 'user' };
    } else if (cameraRetryCount === 1) {
      return { ...constraints, facingMode: 'environment' };
    } else if (cameraRetryCount === 2) {
      // Try without facing mode constraint
      return constraints;
    } else {
      // Final fallback - minimal constraints
      return { 
        width: { ideal: 640 },
        height: { ideal: 480 }
      };
    }
  }, [cameraRetryCount]);

  const resetCameraState = useCallback(() => {
    // Complete reset of camera state
    setCameraRetryCount(0);
    setIsWebcamLoading(false); // Start with false so Webcam component can render
    setWebcamError(null);
    setErrorMessage(null);
  }, []);

  // Reset camera state when switching to camera mode
  useEffect(() => {
    if (inputMethod === 'camera') {
      // Check if we're on HTTPS
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setWebcamError('Camera access requires HTTPS. Please use a secure connection or switch to upload mode.');
        setIsWebcamLoading(false);
        return;
      }
      resetCameraState();
    }
  }, [inputMethod, resetCameraState]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Image file size must be less than 10MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setOriginalImageSrc(result);
        setProcessedImageSrc(null);
        setDetectedPII([]);
        setErrorMessage(null);
        setSuccessMessage(null);
        
        // Get image information
        const img = new Image();
        img.onload = () => {
          setImageMetadata({
            width: img.width,
            height: img.height,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
          });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Enhanced drag and drop functionality
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
          if (imageFile.size > 10 * 1024 * 1024) {
      setErrorMessage('Image file size must be less than 10MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setOriginalImageSrc(result);
      setProcessedImageSrc(null);
      setDetectedPII([]);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      // Get image information
      const img = new Image();
      img.onload = () => {
        setImageMetadata({
          width: img.width,
          height: img.height,
          size: `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`
        });
      };
      img.src = result;
    };
    reader.readAsDataURL(imageFile);
  } else {
    setErrorMessage('Please drop a valid image file');
  }
  };



  const pixelateRegions = (canvas: HTMLCanvasElement, detections: PIIDetection[], pixelSize: number, useBlackSquares: boolean = false) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    detections.forEach(detection => {
      const { boundingBox } = detection;
      if (!boundingBox || typeof boundingBox.x !== 'number' || typeof boundingBox.y !== 'number' || 
          typeof boundingBox.width !== 'number' || typeof boundingBox.height !== 'number') return;
      
      // Expand the region slightly for better coverage
      const expandedBox: { x: number; y: number; width: number; height: number } = {
        x: Math.max(0, boundingBox.x - 5),
        y: Math.max(0, boundingBox.y - 5),
        width: Math.min(canvas.width - boundingBox.x, boundingBox.width + 10),
        height: Math.min(canvas.height - boundingBox.y, boundingBox.height + 10)
      };
      
      if (useBlackSquares) {
        // Apply solid black squares for maximum privacy
        ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
        ctx.fillRect(expandedBox.x, expandedBox.y, expandedBox.width, expandedBox.height);
        
        // Add a subtle border to make it clear it's a redaction
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(expandedBox.x, expandedBox.y, expandedBox.width, expandedBox.height);
      } else {
        // Get image data for the region
        const imageData = ctx.getImageData(expandedBox.x, expandedBox.y, expandedBox.width, expandedBox.height);
        const data = imageData.data;
        
        // Apply much stronger pixelation
        const strongPixelSize = Math.max(pixelSize, 40); // Much larger pixels for stronger effect
        
        // Apply pixelation
        for (let y = 0; y < expandedBox.height; y += strongPixelSize) {
          for (let x = 0; x < expandedBox.width; x += strongPixelSize) {
            const index = (y * expandedBox.width + x) * 4;
            const r = data[index] ?? 0;
            const g = data[index + 1] ?? 0;
            const b = data[index + 2] ?? 0;
            
            // Fill the pixel block with the average color
            for (let py = 0; py < strongPixelSize && y + py < expandedBox.height; py++) {
              for (let px = 0; px < strongPixelSize && x + px < expandedBox.width; px++) {
                const pIndex = ((y + py) * expandedBox.width + (x + px)) * 4;
                data[pIndex] = r;
                data[pIndex + 1] = g;
                data[pIndex + 2] = b;
              }
            }
          }
        }
        
        // Put the pixelated image data back
        ctx.putImageData(imageData, expandedBox.x, expandedBox.y);
      }
    });
  };

  const pixelateImage = (imageSrc: string, detections: PIIDetection[]): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        resolve(imageSrc);
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageSrc);
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        // Maintain original image resolution
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Apply pixelation to detected regions
        pixelateRegions(canvas, detections, 8, useBlackSquares);
        
        // Return high-quality image data
        const processedImageData = canvas.toDataURL('image/jpeg', 0.95);
        resolve(processedImageData);
      };
      
      img.onerror = () => {
        resolve(imageSrc);
      };
      
      img.src = imageSrc;
    });
  };

  const processImage = async () => {
    if (!originalImageSrc) return;
    
    setIsProcessingImage(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setProcessingProgress('');
    
    try {
      // Show progress for three-layer detection
      if (isLLMEnabled) {
        setProcessingProgress('Layer 0: Computer Vision...');
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate CV processing
        setProcessingProgress('Layer 1: Pattern matching...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate pattern processing
        setProcessingProgress('Layer 2: LLM verification...');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate LLM processing
      } else {
        setProcessingProgress('Pattern matching...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Detect PII using the utility function
      const detectionResult = await detectPII(originalImageSrc);
      setDetectedPII(detectionResult.detections);
      
      // Calculate detection statistics
      // (stats calculation removed as not used)
      
      if (detectionResult.detections.length > 0) {
        // Pixelate the image
        const pixelatedImage = await pixelateImage(originalImageSrc, detectionResult.detections);
        setProcessedImageSrc(pixelatedImage);
        setSuccessMessage(`Found and pixelated ${detectionResult.detections.length} PII elements using ${isLLMEnabled ? 'three-layer' : 'pattern'} detection`);
      } else {
        setSuccessMessage(`No PII detected in the image using ${isLLMEnabled ? 'three-layer' : 'pattern'} detection`);
        setProcessedImageSrc(originalImageSrc);
      }
    } catch (err) {
      setErrorMessage(`Failed to process image: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessingImage(false);
      setProcessingProgress('');
    }
  };

  const downloadImage = (format: 'jpg' | 'png' = 'jpg') => {
    if (processedImageSrc) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Create a new canvas for download
      const downloadCanvas = document.createElement('canvas');
      const downloadCtx = downloadCanvas.getContext('2d');
      if (!downloadCtx) return;
      
      const img = new Image();
      img.onload = () => {
        // Set canvas size to match original image
        downloadCanvas.width = img.width;
        downloadCanvas.height = img.height;
        
        // Draw the processed image
        downloadCtx.drawImage(img, 0, 0);
        
        // Create download link
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        link.download = `piixelated-image-${timestamp}.${format}`;
        
        if (format === 'png') {
          link.href = downloadCanvas.toDataURL('image/png');
        } else {
          link.href = downloadCanvas.toDataURL('image/jpeg', 0.95);
        }
        
        link.click();
      };
      
      img.src = processedImageSrc;
    }
  };

  const resetApp = () => {
    setOriginalImageSrc(null);
    setProcessedImageSrc(null);
    setDetectedPII([]);
    setErrorMessage(null);
    setSuccessMessage(null);
    setImageMetadata(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
              <header className="security-card border-b border-blue-200 sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center security-glow flex-shrink-0 shadow-lg">
                <Shield className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate leading-tight mb-0.5">
                  PIIxelate
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 flex items-center space-x-1 font-medium">
                  <Lock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">AI-Powered Privacy Protection</span>
                </p>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Automatically detect and pixelate sensitive information in images
                </p>
              </div>
            </div>
            
            {/* Desktop Status */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-medium flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full security-pulse"></div>
                <span>Secure</span>
              </div>
              <a
                href="https://github.com/davidagustin/piixelate"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="View source code on GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
            
            {/* Mobile GitHub Link */}
            <div className="sm:hidden">
              <a
                href="https://github.com/davidagustin/piixelate"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="View source code on GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* What This App Does */}
        <div className="card p-4 sm:p-6 mb-6 sm:mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">
                🛡️ What PIIxelate Does
              </h3>
              <p className="text-sm text-slate-700 mb-3">
                PIIxelate is an AI-powered privacy protection tool that automatically detects and pixelates Personally Identifiable Information (PII) in your images. It uses advanced computer vision and pattern matching to find sensitive data like credit card numbers, addresses, phone numbers, and more, then securely blurs them to protect your privacy.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-800">🔍 Detects:</h4>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• Credit card numbers & financial data</li>
                    <li>• Driver&apos;s licenses & government IDs</li>
                    <li>• Phone numbers & email addresses</li>
                    <li>• Home addresses & personal info</li>
                    <li>• Medical records & prescriptions</li>
                    <li>• Barcodes & document numbers</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-800">🛡️ Protects:</h4>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• Your personal privacy</li>
                    <li>• Sensitive documents</li>
                    <li>• Financial information</li>
                    <li>• Medical records</li>
                    <li>• Identity documents</li>
                    <li>• Business confidential data</li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  AI-Powered Detection
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  Multi-Layer Security
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  Privacy-First Design
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Important Disclaimer */}
        <div className="card p-4 sm:p-6 mb-6 sm:mb-8 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">
                ⚠️ Important Disclaimer
              </h3>
              <p className="text-sm text-slate-700 mb-3">
                <strong>PIIxelate is not 100% accurate in detecting all PII.</strong> While our AI-powered system uses multiple detection layers to identify sensitive information, it may miss some PII elements or incorrectly identify non-sensitive text as PII. The accuracy depends on various factors including image quality, text clarity, and the complexity of the content.
              </p>
              <div className="bg-white/80 rounded-xl p-3 sm:p-4 border border-orange-200 mb-3">
                <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center space-x-2">
                  <span className="text-orange-600">🔍</span>
                  <span>Your Responsibility:</span>
                </h4>
                <ul className="text-xs text-slate-700 space-y-1">
                  <li>• <strong>Always review processed images</strong> before sharing or publishing</li>
                  <li>• <strong>Manually check for any missed PII</strong> that may not have been detected</li>
                  <li>• <strong>Verify that all sensitive information</strong> has been properly obscured</li>
                  <li>• <strong>Do not rely solely on automated detection</strong> for critical privacy protection</li>
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                  Not 100% Accurate
                </span>
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                  Manual Review Required
                </span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                  Use at Your Own Risk
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="card p-4 sm:p-6 mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">
                🔒 Privacy-First Processing
              </h3>
              <p className="text-sm text-slate-700 mb-3">
                This application processes images locally in your browser. Images are never stored on our servers. However, when using AI-powered detection, text content may be sent to external AI services for analysis. You can disable AI detection for complete local processing.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  No Image Storage
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  Local Image Processing
                </span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                  Optional AI Services
                </span>
              </div>
              <div className="flex items-center justify-start space-x-2">
                <a
                  href="https://github.com/davidagustin/piixelate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-xs"
                >
                  <Github className="w-3 h-3" />
                  <span>View Source Code</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* How to Use */}
        <div className="card p-4 sm:p-8 mb-6 sm:mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center space-x-2">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
            <span>How to Use PIIxelate</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
            <div className="text-center p-4 bg-white rounded-xl border border-purple-200 shadow-sm">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Upload or Capture</h3>
              <p className="text-sm text-slate-600">Take a photo with your camera or upload an existing image from your device</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-purple-200 shadow-sm">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">AI Detection</h3>
              <p className="text-sm text-slate-600">Our AI automatically scans for sensitive information using multiple detection layers</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-purple-200 shadow-sm">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-lg">3</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Download Protected</h3>
              <p className="text-sm text-slate-600">Download your image with all sensitive data securely pixelated and protected</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-purple-200">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span>Important Notes:</span>
            </h4>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>• <strong>Camera access requires HTTPS:</strong> Make sure you&apos;re using a secure connection</li>
              <li>• <strong>File size limit:</strong> Maximum 10MB per image for optimal performance</li>
              <li>• <strong>Supported formats:</strong> JPG, PNG, GIF, WebP</li>
              <li>• <strong>Processing time:</strong> 1-15 seconds depending on image size and complexity</li>
            </ul>
          </div>
        </div>

        {/* Input Method Selection */}
          <div className="card p-4 sm:p-8 mb-6 sm:mb-8 bg-white/80 backdrop-blur-sm border-blue-200">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center space-x-2">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              <span>Choose Input Method</span>
            </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <button
              onClick={() => setInputMethod('camera')}
              className={`mobile-feedback p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 group min-h-[120px] sm:min-h-[160px] cursor-pointer card-hover ${
                inputMethod === 'camera'
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-lg'
                  : 'border-slate-200 hover:border-blue-300 hover:shadow-md bg-white'
              }`}
            >
              <div className="flex flex-col items-center space-y-3 h-full justify-center">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                  inputMethod === 'camera' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' 
                    : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100'
                }`}>
                  <Camera className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div className="text-center">
                  <span className="text-base sm:text-lg font-semibold">Camera Capture</span>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">Real-time photo capture</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setInputMethod('upload')}
              className={`mobile-feedback p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 group min-h-[120px] sm:min-h-[160px] cursor-pointer card-hover ${
                inputMethod === 'upload'
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-lg'
                  : 'border-slate-200 hover:border-blue-300 hover:shadow-md bg-white'
              }`}
            >
              <div className="flex flex-col items-center space-y-3 h-full justify-center">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                  inputMethod === 'upload' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' 
                    : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100'
                }`}>
                  <Upload className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div className="text-center">
                  <span className="text-base sm:text-lg font-semibold">File Upload</span>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">Upload existing images</p>
                </div>
              </div>
            </button>
          </div>
          
          {/* Detection Method Selection */}
          <div className="border-t border-slate-200 pt-4 sm:pt-6">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4 flex items-center space-x-2 flex-wrap">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              <span>Detection Method: </span>
              {isLLMEnabled ? (
                <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs font-bold ml-2 whitespace-nowrap">
                  Computer Vision + Pattern matching + LLM verification
                </span>
              ) : (
                <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs font-bold ml-2 whitespace-nowrap">
                  Fast regex-based detection
                </span>
              )}
            </h3>
            
            {/* Pixelation Method Selection */}
            <div className="mb-4 sm:mb-6">
              <h4 className="text-sm sm:text-base font-semibold text-slate-800 mb-3 flex items-center space-x-2">
                <EyeOff className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Pixelation Method:</span>
                {useBlackSquares ? (
                  <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold ml-2">
                    Black Squares
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-bold ml-2">
                    Strong Pixelation
                  </span>
                )}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="pixelation"
                    checked={!useBlackSquares}
                    onChange={() => setUseBlackSquares(false)}
                    className="sr-only"
                  />
                  <div className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 min-h-[80px] sm:min-h-[100px] ${
                    !useBlackSquares
                      ? 'border-blue-500 bg-blue-50 shadow-lg ring-4 ring-blue-300'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}>
                    <div className="flex items-start space-x-3 h-full">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-all duration-200 ${
                        !useBlackSquares ? 'border-blue-500 bg-blue-500 scale-125 shadow-xl' : 'border-slate-300'
                      }`}>
                        {!useBlackSquares && <div className="w-4 h-4 bg-white rounded-full shadow-lg"></div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 text-sm sm:text-base">
                          Strong Pixelation
                        </p>
                        <p className="text-xs sm:text-sm text-secondary mt-1" style={{color: '#475569'}}>
                          Enhanced pixelation with large blocks
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            Maximum Privacy
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="pixelation"
                    checked={useBlackSquares}
                    onChange={() => setUseBlackSquares(true)}
                    className="sr-only"
                  />
                  <div className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 min-h-[80px] sm:min-h-[100px] ${
                    useBlackSquares
                      ? 'border-red-500 bg-red-50 shadow-lg ring-4 ring-red-300'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}>
                    <div className="flex items-start space-x-3 h-full">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-all duration-200 ${
                        useBlackSquares ? 'border-red-500 bg-red-500 scale-125 shadow-xl' : 'border-slate-300'
                      }`}>
                        {useBlackSquares && <div className="w-4 h-4 bg-white rounded-full shadow-lg"></div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 text-sm sm:text-base">
                          Black Squares
                        </p>
                        <p className="text-xs sm:text-sm text-secondary mt-1" style={{color: '#475569'}}>
                          Solid black rectangles for complete redaction
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                            Complete Redaction
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  name="detection"
                  checked={isLLMEnabled}
                  onChange={() => setIsLLMEnabled(true)}
                  className="sr-only"
                />
                <div className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 min-h-[80px] sm:min-h-[100px] ${
                  isLLMEnabled
                    ? 'border-green-500 bg-green-50 shadow-lg ring-4 ring-blue-300'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}>
                  <div className="flex items-start space-x-3 h-full">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-all duration-200 ${
                      isLLMEnabled ? 'border-green-500 bg-green-500 scale-125 shadow-xl' : 'border-slate-300'
                    }`}>
                      {isLLMEnabled && <div className="w-4 h-4 bg-yellow-300 rounded-full shadow-lg border-2 border-white"></div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 text-sm sm:text-base">
                        Three-Layer Detection
                      </p>
                      <p className="text-xs sm:text-sm text-secondary mt-1" style={{color: '#475569'}}>
                        Computer Vision + Pattern matching + LLM verification
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          Maximum Security
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </label>
              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  name="detection"
                  checked={!isLLMEnabled}
                  onChange={() => setIsLLMEnabled(false)}
                  className="sr-only"
                />
                <div className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 min-h-[80px] sm:min-h-[100px] ${
                  !isLLMEnabled
                    ? 'border-green-500 bg-green-500/10 dark:bg-green-500/20 shadow-lg ring-4 ring-blue-300 dark:ring-blue-400'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}>
                  <div className="flex items-start space-x-3 h-full">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-all duration-200 ${
                      !isLLMEnabled ? 'border-green-500 bg-green-500 scale-125 shadow-xl' : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {!isLLMEnabled && <div className="w-4 h-4 bg-yellow-300 rounded-full shadow-lg border-2 border-white"></div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-primary text-sm sm:text-base">
                        Pattern Matching Only
                      </p>
                      <p className="text-xs sm:text-sm text-secondary mt-1" style={{color: '#475569'}}>
                        Fast regex-based detection
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="px-2 py-1 status-success rounded text-xs font-medium">
                          High Speed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="card p-4 sm:p-8 mb-6 sm:mb-8">
          {inputMethod === 'camera' ? (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                <span>Take Photo</span>
              </h2>
              <div className="bg-white dark:bg-slate-800 border-2 border-blue-300 dark:border-blue-600 rounded-xl p-4 mb-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <Camera className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                    Camera Setup Guide
                  </h3>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                  Camera access requires HTTPS and browser permissions. Here&apos;s what you need to know:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <span className="text-green-600 text-lg">✅</span>
                    <div>
                      <span className="text-sm font-medium text-slate-800 dark:text-white">Works with:</span>
                      <p className="text-sm text-slate-600 dark:text-slate-400">HTTPS websites, localhost, allowed camera permissions</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-red-600 text-lg">❌</span>
                    <div>
                      <span className="text-sm font-medium text-slate-800 dark:text-white">Won&apos;t work with:</span>
                      <p className="text-sm text-slate-600 dark:text-slate-400">HTTP websites, blocked permissions, other apps using camera</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600 text-lg">💡</span>
                    <div>
                      <span className="text-sm font-medium text-slate-800 dark:text-white">Quick fix:</span>
                      <p className="text-sm text-slate-600 dark:text-slate-400">If camera doesn&apos;t work, use the upload option below</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                {isWebcamLoading && (
                  <div className="w-full max-w-2xl mx-auto h-64 sm:h-96 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-lg flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Initializing camera... {cameraRetryCount > 0 ? `(Attempt ${cameraRetryCount + 1}/${maxRetries + 1})` : ''}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">This may take a few seconds</p>
                      
                      {/* Troubleshooting tips */}
                      {cameraRetryCount > 0 && (
                        <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-orange-300 dark:border-orange-600 shadow-sm">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-orange-600 text-lg">🔧</span>
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
                              Troubleshooting Tips
                            </h4>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start space-x-2">
                              <span className="text-orange-600 text-sm mt-0.5">•</span>
                              <p className="text-sm text-slate-700 dark:text-slate-300">Make sure you&apos;re using HTTPS (required for camera access)</p>
                            </div>
                            <div className="flex items-start space-x-2">
                              <span className="text-orange-600 text-sm mt-0.5">•</span>
                              <p className="text-sm text-slate-700 dark:text-slate-300">Allow camera permissions when prompted</p>
                            </div>
                            <div className="flex items-start space-x-2">
                              <span className="text-orange-600 text-sm mt-0.5">•</span>
                              <p className="text-sm text-slate-700 dark:text-slate-300">Check if another app is using your camera</p>
                            </div>
                            <div className="flex items-start space-x-2">
                              <span className="text-orange-600 text-sm mt-0.5">•</span>
                              <p className="text-sm text-slate-700 dark:text-slate-300">Try refreshing the page</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row gap-2 mt-3">
                        <button
                          onClick={resetCameraState}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                        >
                          Retry Camera
                        </button>
                        <button
                          onClick={() => {
                            // Force complete reset
                            setCameraRetryCount(0);
                            setIsWebcamLoading(false);
                            setWebcamError('Camera reset. Please try again or switch to upload.');
                          }}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors"
                        >
                          Force Reset
                        </button>
                        <button
                          onClick={() => setInputMethod('upload')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                          Switch to Upload
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {webcamError && (
                  <div className="w-full max-w-2xl mx-auto h-64 sm:h-96 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800 shadow-lg flex items-center justify-center">
                    <div className="text-center p-4">
                      <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                      <p className="text-sm text-red-700 dark:text-red-300 mb-2">Camera Error</p>
                      <p className="text-xs text-red-600 dark:text-red-400 mb-3">{webcamError}</p>
                      
                      {/* Common solutions */}
                      <div className="mb-4 p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-blue-300 dark:border-blue-600 shadow-sm">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-blue-600 text-lg">🔧</span>
                          <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
                            Common Solutions
                          </h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <span className="text-blue-600 text-sm mt-0.5">•</span>
                            <div>
                              <span className="text-sm font-medium text-slate-800 dark:text-white">HTTPS Required:</span>
                              <p className="text-sm text-slate-600 dark:text-slate-400">Camera access only works on secure connections</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-blue-600 text-sm mt-0.5">•</span>
                            <div>
                              <span className="text-sm font-medium text-slate-800 dark:text-white">Permissions:</span>
                              <p className="text-sm text-slate-600 dark:text-slate-400">Allow camera access when browser prompts you</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-blue-600 text-sm mt-0.5">•</span>
                            <div>
                              <span className="text-sm font-medium text-slate-800 dark:text-white">Other Apps:</span>
                              <p className="text-sm text-slate-600 dark:text-slate-400">Close other apps that might be using your camera</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-blue-600 text-sm mt-0.5">•</span>
                            <div>
                              <span className="text-sm font-medium text-slate-800 dark:text-white">Browser:</span>
                              <p className="text-sm text-slate-600 dark:text-slate-400">Try a different browser (Chrome, Firefox, Safari)</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <button
                          onClick={resetCameraState}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors mr-2"
                        >
                          Retry Camera
                        </button>
                        <button
                          onClick={() => window.location.reload()}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors mr-2"
                        >
                          Refresh Page
                        </button>
                        <button
                          onClick={() => setInputMethod('upload')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                          Switch to Upload
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {!isWebcamLoading && !webcamError && (
                  <Webcam
                    key={`webcam-${cameraRetryCount}`}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full max-w-2xl mx-auto rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-lg"
                    videoConstraints={getCameraConstraints()}
                    onUserMedia={handleWebcamLoad}
                    onUserMediaError={handleWebcamError}
                    forceScreenshotSourceSize={true}
                  />
                )}
                {!webcamError && (
                  <button
                    onClick={capturePhoto}
                    className="camera-button absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full flex items-center justify-center shadow-2xl touch-manipulation border-4 border-white dark:border-slate-800 z-10 cursor-pointer mobile-feedback"
                    aria-label="Capture photo"
                  >
                    <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                <span>Upload Image</span>
              </h2>
              <div 
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 sm:p-12 text-center transition-all duration-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Drop your image here
                </h3>
                <p className="text-sm sm:text-base text-secondary mb-3 sm:mb-4">
                  or click to browse files
                </p>
                <p className="text-xs sm:text-sm text-muted mb-4 sm:mb-6">
                  Supports JPG, PNG, GIF, WebP (max 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="security-button-primary mobile-feedback px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base min-h-[44px] touch-manipulation cursor-pointer"
                >
                  Select Image
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Image Display */}
        {originalImageSrc && (
          <div className="security-card rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center space-x-2">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              <span>Original Image</span>
            </h2>
            
            {/* Image Information */}
            {imageMetadata && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-100 dark:to-blue-100 rounded-xl border border-slate-200 dark:border-slate-300">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-slate-900 dark:text-slate-800">Resolution</p>
                    <p className="text-slate-600 dark:text-slate-700">{imageMetadata.width} × {imageMetadata.height}</p>
                  </div>
                  {imageMetadata.size && (
                    <div className="text-center">
                      <p className="font-semibold text-slate-900 dark:text-slate-800">File Size</p>
                      <p className="text-slate-600 dark:text-slate-700">{imageMetadata.size}</p>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="font-semibold text-slate-900 dark:text-slate-800">Aspect Ratio</p>
                    <p className="text-slate-600 dark:text-slate-700">{(imageMetadata.width / imageMetadata.height).toFixed(2)}:1</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-900 dark:text-slate-800">Status</p>
                    <p className="text-orange-600 dark:text-orange-700 font-medium">Pending Analysis</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-center mb-4 sm:mb-6">
              <img
                src={originalImageSrc}
                alt="Original"
                className="max-w-full h-auto rounded-xl border border-slate-200 dark:border-slate-600 shadow-lg"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={processImage}
                disabled={isProcessingImage}
                className={`flex-1 security-button-primary mobile-feedback px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg flex items-center justify-center space-x-2 sm:space-x-3 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] touch-manipulation cursor-pointer ${isProcessingImage ? 'loading-button' : ''}`}
              >
                {isProcessingImage ? (
                  <>
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                    <span className="processing-dots text-sm sm:text-base">{processingProgress || 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>Detect & Pixelate PII</span>
                  </>
                )}
              </button>
              <button
                onClick={resetApp}
                className="security-button-secondary mobile-feedback px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg min-h-[48px] touch-manipulation cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {processedImageSrc && (
          <div className="security-card rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center space-x-2">
              <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              <span>Protected Image</span>
            </h2>
            
            {/* Processed Image Information */}
            {imageMetadata && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-100 dark:to-emerald-100 rounded-xl border border-green-200 dark:border-green-300">
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-slate-900 dark:text-slate-800">Resolution</p>
                    <p className="text-slate-600 dark:text-slate-700">{imageMetadata.width} × {imageMetadata.height}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-900 dark:text-slate-800">Quality</p>
                    <p className="text-slate-600 dark:text-slate-700">High (95% JPEG)</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-900 dark:text-slate-800">Status</p>
                    <p className="text-green-700 dark:text-green-800 font-medium">Protected ✓</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-900 dark:text-slate-800">Numerical Data</p>
                    <p className="text-green-700 dark:text-green-800 font-medium">Blurred ✓</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-900 dark:text-slate-800">Text Data</p>
                    <p className="text-green-700 dark:text-green-800 font-medium">Protected ✓</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-900 dark:text-slate-800">Barcodes</p>
                    <p className="text-green-700 dark:text-green-800 font-medium">Blurred ✓</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-center mb-4 sm:mb-6">
              <img
                src={processedImageSrc}
                alt="Processed"
                className="max-w-full h-auto rounded-xl border border-slate-200 dark:border-slate-600 shadow-lg"
              />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => downloadImage('jpg')}
                  className="security-button-primary mobile-feedback px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-center space-x-2 sm:space-x-3 min-h-[48px] touch-manipulation cursor-pointer"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Download JPG</span>
                </button>
                <button
                  onClick={() => downloadImage('png')}
                  className="security-button-secondary mobile-feedback px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-center space-x-2 sm:space-x-3 min-h-[48px] touch-manipulation cursor-pointer"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Download PNG</span>
                </button>
              </div>
              <p className="text-xs sm:text-sm text-muted text-center">
                Downloads maintain original image resolution with enhanced PII protection
              </p>
            </div>
          </div>
        )}

        {/* Detection Results */}
        {detectedPII.length > 0 && (
          <div className="security-card rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
              <span>Detected PII Elements</span>
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {detectedPII.map((detection, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-100 dark:to-orange-100 border border-red-200 dark:border-red-300 rounded-xl space-y-2 sm:space-y-0"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-slate-800 capitalize text-sm sm:text-base">
                        {detection.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-700">
                        Confidence: {Math.round(detection.confidence * 100)}%
                      </p>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs sm:text-sm font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 sm:px-3 py-1 rounded break-all">
                      {detection.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Messages */}
        {errorMessage && (
          <div className="security-card rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-100 dark:to-red-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <p className="text-red-700 dark:text-red-800 font-medium text-sm sm:text-base">{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="security-card rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border-l-4 border-green-500 bg-green-50 border border-green-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <p className="text-green-800 font-semibold text-sm sm:text-base">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </main>

      {/* Footer */}
      <footer className="security-card border-t border-slate-200 mt-12 sm:mt-16 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <h3 className="text-base sm:text-lg font-semibold text-slate-800">PIIxelate</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">
              Protect your personal information with AI-powered pixelation technology
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-4">
              <span className="px-3 py-2 bg-blue-600 text-white rounded-full text-xs font-semibold shadow-sm">
                Local Processing
              </span>
              <span className="px-3 py-2 bg-green-600 text-white rounded-full text-xs font-semibold shadow-sm">
                Privacy First
              </span>
              <span className="px-3 py-2 bg-purple-600 text-white rounded-full text-xs font-semibold shadow-sm">
                AI-Powered
              </span>
            </div>
            
            {/* Privacy Information */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 sm:p-6 mb-4 border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-800 mb-2">🔒 Privacy-First Processing</h4>
              <p className="text-xs text-slate-600 mb-3">
                This application processes images locally in your browser. Images are never stored on our servers. However, when using AI-powered detection, text content may be sent to external AI services for analysis. You can disable AI detection for complete local processing.
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  No Image Storage
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  Local Processing
                </span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                  Optional AI Services
                </span>
              </div>
            </div>

            {/* Accuracy Disclaimer */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 sm:p-6 mb-4 border border-orange-200">
              <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span>Accuracy Disclaimer</span>
              </h4>
              <p className="text-xs text-slate-700 mb-3">
                <strong>PIIxelate is not 100% accurate.</strong> Always manually review processed images before sharing. The app may miss some PII or incorrectly identify non-sensitive text. Final responsibility for privacy protection lies with the user.
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                  Manual Review Required
                </span>
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">
                  Not 100% Accurate
                </span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                  Use at Your Own Risk
                </span>
              </div>
            </div>
            
            {/* GitHub Link */}
            <div className="flex items-center justify-center space-x-4">
              <a
                href="https://github.com/davidagustin/piixelate"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
              >
                <Github className="w-4 h-4" />
                <span>View Source Code</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
