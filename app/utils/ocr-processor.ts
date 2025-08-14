/**
 * OCR Processor Module
 * Handles Optical Character Recognition for PII detection
 */

import { OCRResult } from '../types/pii-types';

export interface OCRProcessor {
  initialize(): Promise<void>;
  recognize(imageSrc: string): Promise<OCRResult>;
}

/**
 * Tesseract.js OCR Processor
 */
export class TesseractOCRProcessor implements OCRProcessor {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      // Test import to ensure Tesseract is available
      await import('tesseract.js');
      this.isInitialized = true;
      console.log('Tesseract.js OCR processor initialized');
    } catch (error) {
      console.error('Failed to initialize Tesseract.js:', error);
      throw new Error('Tesseract.js not available');
    }
  }

  async recognize(imageSrc: string): Promise<OCRResult> {
    if (!this.isInitialized) {
      throw new Error('OCR processor not initialized');
    }

    try {
      // Dynamic import to avoid SSR issues
      const Tesseract = (await import('tesseract.js')).default;
      
      const result = await Tesseract.recognize(imageSrc, 'eng', {
        logger: (m: any) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('OCR Progress:', m);
          }
        },
      });
      
      const lines = result.data.lines.map((line: any) => ({
        text: line.text.trim(),
        bbox: line.bbox,
      }));
      
      return {
        text: result.data.text.trim(),
        lines,
      };
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Failed to perform OCR on image');
    }
  }
}

/**
 * Mock OCR Processor for testing
 */
export class MockOCRProcessor implements OCRProcessor {
  async initialize(): Promise<void> {
    console.log('Mock OCR processor initialized');
  }

  async recognize(imageSrc: string): Promise<OCRResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock OCR result
    return {
      text: 'Sample text with credit card 1234-5678-9012-3456 and phone (555) 123-4567',
      lines: [
        {
          text: 'Sample text with credit card 1234-5678-9012-3456',
          bbox: { x0: 0, y0: 0, x1: 400, y1: 30 }
        },
        {
          text: 'and phone (555) 123-4567',
          bbox: { x0: 0, y0: 40, x1: 300, y1: 70 }
        }
      ]
    };
  }
}

/**
 * OCR Processor Factory
 */
export class OCRProcessorFactory {
  static async create(type: 'tesseract' | 'mock' = 'tesseract'): Promise<OCRProcessor> {
    switch (type) {
      case 'tesseract':
        const processor = new TesseractOCRProcessor();
        await processor.initialize();
        return processor;
      case 'mock':
        const mockProcessor = new MockOCRProcessor();
        await mockProcessor.initialize();
        return mockProcessor;
      default:
        throw new Error(`Unknown OCR processor type: ${type}`);
    }
  }
}

// Export singleton instance
export const ocrProcessor = new TesseractOCRProcessor();
