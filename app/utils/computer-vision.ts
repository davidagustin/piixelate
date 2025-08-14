// Computer Vision Module for Enhanced PII Detection
// Integrates multiple CV libraries for comprehensive PII detection

import { VisionDetection } from '../types/pii-types';

export interface DocumentRegion {
  type: 'header' | 'body' | 'footer' | 'sidebar';
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  text: string;
}

// Canvas-based image processing (OpenCV alternative)
class CanvasProcessor {
  async initialize(): Promise<void> {
    console.log('Canvas-based image processor initialized');
  }

  // Detect text regions using canvas-based image processing
  async detectTextRegions(imageData: ImageData): Promise<VisionDetection[]> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(imageData, 0, 0);

      // Convert to grayscale and analyze
      const grayData = this.convertToGrayscale(imageData);
      const textRegions = this.findTextRegions(grayData, imageData.width, imageData.height);

      return textRegions.map(region => ({
        type: 'text_region' as const,
        confidence: region.confidence,
        boundingBox: region.boundingBox
      }));
    } catch (error) {
      console.error('Canvas text detection error:', error);
      return [];
    }
  }

  // Detect document structure using canvas
  async detectDocumentStructure(imageData: ImageData): Promise<DocumentRegion[]> {
    try {
      const regions: DocumentRegion[] = [];
      const { width, height } = imageData;

      // Simple document structure detection based on image analysis
      const headerRegion = {
        type: 'header' as const,
        confidence: 0.8,
        boundingBox: { x: 0, y: 0, width, height: height * 0.2 },
        text: ''
      };

      const bodyRegion = {
        type: 'body' as const,
        confidence: 0.9,
        boundingBox: { x: 0, y: height * 0.2, width, height: height * 0.6 },
        text: ''
      };

      const footerRegion = {
        type: 'footer' as const,
        confidence: 0.7,
        boundingBox: { x: 0, y: height * 0.8, width, height: height * 0.2 },
        text: ''
      };

      regions.push(headerRegion, bodyRegion, footerRegion);
      return regions;
    } catch (error) {
      console.error('Canvas document detection error:', error);
      return [];
    }
  }

  // Convert image to grayscale
  private convertToGrayscale(imageData: ImageData): Uint8ClampedArray {
    const grayData = new Uint8ClampedArray(imageData.data.length / 4);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      
      // Convert to grayscale using luminance formula
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      grayData[i / 4] = gray;
    }
    
    return grayData;
  }

  // Find text regions using edge detection and contour analysis
  private findTextRegions(grayData: Uint8ClampedArray, width: number, height: number): Array<{confidence: number, boundingBox: any}> {
    const regions: Array<{confidence: number, boundingBox: any}> = [];
    
    // Simple edge detection
    const edges = this.detectEdges(grayData, width, height);
    
    // Find connected components (simplified contour detection)
    const components = this.findConnectedComponents(edges, width, height);
    
    // Filter and classify regions
    components.forEach(component => {
      if (component.area > 100 && component.area < 10000) {
        const aspectRatio = component.width / component.height;
        if (aspectRatio > 0.1 && aspectRatio < 10) {
          regions.push({
            confidence: 0.7,
            boundingBox: {
              x: component.x,
              y: component.y,
              width: component.width,
              height: component.height
            }
          });
        }
      }
    });
    
    return regions;
  }

  // Simple edge detection
  private detectEdges(grayData: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
    const edges = new Uint8ClampedArray(grayData.length);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Simple Sobel edge detection
        const gx = grayData[idx + 1] - grayData[idx - 1];
        const gy = grayData[idx + width] - grayData[idx - width];
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        
        edges[idx] = magnitude > 30 ? 255 : 0;
      }
    }
    
    return edges;
  }

  // Find connected components (simplified)
  private findConnectedComponents(edges: Uint8ClampedArray, width: number, height: number): Array<{x: number, y: number, width: number, height: number, area: number}> {
    const components: Array<{x: number, y: number, width: number, height: number, area: number}> = [];
    const visited = new Set<number>();
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        
        if (edges[idx] > 0 && !visited.has(idx)) {
          const component = this.floodFill(edges, width, height, x, y, visited);
          if (component.area > 50) {
            components.push(component);
          }
        }
      }
    }
    
    return components;
  }

  // Flood fill algorithm for connected component analysis
  private floodFill(edges: Uint8ClampedArray, width: number, height: number, startX: number, startY: number, visited: Set<number>): {x: number, y: number, width: number, height: number, area: number} {
    const stack: [number, number][] = [[startX, startY]];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;
    let area = 0;
    
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const idx = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited.has(idx) || edges[idx] === 0) {
        continue;
      }
      
      visited.add(idx);
      area++;
      
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      
      // Add neighbors
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      area
    };
  }
}

// TensorFlow.js integration for ML-based detection
class TensorFlowProcessor {
  private model: any;
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      const tf = await import('@tensorflow/tfjs');
      await tf.setBackend('webgl');
      
      // Load pre-trained model for text detection (if available)
      // For now, we'll use a basic model or create a simple one
      console.log('TensorFlow.js initialized');
      this.isInitialized = true;
    } catch (error) {
      console.warn('TensorFlow.js not available:', error);
    }
  }

  // Detect objects using TensorFlow.js
  async detectObjects(imageData: ImageData): Promise<VisionDetection[]> {
    if (!this.isInitialized) return [];

    try {
      const tf = await import('@tensorflow/tfjs');
      
      // Convert image to tensor
      const tensor = tf.browser.fromPixels(imageData, 3);
      const expandedTensor = tensor.expandDims(0);
      
      // Normalize the image
      const normalized = expandedTensor.div(255.0);
      
      // For now, return basic detections
      // In production, you would load a pre-trained model
      const detections: VisionDetection[] = [];
      
      // Clean up tensors
      tensor.dispose();
      expandedTensor.dispose();
      normalized.dispose();
      
      return detections;
    } catch (error) {
      console.error('TensorFlow detection error:', error);
      return [];
    }
  }
}

// MediaPipe integration for document and card detection
class MediaPipeProcessor {
  private documentDetector: any;
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      const { DocumentDetector } = await import('@mediapipe/tasks-vision');
      
      // Initialize document detector
      this.documentDetector = await DocumentDetector.createFromOptions({
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/document_detector/document_detector/float32/1/document_detector.tflite',
          delegate: 'GPU'
        },
        runningMode: 'IMAGE'
      });
      
      this.isInitialized = true;
      console.log('MediaPipe Document Detector initialized');
    } catch (error) {
      console.warn('MediaPipe not available:', error);
    }
  }

  async detectDocuments(imageData: ImageData): Promise<VisionDetection[]> {
    if (!this.isInitialized || !this.documentDetector) return [];

    try {
      const { ImageSourceFormat } = await import('@mediapipe/tasks-vision');
      
      const imageSource = {
        data: imageData.data,
        width: imageData.width,
        height: imageData.height,
        format: ImageSourceFormat.SRGB
      };

      const results = this.documentDetector.detect(imageSource);
      
      return results.detections.map((detection: any) => ({
        type: 'document',
        confidence: detection.categories[0]?.score || 0.5,
        boundingBox: {
          x: detection.boundingBox.originX,
          y: detection.boundingBox.originY,
          width: detection.boundingBox.width,
          height: detection.boundingBox.height
        }
      }));
    } catch (error) {
      console.error('MediaPipe detection error:', error);
      return [];
    }
  }
}

// Face-api.js integration for face detection
class FaceAPIProcessor {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      const faceapi = await import('face-api.js');
      
      // Load face detection models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      ]);
      
      this.isInitialized = true;
      console.log('Face-api.js initialized');
    } catch (error) {
      console.warn('Face-api.js not available:', error);
    }
  }

  async detectFaces(imageData: ImageData): Promise<VisionDetection[]> {
    if (!this.isInitialized) return [];

    try {
      const faceapi = await import('face-api.js');
      
      // Convert ImageData to HTMLCanvasElement for face-api.js
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(imageData, 0, 0);
      
      const detections = await faceapi.detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions());
      
      return detections.map(detection => ({
        type: 'face',
        confidence: detection.score,
        boundingBox: {
          x: detection.box.x,
          y: detection.box.y,
          width: detection.box.width,
          height: detection.box.height
        }
      }));
    } catch (error) {
      console.error('Face detection error:', error);
      return [];
    }
  }
}

// Main Computer Vision Processor
export class ComputerVisionProcessor {
  private canvas: CanvasProcessor;
  private tensorflow: TensorFlowProcessor;
  private mediapipe: MediaPipeProcessor;
  private faceapi: FaceAPIProcessor;
  private isInitialized = false;

  constructor() {
    this.canvas = new CanvasProcessor();
    this.tensorflow = new TensorFlowProcessor();
    this.mediapipe = new MediaPipeProcessor();
    this.faceapi = new FaceAPIProcessor();
  }

  async initialize(): Promise<void> {
    try {
      await Promise.allSettled([
        this.canvas.initialize(),
        this.tensorflow.initialize(),
        this.mediapipe.initialize(),
        this.faceapi.initialize()
      ]);
      
      this.isInitialized = true;
      console.log('Computer Vision Processor initialized');
    } catch (error) {
      console.error('Failed to initialize Computer Vision Processor:', error);
    }
  }

  // Comprehensive PII detection using multiple CV approaches
  async detectPII(imageData: ImageData): Promise<VisionDetection[]> {
    if (!this.isInitialized) {
      console.warn('Computer Vision Processor not initialized');
      return [];
    }

    try {
      const [
        textRegions,
        documents,
        objects,
        faces
      ] = await Promise.allSettled([
        this.canvas.detectTextRegions(imageData),
        this.mediapipe.detectDocuments(imageData),
        this.tensorflow.detectObjects(imageData),
        this.faceapi.detectFaces(imageData)
      ]);

      const allDetections: VisionDetection[] = [];

      // Add successful detections
      if (textRegions.status === 'fulfilled') {
        allDetections.push(...textRegions.value);
      }
      if (documents.status === 'fulfilled') {
        allDetections.push(...documents.value);
      }
      if (objects.status === 'fulfilled') {
        allDetections.push(...objects.value);
      }
      if (faces.status === 'fulfilled') {
        allDetections.push(...faces.value);
      }

      // Remove overlapping detections
      return this.removeOverlappingDetections(allDetections);
    } catch (error) {
      console.error('Computer Vision PII detection error:', error);
      return [];
    }
  }

  // Detect document structure for better OCR
  async detectDocumentStructure(imageData: ImageData): Promise<DocumentRegion[]> {
    if (!this.isInitialized) return [];

    try {
      return await this.canvas.detectDocumentStructure(imageData);
    } catch (error) {
      console.error('Document structure detection error:', error);
      return [];
    }
  }

  // Remove overlapping detections to avoid duplicates
  private removeOverlappingDetections(detections: VisionDetection[]): VisionDetection[] {
    const filtered: VisionDetection[] = [];
    
    for (const detection of detections) {
      let isOverlapping = false;
      
      for (const existing of filtered) {
        const overlap = this.calculateOverlap(detection.boundingBox, existing.boundingBox);
        if (overlap > 0.5) { // 50% overlap threshold
          isOverlapping = true;
          break;
        }
      }
      
      if (!isOverlapping) {
        filtered.push(detection);
      }
    }
    
    return filtered;
  }

  // Calculate overlap between two bounding boxes
  private calculateOverlap(box1: any, box2: any): number {
    const x1 = Math.max(box1.x, box2.x);
    const y1 = Math.max(box1.y, box2.y);
    const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
    const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);
    
    if (x2 <= x1 || y2 <= y1) return 0;
    
    const intersection = (x2 - x1) * (y2 - y1);
    const area1 = box1.width * box1.height;
    const area2 = box2.width * box2.height;
    const union = area1 + area2 - intersection;
    
    return intersection / union;
  }
}

// Export singleton instance
export const computerVisionProcessor = new ComputerVisionProcessor();
