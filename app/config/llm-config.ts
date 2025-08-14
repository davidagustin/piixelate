/**
 * LLM Configuration for PII Detection
 * Provides secure and configurable LLM integration with enhanced security
 */

import { detectionConfig } from './detection-config';

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'local' | 'mock';
  apiKey?: string;
  model: string;
  endpoint?: string | undefined;
  enabled: boolean;
}

export interface LLMResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Use detection configuration
const config = detectionConfig.getConfig();
export const llmConfig: LLMConfig = {
  provider: config.llmProvider as any,
  model: config.llmModel,
  endpoint: config.llmEndpoint,
  enabled: config.enableLLM,
};

/**
 * Call LLM service with proper error handling and validation
 */
export const callLLM = async (text: string): Promise<string | null> => {
  if (!llmConfig.enabled) {
    console.warn('LLM detection is disabled');
    return null;
  }

  if (!text || text.trim().length === 0) {
    console.warn('Empty text provided to LLM');
    return null;
  }

  try {
    // Add timeout to prevent freezing
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('LLM request timeout')), 10000); // 10 second timeout
    });

    const llmPromise = (async () => {
      switch (llmConfig.provider) {
        case 'openai':
          return await callOpenAI(text);
        case 'anthropic':
          return await callAnthropic(text);
        case 'local':
          return await callLocalLLM(text);
        case 'mock':
        default:
          return await callMockLLM(text);
      }
    })();

    return await Promise.race([llmPromise, timeoutPromise]);
  } catch (error) {
    console.error('LLM call failed:', error);
    return null;
  }
};

/**
 * OpenAI API integration with enhanced security and error handling
 */
const callOpenAI = async (text: string): Promise<string> => {
  const apiKey = config.openaiApiKey;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

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
          content: `You are a PII (Personally Identifiable Information) detection expert. Analyze the provided text and identify any PII elements.

PII types to detect:
- credit_card: Credit card numbers (16 digits, may have spaces/dashes)
- phone: Phone numbers (various formats including international)
- email: Email addresses
- ssn: Social Security Numbers (XXX-XX-XXXX format)
- address: Street addresses with numbers and street names
- license_plate: Vehicle license plates
- name: Full names (first and last name)
- street_sign: Traffic signs, route numbers, street signs

For each detected PII, provide:
- type: The PII category
- text: The exact text found
- confidence: Confidence score (0.0 to 1.0)
- line: Approximate line number (0-based)
- boundingBox: Approximate position {x, y, width, height} (use reasonable estimates)

Return ONLY a valid JSON array of detections.`
        },
        {
          role: 'user',
          content: `Analyze this text for PII: "${text}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || null;
};

/**
 * Anthropic API integration with enhanced security and error handling
 */
const callAnthropic = async (text: string): Promise<string> => {
  const apiKey = config.anthropicApiKey;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Analyze this text for PII and return a JSON array of detections: "${text}"`
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.content[0]?.text || null;
};

/**
 * Local LLM integration (for self-hosted models)
 */
const callLocalLLM = async (text: string): Promise<string> => {
  const endpoint = llmConfig.endpoint || 'http://localhost:11434/api/generate';
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: llmConfig.model,
      prompt: `Analyze this text for PII and return a JSON array of detections: "${text}"`,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Local LLM API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.response || null;
};

/**
 * Mock LLM for demo purposes with realistic patterns
 */
const callMockLLM = async (text: string): Promise<string> => {
  // Simulate API delay (reduced from 1000ms to 200ms for better UX)
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Return mock detections based on pattern matching
  const detections: any[] = [];
  
  // Credit card detection
  const creditCardMatch = text.match(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/);
  if (creditCardMatch) {
    detections.push({
      type: 'credit_card',
      text: creditCardMatch[0],
      confidence: 0.95,
      line: 0,
      boundingBox: { x: 100, y: 50, width: 200, height: 30 }
    });
  }
  
  // Phone number detection
  const phoneMatch = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/);
  if (phoneMatch) {
    detections.push({
      type: 'phone',
      text: phoneMatch[0],
      confidence: 0.92,
      line: 1,
      boundingBox: { x: 150, y: 100, width: 120, height: 25 }
    });
  }
  
  // Email detection
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    detections.push({
      type: 'email',
      text: emailMatch[0],
      confidence: 0.88,
      line: 2,
      boundingBox: { x: 200, y: 150, width: 180, height: 25 }
    });
  }
  
  return JSON.stringify(detections);
};
