/**
 * PII Detection Patterns
 * Comprehensive regex patterns for detecting various types of PII
 */

export interface PIIPattern {
  type: string;
  patterns: RegExp[];
  description: string;
  confidence: number;
}

/**
 * Comprehensive PII patterns with enhanced coverage
 */
export const PII_PATTERNS: Record<string, RegExp[]> = {
  // Credit card patterns (various formats)
  credit_card: [
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/,
    /\b\d{4}[- ]?\d{6}[- ]?\d{5}\b/, // Amex format
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{3}\b/, // 15-digit cards
  ],
  
  // Phone number patterns
  phone: [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
    /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/,
    /\b\+\d{1,3}[- ]?\d{3}[- ]?\d{3}[- ]?\d{4}\b/, // International
  ],
  
  // Social Security Number
  ssn: [
    /\b\d{3}-\d{2}-\d{4}\b/,
    /\b\d{3}\s\d{2}\s\d{4}\b/,
  ],
  
  // Email addresses
  email: [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  ],
  
  // Address patterns
  address: [
    /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Way|Terrace|Ter)\b/gi,
    /\b\d+\s+[A-Za-z\s]+(?:Apartment|Apt|Suite|Ste|Unit|Floor|Fl)\s*\d*\b/gi,
  ],
  
  // Street signs and traffic signs
  street_sign: [
    /\b[A-Z]{1,3}\s+\d+\b/gi, // Route numbers like "I-95", "US 1"
    /\b\d+\s+[A-Z]{1,3}\b/gi, // "95 I", "1 US"
    /\b(?:STOP|YIELD|SPEED|PARKING|NO\s+PARKING|ONE\s+WAY)\b/gi,
  ],
  
  // License plates (US format)
  license_plate: [
    /\b[A-Z]{1,3}\s*\d{1,4}\s*[A-Z]{1,3}\b/gi, // "ABC 123" or "ABC123"
    /\b\d{1,4}\s*[A-Z]{1,3}\s*[A-Z]{1,3}\b/gi, // "123 ABC"
  ],
  
  // Names (common patterns)
  name: [
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/, // First Last
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/, // First Middle Last
  ],
  
  // Driver's License patterns
  drivers_license: [
    /\b\d{2}-\d{2}-\d{5}\b/, // Hawaii format: 01-47-87441
    /\b[A-Z]{1,2}\d{6,8}\b/, // Various state formats
    /\b\d{1,2}\/\d{2}\/\d{4}\b/, // Date formats like 06/03/2008
    /\b(?:HT|WT|HAIR|EYES|SEX)\s*[:=]\s*\S+\b/gi, // Physical characteristics
    /\b(?:ISSUE DATE|CLASS|RESTR|ENDORSE)\s*[:=]\s*\S+\b/gi, // License fields
  ],
  
  // Passport numbers (international formats)
  passport_number: [
    /\b[A-Z]{1,2}\d{6,9}\b/gi, // US passport: A1234567
    /\b\d{9}\b/g, // 9-digit passport numbers
    /\b[A-Z]\d{8}\b/gi, // 8-digit with letter prefix
    /\b(?:PASSPORT|PASSPORT NO|PASSPORT NUMBER)\s*[:=]?\s*[A-Z0-9]{6,9}\b/gi,
  ],
  
  // Medical information patterns
  medical_info: [
    /\b(?:DIAGNOSIS|DIAGNOSED|CONDITION|SYMPTOM|MEDICATION|PRESCRIPTION|DOSAGE|MG|ML)\s*[:=]?\s*\S+\b/gi,
    /\b(?:BLOOD TYPE|ALLERGY|ALLERGIC|CHRONIC|ACUTE|TREATMENT|THERAPY)\s*[:=]?\s*\S+\b/gi,
    /\b(?:HEIGHT|WEIGHT|BMI|BLOOD PRESSURE|HEART RATE|TEMPERATURE)\s*[:=]?\s*\d+\b/gi,
    /\b(?:PATIENT|MEDICAL|HEALTH|CLINIC|HOSPITAL|DOCTOR|PHYSICIAN)\s*[:=]?\s*\S+\b/gi,
  ],
  
  // Financial data patterns
  financial_data: [
    /\b(?:ACCOUNT|ACCT|ROUTING|SWIFT|IBAN|BANK|FINANCIAL)\s*[:=]?\s*[A-Z0-9]{8,}\b/gi,
    /\b(?:BALANCE|AMOUNT|TRANSACTION|DEPOSIT|WITHDRAWAL)\s*[:=]?\s*\$?\d+[,.]?\d*\b/gi,
    /\b(?:INVESTMENT|STOCK|BOND|MUTUAL FUND|PORTFOLIO)\s*[:=]?\s*\S+\b/gi,
    /\b(?:CREDIT SCORE|FICO|DEBT|LOAN|MORTGAGE)\s*[:=]?\s*\d+\b/gi,
  ],
  
  // Biometric data patterns
  biometric_data: [
    /\b(?:FINGERPRINT|RETINA|IRIS|FACE|VOICE|DNA|BIOMETRIC)\s*[:=]?\s*\S+\b/gi,
    /\b(?:FACIAL|VOICE|FINGER|PALM|VEIN)\s*(?:RECOGNITION|SCAN|ID)\s*[:=]?\s*\S+\b/gi,
  ],
  
  // IP addresses
  ip_address: [
    /\b(?:IP|IP ADDRESS|INTERNET PROTOCOL)\s*[:=]?\s*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/gi,
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  ],
  
  // MAC addresses
  mac_address: [
    /\b(?:MAC|MAC ADDRESS|HARDWARE ADDRESS)\s*[:=]?\s*[0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}\b/gi,
    /\b[0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}\b/g,
  ],
  
  // Vehicle VIN numbers
  vehicle_vin: [
    /\b(?:VIN|VEHICLE IDENTIFICATION)\s*[:=]?\s*[A-HJ-NPR-Z0-9]{17}\b/gi,
    /\b[A-HJ-NPR-Z0-9]{17}\b/g, // 17-character VIN
  ],
  
  // Insurance numbers
  insurance_number: [
    /\b(?:INSURANCE|POLICY|CLAIM)\s*(?:NUMBER|NO|ID)\s*[:=]?\s*[A-Z0-9]{8,}\b/gi,
    /\b[A-Z]{2,3}\d{6,10}\b/gi, // Insurance format
  ],
  
  // Bank account numbers
  bank_account: [
    /\b(?:ACCOUNT|ACCT|BANK)\s*(?:NUMBER|NO|ID)\s*[:=]?\s*\d{8,12}\b/gi,
    /\b\d{8,12}\b/g, // 8-12 digit account numbers
  ],
  
  // Tax ID numbers (EIN, ITIN, etc.)
  tax_id: [
    /\b(?:EIN|ITIN|TAX ID|TAX IDENTIFICATION)\s*[:=]?\s*\d{2}-\d{7}\b/gi,
    /\b\d{2}-\d{7}\b/g, // XX-XXXXXXX format
  ],
  
  // Student ID numbers
  student_id: [
    /\b(?:STUDENT|STUDENT ID|STUDENT NUMBER)\s*[:=]?\s*[A-Z0-9]{6,10}\b/gi,
    /\b[A-Z]{2,3}\d{6,8}\b/gi, // Student ID format
  ],
  
  // Employee ID numbers
  employee_id: [
    /\b(?:EMPLOYEE|EMP|EMPLOYEE ID|EMPLOYEE NUMBER)\s*[:=]?\s*[A-Z0-9]{6,10}\b/gi,
    /\b[A-Z]{2,3}\d{6,8}\b/gi, // Employee ID format
  ],
  
  // Patient ID numbers
  patient_id: [
    /\b(?:PATIENT|PATIENT ID|PATIENT NUMBER|MRN|MEDICAL RECORD)\s*[:=]?\s*[A-Z0-9]{6,12}\b/gi,
    /\b[A-Z]{2,3}\d{6,10}\b/gi, // Patient ID format
  ],
  
  // Prescription data
  prescription_data: [
    /\b(?:RX|PRESCRIPTION|MEDICATION|DRUG|PILL)\s*[:=]?\s*[A-Z0-9]{4,8}\b/gi,
    /\b(?:REFILL|DOSAGE|QUANTITY|DAYS SUPPLY)\s*[:=]?\s*\d+\b/gi,
  ],
  
  // Health insurance information
  health_insurance: [
    /\b(?:HEALTH INSURANCE|MEDICAL INSURANCE|HEALTH PLAN|MEDICAL PLAN)\s*[:=]?\s*[A-Z0-9]{8,12}\b/gi,
    /\b(?:GROUP|MEMBER|SUBSCRIBER)\s*(?:NUMBER|ID)\s*[:=]?\s*[A-Z0-9]{6,12}\b/gi,
  ],
  
  // Cryptocurrency wallet addresses
  crypto_wallet: [
    /\b(?:BITCOIN|BTC|ETHEREUM|ETH|WALLET|ADDRESS)\s*[:=]?\s*[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/gi, // Bitcoin
    /\b0x[a-fA-F0-9]{40}\b/g, // Ethereum
    /\b[A-Z0-9]{26,35}\b/g, // General crypto format
  ],
  
  // Social media handles
  social_media_handle: [
    /\b(?:@|HANDLE|USERNAME)\s*[A-Za-z0-9_]{3,15}\b/gi,
    /\b@[A-Za-z0-9_]{3,15}\b/gi, // @username format
  ],
  
  // Comprehensive numerical patterns (more specific to avoid excessive matches)
  numerical_data: [
    // Dates in various formats
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // MM/DD/YYYY or M/D/YYYY
    /\b\d{4}-\d{1,2}-\d{1,2}\b/g, // YYYY-MM-DD
    /\b\d{1,2}-\d{1,2}-\d{4}\b/g, // MM-DD-YYYY
    
    // License numbers and IDs (more specific)
    /\b[A-Z]{1,2}\d{6,10}\b/g, // State + numbers format
    
    // ZIP codes
    /\b\d{5}(?:-\d{4})?\b/g, // 5-digit or 9-digit ZIP codes
    
    // Phone numbers (various formats)
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g,
    /\b\+\d{1,3}[- ]?\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    
    // Credit card numbers
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
    /\b\d{4}[- ]?\d{6}[- ]?\d{5}\b/g, // Amex format
    
    // Social Security Numbers
    /\b\d{3}-\d{2}-\d{4}\b/g,
    /\b\d{3}\s\d{2}\s\d{4}\b/g,
    
    // DOB patterns
    /\bDOB\s+\d{1,2}\/\d{1,2}\/\d{4}\b/gi,
    /\b\d{8}\b/g, // 8-digit dates like 07061990
  ],
  
  // Sensitive personal information patterns
  sensitive_data: [
    // Dates and birthdays (various formats)
    /\b(?:DOB|BIRTH|BIRTHDAY)\s*[:=]?\s*\d{1,2}\/\d{1,2}\/\d{4}\b/gi, // DOB: 07/06/1990
    /\b(?:DOB|BIRTH|BIRTHDAY)\s*[:=]?\s*\d{4}-\d{1,2}-\d{1,2}\b/gi, // DOB: 1990-07-06
    /\b(?:DOB|BIRTH|BIRTHDAY)\s*[:=]?\s*\d{1,2}-\d{1,2}-\d{4}\b/gi, // DOB: 07-06-1990
    /\b(?:DOB|BIRTH|BIRTHDAY)\s*[:=]?\s*\d{8}\b/gi, // DOB: 07061990
    
    // Issue and expiration dates
    /\b(?:ISSUE|EXPIRES|EXPIRATION)\s*[:=]?\s*\d{1,2}\/\d{1,2}\/\d{4}\b/gi,
    /\b(?:ISSUE|EXPIRES|EXPIRATION)\s*[:=]?\s*\d{4}-\d{1,2}-\d{1,2}\b/gi,
    
    // License numbers and IDs (sensitive identifiers)
    /\b[A-Z]{1,2}\d{6,10}\b/g, // State + numbers format
    /\b\d{7,12}\b/g, // 7-12 digit license numbers
    
    // Social Security Numbers
    /\b\d{3}-\d{2}-\d{4}\b/g,
    /\b\d{3}\s\d{2}\s\d{4}\b/g,
    
    // Credit card numbers
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
    /\b\d{4}[- ]?\d{6}[- ]?\d{5}\b/g, // Amex format
    
    // Phone numbers
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g,
    
    // ZIP codes (sensitive location data)
    /\b\d{5}(?:-\d{4})?\b/g, // 5-digit or 9-digit ZIP codes
  ],
  
  // ZIP codes
  zip_code: [
    /\b\d{5}(?:-\d{4})?\b/, // 5-digit or 9-digit ZIP codes
  ],
  
  // Barcode patterns
  barcode: [
    // Standard barcodes
    /\b\d{12,13}\b/, // UPC/EAN barcodes (12-13 digits)
    /\b\d{8}\b/, // EAN-8 barcodes (8 digits)
    /\b\d{14}\b/, // GTIN-14 barcodes (14 digits)
    /\b\d{6}\b/, // Short barcodes (6 digits)
    /\b\d{10,13}\b/, // Common barcode lengths
    
    // Barcode patterns with spaces/dashes
    /\b\d{3}[- ]?\d{3}[- ]?\d{3}[- ]?\d{3}\b/, // 12-digit with separators
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // 12-digit with separators
    /\b\d{2}[- ]?\d{5}[- ]?\d{5}\b/, // 12-digit with separators
    
    // License barcodes (common on IDs)
    /\b[A-Z]{1,2}\d{10,12}\b/, // State + 10-12 digits
    /\b\d{10,12}[A-Z]{1,2}\b/, // 10-12 digits + State
    
    // PDF417 barcode patterns (common on driver's licenses)
    /\b[A-Z0-9]{20,}\b/, // Long alphanumeric sequences
    /\b[A-Z0-9]{15,20}\b/, // Medium alphanumeric sequences
    
    // QR code patterns (if visible as text)
    /\b[A-Z0-9+/]{20,}={0,2}\b/, // Base64-like patterns
    /\b[A-Z0-9]{25,}\b/, // Long alphanumeric (QR content)
  ],
  
  // Document identifiers
  document_id: [
    /\b(?:DRIVER LICENSE|ID CARD|PASSPORT|SSN|SOCIAL SECURITY)\b/gi,
  ],
};

/**
 * Get confidence score for a PII type based on pattern strength and context
 */
export function getConfidenceScore(type: string, text: string, context: string): number {
  let baseConfidence = 0.7;
  
  switch (type) {
    case 'credit_card':
      // Check for Luhn algorithm validation
      if (isValidCreditCard(text.replace(/[^0-9]/g, ''))) {
        baseConfidence = 0.95;
      } else {
        baseConfidence = 0.75; // Lower confidence for invalid cards
      }
      break;
      
    case 'phone':
      // Check if it's a valid phone number format
      const phoneDigits = text.replace(/[^0-9]/g, '');
      if (phoneDigits.length >= 10 && phoneDigits.length <= 15) {
        baseConfidence = 0.9;
      } else {
        baseConfidence = 0.6; // Lower confidence for invalid phone numbers
      }
      break;
      
    case 'email':
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(text)) {
        baseConfidence = 0.85;
      } else {
        baseConfidence = 0.6; // Lower confidence for invalid emails
      }
      break;
      
    case 'ssn':
      // SSN validation (basic)
      const ssnDigits = text.replace(/[^0-9]/g, '');
      if (ssnDigits.length === 9) {
        baseConfidence = 0.9;
      } else {
        baseConfidence = 0.6; // Lower confidence for invalid SSNs
      }
      break;
      
    case 'address':
      // Address context validation
      if (context.toLowerCase().includes('address') || 
          context.toLowerCase().includes('street') ||
          context.toLowerCase().includes('road')) {
        baseConfidence = 0.8;
      } else {
        baseConfidence = 0.65; // Lower confidence without context
      }
      break;
      
    case 'license_plate':
      // License plate context
      if (context.toLowerCase().includes('plate') ||
          context.toLowerCase().includes('vehicle') ||
          context.toLowerCase().includes('car')) {
        baseConfidence = 0.85;
      } else {
        baseConfidence = 0.7; // Lower confidence without context
      }
      break;
      
    case 'street_sign':
      // Street sign confidence based on text length and format
      if (text.length >= 2 && text.length <= 6) {
        baseConfidence = 0.75 + (text.length * 0.02); // Longer signs get higher confidence
      } else {
        baseConfidence = 0.6; // Lower confidence for unusual lengths
      }
      break;
      
    case 'numerical_data':
      // Numerical data confidence based on length and format
      const numDigits = text.replace(/[^0-9]/g, '');
      if (numDigits.length >= 4 && numDigits.length <= 12) {
        baseConfidence = 0.8 + (numDigits.length * 0.01); // Longer numbers get higher confidence
      } else {
        baseConfidence = 0.6; // Lower confidence for unusual lengths
      }
      break;
      
    case 'sensitive_data':
      // Sensitive data confidence
      baseConfidence = 0.85;
      break;
      
    case 'barcode':
      // Barcode confidence based on length and format
      const barcodeLength = text.replace(/[^0-9A-Za-z]/g, '').length;
      if (barcodeLength >= 6 && barcodeLength <= 20) {
        baseConfidence = 0.8 + (barcodeLength * 0.005); // Longer barcodes get higher confidence
      } else {
        baseConfidence = 0.6; // Lower confidence for unusual lengths
      }
      break;
      
    case 'passport_number':
      // Passport number validation
      const passportRegex = /^[A-Z]{1,2}\d{6,9}$/i;
      if (passportRegex.test(text.replace(/\s/g, ''))) {
        baseConfidence = 0.9;
      } else {
        baseConfidence = 0.65;
      }
      break;
      
    case 'medical_info':
      // Medical information confidence
      baseConfidence = 0.85;
      break;
      
    case 'financial_data':
      // Financial data confidence
      baseConfidence = 0.8;
      break;
      
    case 'biometric_data':
      // Biometric data confidence
      baseConfidence = 0.85;
      break;
      
    case 'ip_address':
      // IP address validation
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (ipRegex.test(text)) {
        baseConfidence = 0.9;
      } else {
        baseConfidence = 0.6;
      }
      break;
      
    case 'mac_address':
      // MAC address validation
      const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
      if (macRegex.test(text)) {
        baseConfidence = 0.9;
      } else {
        baseConfidence = 0.6;
      }
      break;
      
    case 'vehicle_vin':
      // VIN validation (17 characters, no I, O, Q)
      const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
      if (vinRegex.test(text.replace(/\s/g, ''))) {
        baseConfidence = 0.9;
      } else {
        baseConfidence = 0.65;
      }
      break;
      
    case 'insurance_number':
      // Insurance number confidence
      baseConfidence = 0.8;
      break;
      
    case 'bank_account':
      // Bank account number confidence
      const accountDigits = text.replace(/[^0-9]/g, '');
      if (accountDigits.length >= 8 && accountDigits.length <= 12) {
        baseConfidence = 0.85;
      } else {
        baseConfidence = 0.6;
      }
      break;
      
    case 'tax_id':
      // Tax ID validation (EIN format: XX-XXXXXXX)
      const taxRegex = /^\d{2}-\d{7}$/;
      if (taxRegex.test(text)) {
        baseConfidence = 0.9;
      } else {
        baseConfidence = 0.65;
      }
      break;
      
    case 'student_id':
      // Student ID confidence
      baseConfidence = 0.8;
      break;
      
    case 'employee_id':
      // Employee ID confidence
      baseConfidence = 0.8;
      break;
      
    case 'patient_id':
      // Patient ID confidence
      baseConfidence = 0.85;
      break;
      
    case 'prescription_data':
      // Prescription data confidence
      baseConfidence = 0.85;
      break;
      
    case 'health_insurance':
      // Health insurance confidence
      baseConfidence = 0.85;
      break;
      
    case 'crypto_wallet':
      // Cryptocurrency wallet validation
      const btcRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
      const ethRegex = /^0x[a-fA-F0-9]{40}$/;
      if (btcRegex.test(text) || ethRegex.test(text)) {
        baseConfidence = 0.9;
      } else {
        baseConfidence = 0.65;
      }
      break;
      
    case 'social_media_handle':
      // Social media handle validation
      const handleRegex = /^[A-Za-z0-9_]{3,15}$/;
      if (handleRegex.test(text)) {
        baseConfidence = 0.75;
      } else {
        baseConfidence = 0.6;
      }
      break;
      
    default:
      baseConfidence = 0.7;
  }
  
  // Ensure confidence is within bounds (no randomness)
  return Math.min(Math.max(baseConfidence, 0.6), 0.95);
}

/**
 * Luhn algorithm for credit card validation
 */
export function isValidCreditCard(number: string): boolean {
  if (number.length < 13 || number.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}
