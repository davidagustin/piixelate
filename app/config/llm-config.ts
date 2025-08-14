/**
 * Enhanced LLM Configuration for PII Detection
 * Provides secure and configurable LLM integration with enterprise-grade capabilities
 */

import { detectionConfig } from './detection-config';

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'local' | 'mock';
  apiKey?: string;
  model: string;
  endpoint?: string | undefined;
  enabled: boolean;
  maxRetries: number;
  timeout: number;
  temperature: number;
  maxTokens: number;
}

export interface LLMResponse {
  success: boolean;
  data?: any;
  error?: string;
  provider: string;
  model: string;
  processingTime: number;
}

export interface LLMDetection {
  type: string;
  text: string;
  confidence: number;
  line: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  verified: boolean;
  reasoning?: string;
  context?: string;
}

// Use detection configuration
const config = detectionConfig.getConfig();
export const llmConfig: LLMConfig = {
  provider: config.llmProvider as any,
  model: config.llmModel,
  endpoint: config.llmEndpoint,
  enabled: config.enableLLM,
  maxRetries: 3,
  timeout: 15000, // 15 seconds
  temperature: 0.1, // Low temperature for consistent results
  maxTokens: 2000,
};

/**
 * Enhanced PII detection prompt for better accuracy
 */
const ENHANCED_PII_PROMPT = `You are an expert PII (Personally Identifiable Information) detection system with enterprise-grade accuracy. Your task is to analyze text and identify sensitive information that needs protection.

DETECTION CATEGORIES:
1. FINANCIAL DATA:
   - Credit card numbers (all formats: 1234-5678-9012-3456, 1234 5678 9012 3456, 1234567890123456)
   - Bank account numbers (various formats)
   - Tax identification numbers (SSN: XXX-XX-XXXX, EIN, etc.)
   - Insurance policy numbers
   - Financial account numbers

2. PERSONAL IDENTIFICATION:
   - Driver's license numbers (state-specific formats)
   - Passport numbers (international formats)
   - Government ID numbers
   - Employee ID numbers
   - Student ID numbers
   - Patient ID numbers
   - Military ID numbers

3. CONTACT INFORMATION:
   - Phone numbers (all formats: +1-555-123-4567, (555) 123-4567, 555.123.4567)
   - Email addresses (standard and business formats)
   - Physical addresses (street, city, state, zip)
   - Social media handles (@username)

4. MEDICAL & HEALTH:
   - Medical record numbers
   - Prescription information
   - Health insurance numbers
   - Medical device serial numbers
   - Patient identifiers

5. TECHNICAL IDENTIFIERS:
   - IP addresses (IPv4 and IPv6)
   - MAC addresses
   - Vehicle VIN numbers
   - Serial numbers
   - License plate numbers
   - Barcode/QR code data

6. SENSITIVE DOCUMENTS:
   - Document IDs
   - Case numbers
   - Reference numbers
   - Transaction IDs
   - Order numbers

ANALYSIS INSTRUCTIONS:
1. Examine the text carefully for any patterns matching the above categories
2. Consider context - not all numbers are PII (e.g., prices, quantities, dates)
3. Provide confidence scores based on pattern strength and context
4. Estimate bounding box positions for visual highlighting
5. Include reasoning for complex cases

OUTPUT FORMAT:
Return ONLY a valid JSON array with this exact structure:
[
  {
    "type": "category_name",
    "text": "exact_text_found",
    "confidence": 0.95,
    "line": 0,
    "boundingBox": {"x": 100, "y": 50, "width": 200, "height": 30},
    "verified": true,
    "reasoning": "brief explanation of detection"
  }
]

CONFIDENCE SCORING:
- 0.95-1.0: Clear, unambiguous PII (credit cards, SSNs)
- 0.85-0.94: Strong pattern match with good context
- 0.75-0.84: Likely PII but some ambiguity
- 0.60-0.74: Possible PII, needs verification
- Below 0.60: Unlikely to be PII

IMPORTANT: Only return valid JSON. No additional text or explanations outside the JSON array.`;

/**
 * Enhanced LLM call with retry logic and better error handling
 */
export const callLLM = async (text: string, context?: string): Promise<LLMResponse> => {
  if (!llmConfig.enabled) {
    console.warn('LLM detection is disabled');
    return {
      success: false,
      error: 'LLM detection is disabled',
      provider: llmConfig.provider,
      model: llmConfig.model,
      processingTime: 0,
    };
  }

  if (!text || text.trim().length === 0) {
    console.warn('Empty text provided to LLM');
    return {
      success: false,
      error: 'Empty text provided',
      provider: llmConfig.provider,
      model: llmConfig.model,
      processingTime: 0,
    };
  }

  const startTime = Date.now();
  let lastError: Error | null = null;

  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= llmConfig.maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise<LLMResponse>((_, reject) => {
        setTimeout(() => reject(new Error(`LLM request timeout after ${llmConfig.timeout}ms`)), llmConfig.timeout);
      });

      const llmPromise = (async () => {
        switch (llmConfig.provider) {
          case 'openai':
            return await callOpenAI(text, context);
          case 'anthropic':
            return await callAnthropic(text, context);
          case 'google':
            return await callGoogleAI(text, context);
          case 'local':
            return await callLocalLLM(text, context);
          case 'mock':
          default:
            return await callMockLLM(text, context);
        }
      })();

      const result = await Promise.race([llmPromise, timeoutPromise]);
      return {
        ...result,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error as Error;
      console.warn(`LLM attempt ${attempt} failed:`, error);
      
      // Don't retry on certain errors
      if (error instanceof Error) {
        if (error.message.includes('API key') || error.message.includes('authentication')) {
          break; // Don't retry auth errors
        }
        if (error.message.includes('rate limit') || error.message.includes('quota')) {
          // Wait longer for rate limit errors
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        } else {
          // Short delay for other errors
          await new Promise(resolve => setTimeout(resolve, attempt * 500));
        }
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'All LLM attempts failed',
    provider: llmConfig.provider,
    model: llmConfig.model,
    processingTime: Date.now() - startTime,
  };
};

/**
 * Enhanced OpenAI API integration
 */
const callOpenAI = async (text: string, context?: string): Promise<LLMResponse> => {
  const apiKey = config.openaiApiKey;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const enhancedText = context ? `${text}\n\nContext: ${context}` : text;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: llmConfig.model,
      messages: [
        {
          role: 'system',
          content: ENHANCED_PII_PROMPT
        },
        {
          role: 'user',
          content: `Analyze this text for PII: "${enhancedText}"`
        }
      ],
      temperature: llmConfig.temperature,
      max_tokens: llmConfig.maxTokens,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  return {
    success: true,
    data: content,
    provider: 'openai',
    model: llmConfig.model,
    processingTime: 0,
  };
};

/**
 * Enhanced Anthropic API integration
 */
const callAnthropic = async (text: string, context?: string): Promise<LLMResponse> => {
  const apiKey = config.anthropicApiKey;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const enhancedText = context ? `${text}\n\nContext: ${context}` : text;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: llmConfig.maxTokens,
      temperature: llmConfig.temperature,
      messages: [
        {
          role: 'user',
          content: `${ENHANCED_PII_PROMPT}\n\nAnalyze this text for PII: "${enhancedText}"`
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text;
  
  if (!content) {
    throw new Error('Empty response from Anthropic');
  }

  return {
    success: true,
    data: content,
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    processingTime: 0,
  };
};

/**
 * Google AI (Gemini) integration
 */
const callGoogleAI = async (text: string, context?: string): Promise<LLMResponse> => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Google AI API key not configured');
  }

  const enhancedText = context ? `${text}\n\nContext: ${context}` : text;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${ENHANCED_PII_PROMPT}\n\nAnalyze this text for PII: "${enhancedText}"`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: llmConfig.temperature,
        maxOutputTokens: llmConfig.maxTokens,
        topP: 0.9,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google AI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!content) {
    throw new Error('Empty response from Google AI');
  }

  return {
    success: true,
    data: content,
    provider: 'google',
    model: 'gemini-pro',
    processingTime: 0,
  };
};

/**
 * Enhanced local LLM integration
 */
const callLocalLLM = async (text: string, context?: string): Promise<LLMResponse> => {
  const endpoint = llmConfig.endpoint || 'http://localhost:11434/api/generate';
  const enhancedText = context ? `${text}\n\nContext: ${context}` : text;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: llmConfig.model,
      prompt: `${ENHANCED_PII_PROMPT}\n\nAnalyze this text for PII: "${enhancedText}"`,
      stream: false,
      options: {
        temperature: llmConfig.temperature,
        num_predict: llmConfig.maxTokens,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Local LLM API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.response;
  
  if (!content) {
    throw new Error('Empty response from local LLM');
  }

  return {
    success: true,
    data: content,
    provider: 'local',
    model: llmConfig.model,
    processingTime: 0,
  };
};

/**
 * Enhanced mock LLM with realistic patterns and better simulation
 */
const callMockLLM = async (text: string, context?: string): Promise<LLMResponse> => {
  // Simulate realistic API delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
  
  const detections: LLMDetection[] = [];
  
  // Enhanced credit card detection with Luhn algorithm
  const creditCardPatterns = [
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
    /\b\d{4} \d{4} \d{4} \d{4}\b/g,
  ];
  
  creditCardPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const cardNumber = match[0].replace(/[^0-9]/g, '');
      if (isValidLuhn(cardNumber)) {
        detections.push({
          type: 'credit_card',
          text: match[0],
          confidence: 0.98,
          line: getLineNumber(text, match.index!),
          boundingBox: { x: 100, y: 50, width: 200, height: 30 },
          verified: true,
          reasoning: 'Valid credit card number detected with Luhn algorithm verification'
        });
      }
    }
  });
  
  // Enhanced phone number detection
  const phonePatterns = [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g,
    /\b\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g,
  ];
  
  phonePatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      detections.push({
        type: 'phone',
        text: match[0],
        confidence: 0.95,
        line: getLineNumber(text, match.index!),
        boundingBox: { x: 150, y: 100, width: 120, height: 25 },
        verified: true,
        reasoning: 'Phone number pattern matched with high confidence'
      });
    }
  });
  
  // Enhanced email detection
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatches = text.matchAll(emailPattern);
  for (const match of emailMatches) {
    detections.push({
      type: 'email',
      text: match[0],
      confidence: 0.97,
      line: getLineNumber(text, match.index!),
      boundingBox: { x: 200, y: 150, width: 180, height: 25 },
      verified: true,
      reasoning: 'Valid email address format detected'
    });
  }
  
  // SSN detection
  const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g;
  const ssnMatches = text.matchAll(ssnPattern);
  for (const match of ssnMatches) {
    detections.push({
      type: 'ssn',
      text: match[0],
      confidence: 0.99,
      line: getLineNumber(text, match.index!),
      boundingBox: { x: 120, y: 200, width: 110, height: 25 },
      verified: true,
      reasoning: 'Social Security Number format detected'
    });
  }
  
  // Address detection
  const addressPattern = /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/gi;
  const addressMatches = text.matchAll(addressPattern);
  for (const match of addressMatches) {
    detections.push({
      type: 'address',
      text: match[0],
      confidence: 0.85,
      line: getLineNumber(text, match.index!),
      boundingBox: { x: 80, y: 250, width: 250, height: 25 },
      verified: true,
      reasoning: 'Street address pattern detected'
    });
  }
  
  // Name detection (basic)
  const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
  const nameMatches = text.matchAll(namePattern);
  for (const match of nameMatches) {
    // Avoid common false positives
    const name = match[0];
    const commonWords = ['The', 'This', 'That', 'With', 'From', 'Into', 'During', 'Including', 'Until', 'Against', 'Among', 'Throughout', 'Describing', 'Following', 'According', 'Through', 'Between', 'Within', 'Without', 'Before', 'After', 'Above', 'Below', 'Since', 'Under', 'Over', 'About', 'Around', 'Along', 'Across', 'Behind', 'Beyond', 'Inside', 'Outside', 'Near', 'Far', 'Close', 'Open', 'High', 'Low', 'Good', 'Bad', 'New', 'Old', 'Big', 'Small', 'Long', 'Short', 'Fast', 'Slow', 'Easy', 'Hard', 'Early', 'Late', 'First', 'Last', 'Next', 'Previous', 'Current', 'Recent', 'Future', 'Past', 'Present', 'Modern', 'Ancient', 'Young', 'Adult', 'Child', 'Baby', 'Senior', 'Junior', 'Major', 'Minor', 'Primary', 'Secondary', 'Main', 'Side', 'Front', 'Back', 'Top', 'Bottom', 'Left', 'Right', 'Center', 'Middle', 'Corner', 'Edge', 'End', 'Start', 'Begin', 'Finish', 'Complete', 'Partial', 'Full', 'Empty', 'Half', 'Quarter', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
    
    if (!commonWords.some(word => name.includes(word))) {
      detections.push({
        type: 'name',
        text: match[0],
        confidence: 0.75,
        line: getLineNumber(text, match.index!),
        boundingBox: { x: 90, y: 300, width: 140, height: 25 },
        verified: false,
        reasoning: 'Potential name pattern detected, needs context verification'
      });
    }
  }
  
  return {
    success: true,
    data: JSON.stringify(detections),
    provider: 'mock',
    model: 'mock-llm-v2',
    processingTime: 0,
  };
};

/**
 * Luhn algorithm for credit card validation
 */
function isValidLuhn(cardNumber: string): boolean {
  let sum = 0;
  let isEven = false;
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i));
    
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

/**
 * Get approximate line number for text position
 */
function getLineNumber(text: string, index: number): number {
  return text.substring(0, index).split('\n').length - 1;
}
