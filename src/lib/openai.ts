/**
 * OpenAI Service
 *
 * Handles communication with OpenAI API for GPT-4o.
 * Used for conversational intelligence in the WhatsApp AI Agent.
 *
 * Features:
 * - Send chat completion requests
 * - Function calling support
 * - Extract function calls from responses
 * - Extract text responses
 *
 * @see https://platform.openai.com/docs/api-reference/chat
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

if (!OPENAI_API_KEY) {
  console.warn('⚠️ OpenAI API key is missing. WhatsApp AI Agent will not work.');
}

/**
 * Chat message format
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

/**
 * Function definition for OpenAI function calling
 */
export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * Chat completion options
 */
export interface ChatCompletionOptions {
  messages: ChatMessage[];
  functions?: FunctionDefinition[];
  function_call?: 'auto' | 'none' | { name: string };
  temperature?: number;
  max_tokens?: number;
}

/**
 * OpenAI Service
 */
export class OpenAIService {
  /**
   * Send chat completion request to OpenAI
   *
   * @param options - Chat completion options
   * @returns OpenAI API response
   *
   * @example
   * ```ts
   * const response = await OpenAIService.createChatCompletion({
   *   messages: [
   *     { role: 'system', content: 'You are a helpful assistant.' },
   *     { role: 'user', content: 'Hello!' },
   *   ],
   *   temperature: 0.7,
   * });
   * ```
   */
  static async createChatCompletion(options: ChatCompletionOptions) {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key não configurada');
    }

    const url = 'https://api.openai.com/v1/chat/completions';

    const requestBody: any = {
      model: OPENAI_MODEL,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1000,
    };

    // Add function calling if functions are provided
    if (options.functions && options.functions.length > 0) {
      requestBody.functions = options.functions;
      requestBody.function_call = options.function_call || 'auto';
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: { message: 'Unknown error' },
        }));
        throw new Error(
          error.error?.message || `OpenAI API error: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }

  /**
   * Extract function call from OpenAI response
   *
   * @param response - OpenAI API response
   * @returns Function call details or null if no function was called
   *
   * @example
   * ```ts
   * const functionCall = OpenAIService.extractFunctionCall(response);
   * if (functionCall) {
   *   console.log(functionCall.name); // 'create_cell'
   *   console.log(functionCall.arguments); // { name: 'Célula da Paz', ... }
   * }
   * ```
   */
  static extractFunctionCall(response: any): {
    name: string;
    arguments: Record<string, any>;
  } | null {
    const message = response.choices?.[0]?.message;

    if (message?.function_call) {
      try {
        return {
          name: message.function_call.name,
          arguments: JSON.parse(message.function_call.arguments),
        };
      } catch (error) {
        console.error('Error parsing function call arguments:', error);
        return null;
      }
    }

    return null;
  }

  /**
   * Extract text response from OpenAI
   *
   * @param response - OpenAI API response
   * @returns Text content from the assistant
   *
   * @example
   * ```ts
   * const text = OpenAIService.extractTextResponse(response);
   * console.log(text); // 'Olá! Como posso ajudar?'
   * ```
   */
  static extractTextResponse(response: any): string {
    return response.choices?.[0]?.message?.content || '';
  }

  /**
   * Get usage information from response
   *
   * @param response - OpenAI API response
   * @returns Token usage information
   */
  static getUsage(response: any): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } {
    return {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    };
  }

  /**
   * Check if OpenAI is configured
   */
  static isConfigured(): boolean {
    return !!OPENAI_API_KEY;
  }

  /**
   * Get current model being used
   */
  static getModel(): string {
    return OPENAI_MODEL;
  }
}
