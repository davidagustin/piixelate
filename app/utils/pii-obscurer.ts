/**
 * PII Obscuring System
 * Provides multiple techniques for redacting and anonymizing PII data
 * 
 * Obscuring Techniques:
 * - Redaction (blackout)
 * - Anonymization (replacement with fake data)
 * - Masking (partial hiding)
 * - Encryption (reversible)
 * - Hashing (one-way)
 * - Tokenization (replacement with tokens)
 */

import { PIIDetection, PIIType } from '../types/pii-types';
import { errorHandler } from './error-handler';

/**
 * Obscuring technique types
 */
export type ObscuringTechnique = 
  | 'redaction'
  | 'anonymization'
  | 'masking'
  | 'subtle'
  | 'encryption'
  | 'hashing'
  | 'tokenization';

/**
 * Obscuring configuration
 */
interface ObscuringConfig {
  defaultTechnique: ObscuringTechnique;
  enableMultipleTechniques: boolean;
  preserveFormat: boolean;
  enableReversible: boolean;
  encryptionKey?: string;
  tokenPrefix: string;
  hashAlgorithm: 'md5' | 'sha1' | 'sha256';
  maskCharacter: string;
  anonymizationSeed?: number;
}

/**
 * Obscuring result
 */
interface ObscuringResult {
  originalText: string;
  obscuredText: string;
  technique: ObscuringTechnique;
  reversible: boolean;
  metadata?: Record<string, any>;
}

/**
 * Anonymization data generators
 */
interface AnonymizationData {
  names: string[];
  emails: string[];
  phones: string[];
  addresses: string[];
  ssn: string[];
  creditCards: string[];
}

/**
 * PII Obscurer class
 */
export class PIIObscurer {
  private config: ObscuringConfig;
  private anonymizationData: AnonymizationData;
  private tokenCounter = 0;
  private tokenMap = new Map<string, string>();

  constructor() {
    this.config = this.initializeConfig();
    this.anonymizationData = this.initializeAnonymizationData();
  }

  /**
   * Initialize configuration
   */
  private initializeConfig(): ObscuringConfig {
    return {
      defaultTechnique: 'subtle',
      enableMultipleTechniques: true,
      preserveFormat: true,
      enableReversible: false,
      tokenPrefix: 'PII_',
      hashAlgorithm: 'sha256',
      maskCharacter: '*',
      anonymizationSeed: Date.now(),
    };
  }

  /**
   * Initialize anonymization data
   */
  private initializeAnonymizationData(): AnonymizationData {
    return {
      names: [
        'Sample Name 1', 'Sample Name 2', 'Sample Name 3', 'Sample Name 4',
        'Sample Name 5', 'Sample Name 6', 'Sample Name 7', 'Sample Name 8',
        'Sample Name 9', 'Sample Name 10', 'Sample Name 11',
        'Sample Name 12', 'Sample Name 13', 'Sample Name 14', 'Sample Name 15'
      ],
      emails: [
        'sample1@example.com', 'sample2@example.com', 'sample3@example.com',
        'sample4@example.com', 'sample5@example.com', 'sample6@example.com',
        'sample7@example.com', 'sample8@example.com', 'sample9@example.com',
        'sample10@example.com', 'sample11@example.com',
        'sample12@example.com', 'sample13@example.com', 'sample14@example.com',
        'sample15@example.com'
      ],
      phones: [
        '(XXX) XXX-XXXX', '(XXX) XXX-XXXX', '(XXX) XXX-XXXX', '(XXX) XXX-XXXX',
        '(XXX) XXX-XXXX', '(XXX) XXX-XXXX', '(XXX) XXX-XXXX', '(XXX) XXX-XXXX',
        '(XXX) XXX-XXXX', '(XXX) XXX-XXXX', '(XXX) XXX-XXXX', '(XXX) XXX-XXXX',
        '(XXX) XXX-XXXX', '(XXX) XXX-XXXX', '(XXX) XXX-XXXX'
      ],
      addresses: [
        'XXX Sample St, Anytown, USA', 'XXX Sample Ave, Somewhere, USA', 'XXX Sample Rd, Elsewhere, USA',
        'XXX Sample St, Nowhere, USA', 'XXX Sample Dr, Anywhere, USA', 'XXX Sample Ln, Someplace, USA',
        'XXX Sample Way, Everywhere, USA', 'XXX Sample Ct, Nowhere, USA', 'XXX Sample Pl, Anywhere, USA',
        'XXX Sample Blvd, Somewhere, USA', 'XXX Sample St, Elsewhere, USA', 'XXX Sample Ave, Nowhere, USA',
        'XXX Sample Rd, Anywhere, USA', 'XXX Sample Dr, Someplace, USA', 'XXX Sample Ln, Everywhere, USA'
      ],
      ssn: [
        'XXX-XX-XXXX', 'XXX-XX-XXXX', 'XXX-XX-XXXX', 'XXX-XX-XXXX', 'XXX-XX-XXXX',
        'XXX-XX-XXXX', 'XXX-XX-XXXX', 'XXX-XX-XXXX', 'XXX-XX-XXXX', 'XXX-XX-XXXX',
        'XXX-XX-XXXX', 'XXX-XX-XXXX', 'XXX-XX-XXXX', 'XXX-XX-XXXX', 'XXX-XX-XXXX'
      ],
      creditCards: [
        'XXXX-XXXX-XXXX-XXXX', 'XXXX-XXXX-XXXX-XXXX', 'XXXX-XXXX-XXXX-XXXX',
        'XXXX-XXXX-XXXX-XXXX', 'XXXX-XXXX-XXXX-XXXX', 'XXXX-XXXX-XXXX-XXXX',
        'XXXX-XXXX-XXXX-XXXX', 'XXXX-XXXX-XXXX-XXXX', 'XXXX-XXXX-XXXX-XXXX',
        'XXXX-XXXX-XXXX-XXXX', 'XXXX-XXXX-XXXX-XXXX', 'XXXX-XXXX-XXXX-XXXX',
        'XXXX-XXXX-XXXX-XXXX', 'XXXX-XXXX-XXXX-XXXX', 'XXXX-XXXX-XXXX-XXXX'
      ],
    };
  }

  /**
   * Obscure PII detection
   * @param detection - PII detection to obscure
   * @param technique - Obscuring technique to use
   * @returns Obscuring result
   */
  public obscurePII(
    detection: PIIDetection,
    technique?: ObscuringTechnique
  ): ObscuringResult {
    try {
      const selectedTechnique = technique || this.config.defaultTechnique;
      
      switch (selectedTechnique) {
        case 'redaction':
          return this.redactPII(detection);
        case 'anonymization':
          return this.anonymizePII(detection);
        case 'masking':
          return this.maskPII(detection);
        case 'subtle':
          return this.subtleObscurePII(detection);
        case 'encryption':
          return this.encryptPII(detection);
        case 'hashing':
          return this.hashPII(detection);
        case 'tokenization':
          return this.tokenizePII(detection);
        default:
          return this.subtleObscurePII(detection);
      }
    } catch (error) {
      errorHandler.handleProcessingError('pii_obscuring', error as Error);
      return this.createErrorResult(detection.text);
    }
  }

  /**
   * Redact PII (blackout)
   * @param detection - PII detection
   * @returns Redaction result
   */
  private redactPII(detection: PIIDetection): ObscuringResult {
    const redactedText = detection.text.replace(/./g, '█');
    
    return {
      originalText: detection.text,
      obscuredText: redactedText,
      technique: 'redaction',
      reversible: false,
      metadata: {
        redactionType: 'full',
        character: '█',
      },
    };
  }

  /**
   * Anonymize PII (replace with fake data)
   * @param detection - PII detection
   * @returns Anonymization result
   */
  private anonymizePII(detection: PIIDetection): ObscuringResult {
    const fakeData = this.getFakeData(detection.type);
    
    return {
      originalText: detection.text,
      obscuredText: fakeData,
      technique: 'anonymization',
      reversible: false,
      metadata: {
        fakeDataType: detection.type,
        seed: this.config.anonymizationSeed,
      },
    };
  }

  /**
   * Subtle obscure PII (minimal hiding)
   * @param detection - PII detection
   * @returns Subtle obscuring result
   */
  private subtleObscurePII(detection: PIIDetection): ObscuringResult {
    let obscuredText = detection.text;
    
    switch (detection.type) {
      case 'credit_card':
        // Show only last 4 digits
        obscuredText = detection.text.replace(/\d{12}(\d{4})/g, '**** **** **** $1');
        break;
      case 'email':
        // Show only first letter and domain
        const [localPart, domainPart] = detection.text.split('@');
        if (localPart && domainPart) {
          obscuredText = `${localPart.charAt(0)}***@${domainPart}`;
        }
        break;
      case 'phone':
        // Show only area code and last 2 digits
        obscuredText = detection.text.replace(/(\d{3})\d{3}(\d{2})/g, '$1***$2');
        break;
      case 'ssn':
        // Show only last 4 digits
        obscuredText = detection.text.replace(/\d{5}(\d{4})/g, '***-**$1');
        break;
      case 'address':
        // Show only street number and city
        obscuredText = detection.text.replace(/(\d+)\s+[A-Za-z\s]+,\s*([A-Za-z\s]+)/g, '$1 *** St, $2');
        break;
      default:
        // For other types, just show first and last character
        if (detection.text.length > 2) {
          obscuredText = `${detection.text.charAt(0)}***${detection.text.charAt(detection.text.length - 1)}`;
        }
    }
    
    return {
      originalText: detection.text,
      obscuredText,
      technique: 'subtle',
      reversible: false,
      metadata: {
        subtleType: detection.type,
        preservationLevel: 'minimal',
      },
    };
  }

  /**
   * Mask PII (partial hiding)
   * @param detection - PII detection
   * @returns Masking result
   */
  private maskPII(detection: PIIDetection): ObscuringResult {
    let maskedText = detection.text;
    
    switch (detection.type) {
      case 'credit_card':
        maskedText = this.maskCreditCard(detection.text);
        break;
      case 'email':
        maskedText = this.maskEmail(detection.text);
        break;
      case 'phone':
        maskedText = this.maskPhone(detection.text);
        break;
      case 'ssn':
        maskedText = this.maskSSN(detection.text);
        break;
      case 'address':
        maskedText = this.maskAddress(detection.text);
        break;
      default:
        maskedText = this.maskGeneric(detection.text);
    }
    
    return {
      originalText: detection.text,
      obscuredText: maskedText,
      technique: 'masking',
      reversible: false,
      metadata: {
        maskType: detection.type,
        maskCharacter: this.config.maskCharacter,
      },
    };
  }

  /**
   * Encrypt PII (reversible)
   * @param detection - PII detection
   * @returns Encryption result
   */
  private encryptPII(detection: PIIDetection): ObscuringResult {
    if (!this.config.encryptionKey) {
      throw new Error('Encryption key not configured');
    }
    
    // Simple XOR encryption for demonstration
    const encryptedText = this.simpleEncrypt(detection.text, this.config.encryptionKey);
    
    return {
      originalText: detection.text,
      obscuredText: encryptedText,
      technique: 'encryption',
      reversible: true,
      metadata: {
        algorithm: 'xor',
        keyLength: this.config.encryptionKey.length,
      },
    };
  }

  /**
   * Hash PII (one-way)
   * @param detection - PII detection
   * @returns Hashing result
   */
  private hashPII(detection: PIIDetection): ObscuringResult {
    const hashedText = this.simpleHash(detection.text);
    
    return {
      originalText: detection.text,
      obscuredText: hashedText,
      technique: 'hashing',
      reversible: false,
      metadata: {
        algorithm: this.config.hashAlgorithm,
        hashLength: hashedText.length,
      },
    };
  }

  /**
   * Tokenize PII (replace with tokens)
   * @param detection - PII detection
   * @returns Tokenization result
   */
  private tokenizePII(detection: PIIDetection): ObscuringResult {
    const token = this.generateToken(detection.type);
    this.tokenMap.set(token, detection.text);
    
    return {
      originalText: detection.text,
      obscuredText: token,
      technique: 'tokenization',
      reversible: true,
      metadata: {
        tokenType: detection.type,
        tokenId: this.tokenCounter,
      },
    };
  }

  /**
   * Get fake data for anonymization
   * @param type - PII type
   * @returns Fake data
   */
  private getFakeData(type: PIIType): string {
    const seed = this.config.anonymizationSeed || 0;
    const index = (seed + this.tokenCounter++) % 15;
    
    switch (type) {
      case 'name':
        return this.anonymizationData.names[index] ?? `Sample Name ${index + 1}`;
      case 'email':
        return this.anonymizationData.emails[index] ?? `sample${index + 1}@example.com`;
      case 'phone':
        return this.anonymizationData.phones[index] ?? '(XXX) XXX-XXXX';
      case 'address':
        return this.anonymizationData.addresses[index] ?? 'XXX Sample St, Anytown, USA';
      case 'ssn':
        return this.anonymizationData.ssn[index] ?? 'XXX-XX-XXXX';
      case 'credit_card':
        return this.anonymizationData.creditCards[index] ?? 'XXXX-XXXX-XXXX-XXXX';
      default:
        return `FAKE_${type.toUpperCase()}_${index}`;
    }
  }

  /**
   * Mask credit card number
   * @param text - Credit card text
   * @returns Masked credit card
   */
  private maskCreditCard(text: string): string {
    // Show first 4 and last 4 digits, mask the middle
    return text.replace(/(\d{4})\d{4}(\d{4})/g, '$1****$2');
  }

  /**
   * Mask email address
   * @param text - Email text
   * @returns Masked email
   */
  private maskEmail(text: string): string {
    const [localPart, domainPart] = text.split('@');
    const local = localPart ?? '';
    const domain = domainPart ?? '';
    if (local.length <= 2) {
      return `${local.charAt(0)}***@${domain}`;
    }
    // Show first and last character of local part, mask the middle
    return `${local.charAt(0)}***${local.charAt(local.length - 1)}@${domain}`;
  }

  /**
   * Mask phone number
   * @param text - Phone text
   * @returns Masked phone
   */
  private maskPhone(text: string): string {
    // Show area code and last 2 digits, mask the middle
    return text.replace(/(\d{3})\d{3}(\d{2})/g, '$1***$2');
  }

  /**
   * Mask SSN
   * @param text - SSN text
   * @returns Masked SSN
   */
  private maskSSN(text: string): string {
    // Show first 3 and last 4 digits, mask the middle
    return text.replace(/(\d{3})\d{2}(\d{4})/g, '$1**$2');
  }

  /**
   * Mask address
   * @param text - Address text
   * @returns Masked address
   */
  private maskAddress(text: string): string {
    // Show street number and last word, mask the middle
    return text.replace(/(\d+)\s+([A-Za-z\s]+)\s+([A-Za-z]+)/g, '$1 *** $3');
  }

  /**
   * Mask generic text
   * @param text - Generic text
   * @returns Masked text
   */
  private maskGeneric(text: string): string {
    if (text.length <= 2) {
      return this.config.maskCharacter.repeat(text.length);
    }
    return `${text.charAt(0)}${this.config.maskCharacter.repeat(text.length - 2)}${text.charAt(text.length - 1)}`;
  }

  /**
   * Simple encryption (XOR)
   * @param text - Text to encrypt
   * @param key - Encryption key
   * @returns Encrypted text
   */
  private simpleEncrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result); // Base64 encode
  }

  /**
   * Simple hash function
   * @param text - Text to hash
   * @returns Hashed text
   */
  private simpleHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Generate token
   * @param type - PII type
   * @returns Token
   */
  private generateToken(type: PIIType): string {
    this.tokenCounter++;
    return `${this.config.tokenPrefix}${type.toUpperCase()}_${this.tokenCounter}`;
  }

  /**
   * Create error result
   * @param originalText - Original text
   * @returns Error result
   */
  private createErrorResult(originalText: string): ObscuringResult {
    return {
      originalText,
      obscuredText: '***ERROR***',
      technique: 'masking',
      reversible: false,
      metadata: {
        error: 'Obscuring failed',
      },
    };
  }

  /**
   * Decrypt PII (if reversible)
   * @param obscuredText - Obscured text
   * @param technique - Obscuring technique
   * @param metadata - Obscuring metadata
   * @returns Original text or null
   */
  public decryptPII(
    obscuredText: string,
    technique: ObscuringTechnique,
    _metadata?: Record<string, any>
  ): string | null {
    try {
      switch (technique) {
        case 'encryption':
          if (!this.config.encryptionKey) {
            throw new Error('Encryption key not configured');
          }
          const decoded = atob(obscuredText);
          let result = '';
          for (let i = 0; i < decoded.length; i++) {
            const charCode = decoded.charCodeAt(i) ^ this.config.encryptionKey.charCodeAt(i % this.config.encryptionKey.length);
            result += String.fromCharCode(charCode);
          }
          return result;
        case 'tokenization':
          return this.tokenMap.get(obscuredText) || null;
        default:
          return null; // Not reversible
      }
    } catch (error) {
      errorHandler.handleProcessingError('pii_decryption', error as Error);
      return null;
    }
  }

  /**
   * Batch obscure multiple PII detections
   * @param detections - Array of PII detections
   * @param technique - Obscuring technique
   * @returns Array of obscuring results
   */
  public batchObscurePII(
    detections: PIIDetection[],
    technique?: ObscuringTechnique
  ): ObscuringResult[] {
    return detections.map(detection => this.obscurePII(detection, technique));
  }

  /**
   * Get available obscuring techniques
   * @returns Array of available techniques
   */
  public getAvailableTechniques(): ObscuringTechnique[] {
    return ['subtle', 'masking', 'anonymization', 'redaction', 'encryption', 'hashing', 'tokenization'];
  }

  /**
   * Update configuration
   * @param newConfig - New configuration
   */
  public updateConfig(newConfig: Partial<ObscuringConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get configuration
   * @returns Current configuration
   */
  public getConfig(): ObscuringConfig {
    return { ...this.config };
  }

  /**
   * Clear token map
   */
  public clearTokenMap(): void {
    this.tokenMap.clear();
    this.tokenCounter = 0;
  }

  /**
   * Get token map statistics
   * @returns Token map statistics
   */
  public getTokenMapStats(): { size: number; counter: number } {
    return {
      size: this.tokenMap.size,
      counter: this.tokenCounter,
    };
  }
}

/**
 * Export singleton instance
 */
export const piiObscurer = new PIIObscurer();

/**
 * Utility function for backward compatibility
 */
export function obscurePII(
  detection: PIIDetection,
  technique?: ObscuringTechnique
): ObscuringResult {
  return piiObscurer.obscurePII(detection, technique);
}
