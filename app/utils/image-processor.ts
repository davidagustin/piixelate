/**
 * Image Processing Module
 * Handles image manipulation, pixelation, and canvas operations
 */

import { PIIDetection } from '../types/pii-types';

/**
 * Enhanced pixelation function with stronger privacy protection
 */
export function pixelateRegions(
  canvas: HTMLCanvasElement,
  detections: PIIDetection[],
  pixelSize: number = 8,
  useBlackSquares: boolean = false
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }
  
  detections.forEach(detection => {
    const { x, y, width, height } = detection.boundingBox;
    
    // Expand the region slightly to ensure complete coverage
    const expandedX = Math.max(0, x - 5);
    const expandedY = Math.max(0, y - 5);
    const expandedWidth = Math.min(canvas.width - expandedX, width + 10);
    const expandedHeight = Math.min(canvas.height - expandedY, height + 10);
    
    if (useBlackSquares) {
      // Apply solid black squares for maximum privacy
      applyBlackSquares(ctx, expandedX, expandedY, expandedWidth, expandedHeight);
    } else {
      // Get the image data for the expanded region
      const imageData = ctx.getImageData(expandedX, expandedY, expandedWidth, expandedHeight);
      const data = imageData.data;
      
      // Apply moderate pixelation for better balance between privacy and readability
      let moderatePixelSize = Math.max(pixelSize, 8); // Smaller base pixels for less aggressive effect
      
      // Moderate protection for numerical data
      if (detection.type === 'numerical_data') {
        moderatePixelSize = Math.max(moderatePixelSize, 12); // Moderate pixels for numbers
      }
      
      // Moderate protection for sensitive data (dates, birthdays, IDs)
      if (detection.type === 'sensitive_data') {
        moderatePixelSize = Math.max(moderatePixelSize, 10); // Moderate pixels for sensitive data
      }
      
      // Moderate protection for barcodes
      if (detection.type === 'barcode') {
        moderatePixelSize = Math.max(moderatePixelSize, 15); // Moderate pixels for barcodes
      }
      
      // Moderate protection for credit cards
      if (detection.type === 'credit_card') {
        moderatePixelSize = Math.max(moderatePixelSize, 18); // Moderate pixels for credit cards
      }
      
      // Moderate protection for driver's licenses
      if (detection.type === 'drivers_license') {
        moderatePixelSize = Math.max(moderatePixelSize, 16); // Moderate pixels for driver's licenses
      }
      
      // Moderate protection for ID cards
      if (detection.type === 'id_card') {
        moderatePixelSize = Math.max(moderatePixelSize, 14); // Moderate pixels for ID cards
      }
      
      // Moderate protection for SSN
      if (detection.type === 'ssn') {
        moderatePixelSize = Math.max(moderatePixelSize, 20); // Moderate pixels for SSN
      }
      
      // Moderate protection for names
      if (detection.type === 'name') {
        moderatePixelSize = Math.max(moderatePixelSize, 12); // Moderate pixels for names
      }
      
      // Apply pixelation
      applyPixelation(data, expandedWidth, expandedHeight, moderatePixelSize);
      
      // Put the pixelated image data back
      ctx.putImageData(imageData, expandedX, expandedY);
      
      // Apply subtle blur effects for privacy
      applySubtleBlurEffects(ctx, expandedX, expandedY, expandedWidth, expandedHeight, detection.type);
    }
  });
}

/**
 * Apply solid black squares for maximum privacy
 */
function applyBlackSquares(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  // Create solid black rectangles
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(x, y, width, height);
  
  // Add a subtle border to make it clear it's a redaction
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
}



/**
 * Apply moderate pixelation to image data for balanced privacy protection
 */
function applyPixelation(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  pixelSize: number
): void {
  // Use moderate pixel sizes for better balance between privacy and readability
  const moderatePixelSize = Math.max(pixelSize, 6); // Minimum 6px for effective but not aggressive obscuring
  
  for (let py = 0; py < height; py += moderatePixelSize) {
    for (let px = 0; px < width; px += moderatePixelSize) {
      // Calculate average color for this block
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      
      for (let dy = 0; dy < moderatePixelSize && py + dy < height; dy++) {
        for (let dx = 0; dx < moderatePixelSize && px + dx < width; dx++) {
          const index = ((py + dy) * width + (px + dx)) * 4;
          r += data[index] ?? 0;
          g += data[index + 1] ?? 0;
          b += data[index + 2] ?? 0;
          a += data[index + 3] ?? 0;
          count++;
        }
      }
      
      // Average the colors
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      a = Math.round(a / count);
      
      // Apply the average color to the entire block with solid fill
      for (let dy = 0; dy < moderatePixelSize && py + dy < height; dy++) {
        for (let dx = 0; dx < moderatePixelSize && px + dx < width; dx++) {
          const index = ((py + dy) * width + (px + dx)) * 4;
          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
          data[index + 3] = a;
        }
      }
    }
  }
  
  // Apply a second pass with smaller pixels for extra coverage
  const secondPassPixelSize = Math.max(pixelSize / 2, 20);
  for (let py = 0; py < height; py += secondPassPixelSize) {
    for (let px = 0; px < width; px += secondPassPixelSize) {
      // Calculate average color for this block
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      
      for (let dy = 0; dy < secondPassPixelSize && py + dy < height; dy++) {
        for (let dx = 0; dx < secondPassPixelSize && px + dx < width; dx++) {
          const index = ((py + dy) * width + (px + dx)) * 4;
          r += data[index] ?? 0;
          g += data[index + 1] ?? 0;
          b += data[index + 2] ?? 0;
          a += data[index + 3] ?? 0;
          count++;
        }
      }
      
      // Average the colors
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      a = Math.round(a / count);
      
      // Apply the average color to the entire block
      for (let dy = 0; dy < secondPassPixelSize && py + dy < height; dy++) {
        for (let dx = 0; dx < secondPassPixelSize && px + dx < width; dx++) {
          const index = ((py + dy) * width + (px + dx)) * 4;
          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
          data[index + 3] = a;
        }
      }
    }
  }
}

/**
 * Apply subtle blur effects for balanced privacy protection
 */
function applySubtleBlurEffects(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  detectionType: string
): void {
  let blurStrength = 3; // Base blur strength for subtle effect
  
  // Moderate blur for numerical data
  if (detectionType === 'numerical_data') {
    blurStrength = 4; // Moderate blur for numbers
  }
  
  // Moderate blur for sensitive data (dates, birthdays, IDs)
  if (detectionType === 'sensitive_data') {
    blurStrength = 3; // Moderate blur for sensitive data
  }
  
  // Moderate blur for barcodes
  if (detectionType === 'barcode') {
    blurStrength = 5; // Moderate blur for barcodes
  }
  
  // Moderate blur for credit cards
  if (detectionType === 'credit_card') {
    blurStrength = 6; // Moderate blur for credit cards
  }
  
  // Moderate blur for driver's licenses
  if (detectionType === 'drivers_license') {
    blurStrength = 5; // Moderate blur for driver's licenses
  }
  
  // Moderate blur for ID cards
  if (detectionType === 'id_card') {
    blurStrength = 4; // Moderate blur for ID cards
  }
  
  // Moderate blur for SSN
  if (detectionType === 'ssn') {
    blurStrength = 7; // Moderate blur for SSN
  }
  
  // Moderate blur for names
  if (detectionType === 'name') {
    blurStrength = 3; // Moderate blur for names
  }
  
  // Apply single subtle blur pass
  ctx.filter = `blur(${blurStrength}px)`;
  ctx.drawImage(ctx.canvas, x, y, width, height, x, y, width, height);
  ctx.filter = 'none';
}

/**
 * Convert image source to ImageData
 */
export function getImageDataFromSrc(imageSrc: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, img.width, img.height));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
}

/**
 * Process image with pixelation
 */
export function processImageWithPixelation(
  imageSrc: string,
  detections: PIIDetection[],
  pixelSize: number = 8,
  useBlackSquares: boolean = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
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
      pixelateRegions(canvas, detections, pixelSize, useBlackSquares);
      
      // Return high-quality image data
      const processedImageData = canvas.toDataURL('image/jpeg', 0.95);
      resolve(processedImageData);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
}

/**
 * Download processed image
 */
export function downloadProcessedImage(
  imageSrc: string,
  format: 'jpg' | 'png' = 'jpg',
  quality: number = 0.95
): void {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }
  
  const img = new Image();
  img.onload = () => {
    // Set canvas size to match original image
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw the processed image
    ctx.drawImage(img, 0, 0);
    
    // Create download link
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `piixelated-image-${timestamp}.${format}`;
    
    if (format === 'png') {
      link.href = canvas.toDataURL('image/png');
    } else {
      link.href = canvas.toDataURL('image/jpeg', quality);
    }
    
    link.click();
  };
  
  img.onerror = () => {
    // Failed to load image for download
  };
  img.src = imageSrc;
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select a valid image file' };
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'Image file size must be less than 10MB' };
  }
  
  return { valid: true };
}

/**
 * Get image information
 */
export function getImageInfo(file: File): Promise<{width: number; height: number; size: string}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
