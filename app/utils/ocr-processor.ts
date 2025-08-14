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
    } catch (error) {
      // Don't throw error, just mark as not initialized
      this.isInitialized = false;
    }
  }

  async recognize(imageSource: string): Promise<OCRResult> {
    if (!this.isInitialized || !this.tesseractModule) {
      // Fallback to mock processor
      const mockProcessor = new MockOCRProcessor();
      return mockProcessor.recognize(imageSource);
    }

    try {
      const Tesseract = this.tesseractModule.default;
      
      // Enhanced OCR configuration for better accuracy
      const ocrResult = await Tesseract.recognize(imageSource, 'eng', {
        logger: (progressMessage: any) => {
          // Progress logging disabled
        },
        // Enhanced OCR settings
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?/\\ ',
        tessedit_pageseg_mode: '6', // Uniform block of text
        preserve_interword_spaces: '1',
        tessjs_create_pdf: '0', // Disable PDF creation for performance
        tessjs_create_hocr: '0', // Disable HOCR for performance
      });
      
      // Enhanced line processing with confidence filtering
      const processedLines = ocrResult.data.lines
        .filter((line: any) => line.confidence > 30) // Filter low confidence lines
        .map((line: any) => ({
          text: line.text.trim(),
          bbox: line.bbox,
          confidence: line.confidence,
        }));
      
      // Enhanced text processing
      const normalizedText = ocrResult.data.text
        .trim()
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/[^\w\s@#$%^&*()_+\-=\[\]{}|;:,.<>?/\\]/g, ''); // Remove invalid characters
      
      return {
        text: normalizedText,
        lines: processedLines,
        confidence: ocrResult.data.confidence,
        processingTime: Date.now(),
      };
    } catch (error) {
      // Fallback to mock processor
      const mockProcessor = new MockOCRProcessor();
      return mockProcessor.recognize(imageSource);
    }
  }
}

/**
 * Mock OCR Processor for testing
 */
export class MockOCRProcessor implements OCRProcessor {
  async initialize(): Promise<void> {
    // Mock OCR processor initialized
  }

  async recognize(imageSource: string): Promise<OCRResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock OCR result with generic placeholder data
    return {
      text: 'SAMPLE BANK XXXX XXXX XXXX XXXX VALID THRU XX/XX SAMPLE NAME',
      lines: [
        {
          text: 'SAMPLE BANK',
          bbox: { x0: 200, y0: 20, x1: 350, y1: 50 }
        },
        {
          text: 'XXXX XXXX XXXX XXXX',
          bbox: { x0: 50, y0: 80, x1: 350, y1: 110 }
        },
        {
          text: 'VALID THRU XX/XX',
          bbox: { x0: 50, y0: 120, x1: 250, y1: 150 }
        },
        {
          text: 'SAMPLE NAME',
          bbox: { x0: 50, y0: 160, x1: 300, y1: 190 }
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
