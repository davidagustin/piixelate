'use client';

import { useState, useEffect } from 'react';
import Webcam from 'react-webcam';

export default function CameraTest() {
  const [cameraStatus, setCameraStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if camera is supported
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      setIsSupported(true);
      setCameraStatus('Camera API supported');
    } else {
      setIsSupported(false);
      setError('Camera API not supported in this browser');
    }
  }, []);

  const handleUserMedia = () => {
    setCameraStatus('Camera connected successfully!');
    setError(null);
  };

  const handleUserMediaError = (err: string | DOMException) => {
    setError(`Camera error: ${err.toString()}`);
    setCameraStatus('Camera failed to connect');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Camera Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded-lg">
          <h2 className="font-semibold mb-2">System Information:</h2>
          <ul className="text-sm space-y-1">
            <li>• Protocol: {typeof window !== 'undefined' ? window.location.protocol : 'Unknown'}</li>
            <li>• Hostname: {typeof window !== 'undefined' ? window.location.hostname : 'Unknown'}</li>
            <li>• User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}</li>
            <li>• Camera API: {isSupported === null ? 'Checking...' : isSupported ? 'Supported' : 'Not Supported'}</li>
          </ul>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h2 className="font-semibold mb-2">Camera Status:</h2>
          <p className="text-sm">{cameraStatus}</p>
          {error && (
            <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {isSupported && (
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Camera Feed:</h2>
            <Webcam
              screenshotFormat="image/jpeg"
              className="w-full max-w-md mx-auto rounded border"
              videoConstraints={{
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
              }}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
            />
          </div>
        )}

        <div className="p-4 bg-yellow-50 rounded-lg">
          <h2 className="font-semibold mb-2">Troubleshooting Steps:</h2>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Make sure you&apos;re on HTTPS or localhost</li>
            <li>Allow camera permissions when prompted</li>
            <li>Check if another app is using your camera</li>
            <li>Try refreshing the page</li>
            <li>Try a different browser (Chrome, Firefox, Safari)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
