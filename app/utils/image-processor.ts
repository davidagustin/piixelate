/**
 * Image Processing Module
 * Handles image manipulation, pixelation, and canvas operations
 */

import { BoundingBox, PIIDetection } from '../types/pii-types';

/**
 * Enhanced pixelation function with stronger privacy protection
 */
export function pixelateRegions(
  canvas: HTMLCanvasElement,
  detections: PIIDetection[],
  pixelSize: number = 8
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Failed to get canvas context');
    return;
  }
  
  detections.forEach(detection => {
    const { x, y, width, height } = detection.boundingBox;
    
    // Expand the region slightly to ensure complete coverage
    const expandedX = Math.max(0, x - 5);
    const expandedY = Math.max(0, y - 5);
    const expandedWidth = Math.min(canvas.width - expandedX, width + 10);
    const expandedHeight = Math.min(canvas.height - expandedY, height + 10);
    
    // Get the image data for the expanded region
    const imageData = ctx.getImageData(expandedX, expandedY, expandedWidth, expandedHeight);
    const data = imageData.data;
    
    // Apply stronger pixelation for numerical and text data
    let strongPixelSize = Math.max(pixelSize, 20); // Much larger base pixels for stronger effect
    
    // Extra strong protection for numerical data
    if (detection.type === 'numerical_data') {
      strongPixelSize = Math.max(strongPixelSize, 25); // Much larger pixels for numbers
    }
    
    // Strong protection for sensitive data (dates, birthdays, IDs)
    if (detection.type === 'sensitive_data') {
      strongPixelSize = Math.max(strongPixelSize, 22); // Large pixels for sensitive data
    }
    
    // Strong protection for barcodes
    if (detection.type === 'barcode') {
      strongPixelSize = Math.max(strongPixelSize, 25); // Large pixels for barcodes
    }
    
    // Strong protection for credit cards
    if (detection.type === 'credit_card') {
      strongPixelSize = Math.max(strongPixelSize, 30); // Very large pixels for credit cards
    }
    
    // Strong protection for driver's licenses
    if (detection.type === 'drivers_license') {
      strongPixelSize = Math.max(strongPixelSize, 28); // Large pixels for driver's licenses
    }
    
    // Apply pixelation
    applyPixelation(data, expandedWidth, expandedHeight, strongPixelSize);
    
    // Put the pixelated image data back
    ctx.putImageData(imageData, expandedX, expandedY);
    
    // Apply multiple blur effects for maximum privacy
    applyBlurEffects(ctx, expandedX, expandedY, expandedWidth, expandedHeight, detection.type);
    
    // Apply additional blackout protection for highly sensitive data
    if (detection.type === 'credit_card' || detection.type === 'drivers_license' || detection.type === 'ssn') {
      applyBlackoutProtection(ctx, expandedX, expandedY, expandedWidth, expandedHeight);
    }
  });
}

/**
 * Apply blackout protection for maximum privacy
 */
function applyBlackoutProtection(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  // Create a semi-transparent black overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(x, y, width, height);
  
  // Apply additional blur on top
  ctx.filter = 'blur(8px)';
  ctx.drawImage(ctx.canvas, x, y, width, height, x, y, width, height);
  ctx.filter = 'none';
}

/**
 * Apply enhanced pixelation to image data for maximum privacy protection
 */
function applyPixelation(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  pixelSize: number
): void {
  // Use much larger pixel sizes for better privacy protection
  const enhancedPixelSize = Math.max(pixelSize, 20); // Minimum 20px for effective obscuring
  
  for (let py = 0; py < height; py += enhancedPixelSize) {
    for (let px = 0; px < width; px += enhancedPixelSize) {
      // Calculate average color for this block
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      
      for (let dy = 0; dy < enhancedPixelSize && py + dy < height; dy++) {
        for (let dx = 0; dx < enhancedPixelSize && px + dx < width; dx++) {
          const index = ((py + dy) * width + (px + dx)) * 4;
          r += data[index];
          g += data[index + 1];
          b += data[index + 2];
          a += data[index + 3];
          count++;
        }
      }
      
      // Average the colors
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      a = Math.round(a / count);
      
      // Apply the average color to the entire block with solid fill
      for (let dy = 0; dy < enhancedPixelSize && py + dy < height; dy++) {
        for (let dx = 0; dx < enhancedPixelSize && px + dx < width; dx++) {
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
  const secondPassPixelSize = Math.max(pixelSize / 2, 8);
  for (let py = 0; py < height; py += secondPassPixelSize) {
    for (let px = 0; px < width; px += secondPassPixelSize) {
      // Calculate average color for this block
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      
      for (let dy = 0; dy < secondPassPixelSize && py + dy < height; dy++) {
        for (let dx = 0; dx < secondPassPixelSize && px + dx < width; dx++) {
          const index = ((py + dy) * width + (px + dx)) * 4;
          r += data[index];
          g += data[index + 1];
          b += data[index + 2];
          a += data[index + 3];
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
 * Apply enhanced blur effects for maximum privacy protection
 */
function applyBlurEffects(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  detectionType: string
): void {
  let blurStrength = 8; // Base blur strength increased
  
  // Extra strong blur for numerical data
  if (detectionType === 'numerical_data') {
    blurStrength = 12; // Much stronger blur for numbers
  }
  
  // Strong blur for sensitive data (dates, birthdays, IDs)
  if (detectionType === 'sensitive_data') {
    blurStrength = 10; // Strong blur for sensitive data
  }
  
  // Strong blur for barcodes
  if (detectionType === 'barcode') {
    blurStrength = 12; // Strong blur for barcodes
  }
  
  // Strong blur for credit cards
  if (detectionType === 'credit_card') {
    blurStrength = 15; // Very strong blur for credit cards
  }
  
  // Strong blur for driver's licenses
  if (detectionType === 'drivers_license') {
    blurStrength = 12; // Strong blur for driver's licenses
  }
  
  // Apply multiple blur passes for maximum protection
  for (let i = 0; i < 3; i++) {
    ctx.filter = `blur(${blurStrength}px)`;
    ctx.drawImage(ctx.canvas, x, y, width, height, x, y, width, height);
    ctx.filter = 'none';
  }
  
  // Apply additional blur with different strengths
  ctx.filter = 'blur(6px)';
  ctx.drawImage(ctx.canvas, x, y, width, height, x, y, width, height);
  ctx.filter = 'none';
  
  ctx.filter = 'blur(4px)';
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
  pixelSize: number = 8
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
      pixelateRegions(canvas, detections, pixelSize);
      
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
    console.error('Failed to get canvas context');
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
  
  img.onerror = () => console.error('Failed to load image for download');
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
