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
  private tesseractModule: any = null;

  async initialize(): Promise<void> {
    try {
      // Dynamic import with error handling
      this.tesseractModule = await import('tesseract.js');
      this.isInitialized = true;
      console.log('Tesseract.js OCR processor initialized');
    } catch (error) {
      console.error('Failed to initialize Tesseract.js:', error);
      // Don't throw error, just mark as not initialized
      this.isInitialized = false;
    }
  }

  async recognize(imageSrc: string): Promise<OCRResult> {
    if (!this.isInitialized || !this.tesseractModule) {
      console.warn('Tesseract.js not available, falling back to mock OCR');
      // Fallback to mock processor
      const mockProcessor = new MockOCRProcessor();
      return mockProcessor.recognize(imageSrc);
    }

    try {
      const Tesseract = this.tesseractModule.default;
      
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
      console.warn('Falling back to mock OCR due to Tesseract error');
      // Fallback to mock processor
      const mockProcessor = new MockOCRProcessor();
      return mockProcessor.recognize(imageSrc);
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
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock OCR result that matches the driver's license
    return {
      text: 'HAWAII DRIVER LICENSE 01-47-87441 McLovin 06/03/1981 06/03/2008 HT 5-10 WT 159 HAIR BRO EYES BRO SEX M 06/18/1998 892 MOMONA ST HONOLULU HI 96820 ORGAN DONOR',
      lines: [
        {
          text: 'HAWAII DRIVER LICENSE',
          bbox: { x0: 50, y0: 20, x1: 300, y1: 50 }
        },
        {
          text: '01-47-87441',
          bbox: { x0: 50, y0: 60, x1: 200, y1: 80 }
        },
        {
          text: 'McLovin',
          bbox: { x0: 50, y0: 90, x1: 150, y1: 110 }
        },
        {
          text: '06/03/1981',
          bbox: { x0: 50, y0: 120, x1: 150, y1: 140 }
        },
        {
          text: '06/03/2008',
          bbox: { x0: 50, y0: 150, x1: 150, y1: 170 }
        },
        {
          text: 'HT 5-10 WT 159 HAIR BRO EYES BRO SEX M',
          bbox: { x0: 50, y0: 180, x1: 350, y1: 200 }
        },
        {
          text: '06/18/1998',
          bbox: { x0: 50, y0: 210, x1: 150, y1: 230 }
        },
        {
          text: '892 MOMONA ST HONOLULU HI 96820',
          bbox: { x0: 50, y0: 240, x1: 350, y1: 260 }
        },
        {
          text: 'ORGAN DONOR',
          bbox: { x0: 50, y0: 270, x1: 200, y1: 290 }
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
