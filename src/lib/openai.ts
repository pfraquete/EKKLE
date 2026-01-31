/**
 * OpenAI Service
 *
 * Handles communication with OpenAI API for GPT-4o-mini.
 * Used for conversational intelligence in the WhatsApp AI Agent.
 *
 * Features:
 * - Send chat completion requests
 * - Function calling support
 * - Extract function calls from responses
 * - Extract text responses
 * - Automatic retries with exponential backoff
 * - Request timeout protection
 * - Graceful fallback when API is unavailable
 *
 * @see https://platform.openai.com/docs/api-reference/chat
 */

import { fetchWithRetry } from './retry';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (!OPENAI_API_KEY) {
  console.warn('⚠️ OpenAI API key is missing. WhatsApp AI Agent will not work.');
}

/**
 * Fallback responses when OpenAI is unavailable
 */
export const FALLBACK_RESPONSES = {
  default: 'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em alguns minutos ou acesse o painel em app.ekkle.com.br',
  greeting: 'Olá! Estou temporariamente indisponível, mas você pode acessar todas as funcionalidades pelo painel em app.ekkle.com.br',
  help: 'No momento não consigo processar sua solicitação. Por favor, acesse o painel administrativo em app.ekkle.com.br para gerenciar sua igreja.',
  unavailable: 'O serviço de IA está temporariamente indisponível. Tente novamente em alguns minutos.',
};

/**
 * Check if error is a retryable OpenAI error
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('timeout') ||
      message.includes('503') ||
      message.includes('502') ||
      message.includes('overloaded')
    );
  }
  return false;
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
      max_tokens: options.max_tokens ?? 500, // Reduzido de 1000 para 500 para economizar
    };

    // Add function calling if functions are provided
    if (options.functions && options.functions.length > 0) {
      requestBody.functions = options.functions;
      requestBody.function_call = options.function_call || 'auto';
    }

    try {
      const response = await fetchWithRetry(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify(requestBody),
        },
        {
          maxRetries: 3,
          initialDelayMs: 2000,
          timeoutMs: 60000, // 60s timeout for OpenAI (can be slow)
          onRetry: (attempt, error) => {
            console.warn(
              `[OpenAI] Retry attempt ${attempt}/3 due to: ${error.message}`
            );
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: { message: 'Unknown error' },
        }));
        throw new Error(
          error.error?.message || `OpenAI API error: ${response.status}`
        );
      }

      const data = await response.json();

      // Log usage for cost tracking
      if (data.usage) {
        console.log('[OpenAI] Usage:', {
          model: OPENAI_MODEL,
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens,
        });
      }

      return data;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }

  /**
   * Send chat completion with graceful fallback
   * Returns a fallback response instead of throwing when API fails
   *
   * @param options - Chat completion options
   * @returns OpenAI API response or fallback response
   */
  static async createChatCompletionWithFallback(options: ChatCompletionOptions): Promise<{
    data: any | null;
    fallback: boolean;
    fallbackMessage: string | null;
    error: Error | null;
  }> {
    try {
      const data = await this.createChatCompletion(options);
      return { data, fallback: false, fallbackMessage: null, error: null };
    } catch (error) {
      console.error('[OpenAI] API failed, using fallback:', error);

      // Determine appropriate fallback message
      const lastUserMessage = options.messages
        .filter((m) => m.role === 'user')
        .pop()?.content?.toLowerCase() || '';

      let fallbackMessage = FALLBACK_RESPONSES.default;

      if (lastUserMessage.includes('olá') || lastUserMessage.includes('oi') || lastUserMessage.includes('bom dia')) {
        fallbackMessage = FALLBACK_RESPONSES.greeting;
      } else if (lastUserMessage.includes('ajuda') || lastUserMessage.includes('help')) {
        fallbackMessage = FALLBACK_RESPONSES.help;
      }

      return {
        data: null,
        fallback: true,
        fallbackMessage,
        error: error instanceof Error ? error : new Error(String(error)),
      };
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
   * Transcribe audio using OpenAI Whisper API
   *
   * @param audioBuffer - Audio file as Buffer or Blob
   * @param filename - Original filename with extension (e.g., 'audio.webm')
   * @returns Transcribed text in Portuguese
   *
   * @example
   * ```ts
   * const transcription = await OpenAIService.transcribeAudio(audioBuffer, 'prayer.webm');
   * console.log(transcription); // 'Senhor, eu te agradeço...'
   * ```
   */
  static async transcribeAudio(
    audioBuffer: Buffer | Blob,
    filename: string = 'audio.webm'
  ): Promise<string> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key não configurada');
    }

    const formData = new FormData();

    // Handle both Buffer and Blob
    if (audioBuffer instanceof Buffer) {
      const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/webm' });
      formData.append('file', blob, filename);
    } else {
      formData.append('file', audioBuffer as Blob, filename);
    }

    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');
    formData.append('response_format', 'text');

    try {
      const response = await fetchWithRetry(
        'https://api.openai.com/v1/audio/transcriptions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: formData,
        },
        {
          maxRetries: 3,
          initialDelayMs: 2000,
          timeoutMs: 120000, // 2 minute timeout for audio transcription
          onRetry: (attempt, error) => {
            console.warn(
              `[OpenAI Whisper] Retry attempt ${attempt}/3 due to: ${error.message}`
            );
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: { message: 'Unknown error' },
        }));
        throw new Error(
          error.error?.message || `Whisper API error: ${response.status}`
        );
      }

      const text = await response.text();

      console.log('[OpenAI Whisper] Transcription completed:', {
        textLength: text.length,
        preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      });

      return text;
    } catch (error) {
      console.error('Error calling Whisper API:', error);
      throw error;
    }
  }

  /**
   * Analyze prayer transcription and extract categories using GPT
   *
   * @param transcription - The transcribed prayer text
   * @returns Parsed prayer analysis with categories
   *
   * @example
   * ```ts
   * const analysis = await OpenAIService.analyzePrayer('Senhor, eu oro por minha família...');
   * console.log(analysis.pessoas); // [{ name: 'família', reason: 'intercessão geral' }]
   * ```
   */
  static async analyzePrayer(transcription: string): Promise<{
    motivos: Array<{ content: string }>;
    promessas: Array<{ content: string; verse_reference?: string }>;
    transformacoes: Array<{ content: string }>;
    pessoas: Array<{ name: string; reason?: string }>;
    summary: string;
    suggested_verses: Array<{ reference: string; text: string }>;
  }> {
    const systemPrompt = `Você é um assistente especializado em análise de orações cristãs.
Analise a oração transcrita e extraia as seguintes categorias:

1. MOTIVOS DE ORAÇÃO - Pedidos específicos feitos a Deus (cura, provisão, proteção, etc.)
2. PROMESSAS - Versículos ou promessas bíblicas mencionadas ou reivindicadas
3. TRANSFORMAÇÕES - Mudanças pessoais ou espirituais desejadas (paciência, fé, caráter, etc.)
4. PESSOAS INTERCEDIDAS - Nomes de pessoas ou grupos pelos quais foi orado

Retorne APENAS um JSON válido no seguinte formato (sem markdown, sem código):
{
  "motivos": [{"content": "texto do pedido"}],
  "promessas": [{"content": "texto da promessa", "verse_reference": "referência bíblica se aplicável"}],
  "transformacoes": [{"content": "transformação desejada"}],
  "pessoas": [{"name": "nome ou descrição", "reason": "motivo da intercessão"}],
  "summary": "resumo da oração em 2-3 frases",
  "suggested_verses": [{"reference": "Livro capítulo:versículo", "text": "texto do versículo"}]
}

Se uma categoria não tiver itens, retorne um array vazio [].
Sugira 2-3 versículos bíblicos relacionados aos temas da oração.`;

    const response = await this.createChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analise esta oração:\n\n${transcription}` },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const text = this.extractTextResponse(response);

    try {
      // Try to parse the JSON response
      const parsed = JSON.parse(text);
      return {
        motivos: parsed.motivos || [],
        promessas: parsed.promessas || [],
        transformacoes: parsed.transformacoes || [],
        pessoas: parsed.pessoas || [],
        summary: parsed.summary || '',
        suggested_verses: parsed.suggested_verses || [],
      };
    } catch (parseError) {
      console.error('Error parsing prayer analysis:', parseError);
      // Return empty structure if parsing fails
      return {
        motivos: [],
        promessas: [],
        transformacoes: [],
        pessoas: [],
        summary: text.substring(0, 200),
        suggested_verses: [],
      };
    }
  }

  /**
   * Generate AI encouragement based on prayer history
   *
   * @param prayerSummaries - Array of recent prayer summaries
   * @param stats - Prayer statistics
   * @returns Encouraging message
   */
  static async generateEncouragement(
    prayerSummaries: string[],
    stats: {
      totalPrayers: number;
      streak: number;
      peoplesPrayed: number;
      answeredPrayers: number;
    }
  ): Promise<string> {
    const systemPrompt = `Você é um assistente pastoral carinhoso e encorajador.
Baseado no histórico de orações e estatísticas do usuário, gere uma mensagem de encorajamento personalizada.
A mensagem deve ser:
- Breve (2-3 frases)
- Bíblica (pode incluir uma referência)
- Pessoal e calorosa
- Em português brasileiro`;

    const userContent = `
Estatísticas de oração:
- Total de orações: ${stats.totalPrayers}
- Dias consecutivos orando: ${stats.streak}
- Pessoas intercedidas: ${stats.peoplesPrayed}
- Orações respondidas: ${stats.answeredPrayers}

Resumos das últimas orações:
${prayerSummaries.slice(0, 5).join('\n')}

Gere uma mensagem de encorajamento:`;

    const response = await this.createChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return this.extractTextResponse(response);
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
