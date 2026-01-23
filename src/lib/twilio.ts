/**
 * Twilio WhatsApp Service
 *
 * Handles communication with Twilio API for WhatsApp messaging.
 * Used for System ↔ Pastor communication via WhatsApp.
 *
 * Features:
 * - Send WhatsApp messages to pastors
 * - Validate webhook signatures for security
 * - Format phone numbers for WhatsApp
 * - Automatic retries with exponential backoff
 * - Request timeout protection
 *
 * @see https://www.twilio.com/docs/whatsapp
 */

import crypto from 'crypto';
import { fetchWithRetry } from './retry';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
  console.warn('⚠️ Twilio environment variables are missing. WhatsApp AI Agent will not work.');
}

/**
 * Check if Twilio is properly configured
 */
const checkConfig = () => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    throw new Error('Configuração do Twilio ausente no servidor (.env)');
  }
};

/**
 * Twilio message response
 */
export interface TwilioMessageResponse {
  sid: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Twilio Service
 */
export class TwilioService {
  /**
   * Send WhatsApp message to a pastor
   *
   * @param to - Phone number (format: whatsapp:+5511999999999 or +5511999999999)
   * @param message - Message text to send
   * @returns Message response with SID and status
   *
   * @example
   * ```ts
   * await TwilioService.sendWhatsAppMessage(
   *   'whatsapp:+5511999999999',
   *   'Olá! Sua célula foi criada com sucesso.'
   * );
   * ```
   */
  static async sendWhatsAppMessage(
    to: string,
    message: string
  ): Promise<TwilioMessageResponse> {
    checkConfig();

    // Ensure 'to' has whatsapp: prefix
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    // WhatsApp messages have a limit of ~1600 characters
    // Split message if needed
    const messages = this.splitMessage(message, 1600);

    let lastResponse: TwilioMessageResponse | null = null;

    for (const msg of messages) {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

      const body = new URLSearchParams({
        From: TWILIO_WHATSAPP_NUMBER!,
        To: formattedTo,
        Body: msg,
      });

      try {
        const response = await fetchWithRetry(
          url,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(
                `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
              ).toString('base64')}`,
            },
            body: body.toString(),
          },
          {
            maxRetries: 3,
            initialDelayMs: 1000,
            timeoutMs: 30000, // 30s timeout for Twilio
            onRetry: (attempt, error) => {
              console.warn(
                `[Twilio] Retry attempt ${attempt}/3 due to: ${error.message}`
              );
            },
          }
        );

        if (!response.ok) {
          const error = await response.json().catch(() => ({
            message: 'Unknown error',
          }));
          throw new Error(error.message || `Twilio API error: ${response.status}`);
        }

        const data = await response.json();
        lastResponse = {
          sid: data.sid,
          status: data.status,
          errorCode: data.error_code,
          errorMessage: data.error_message,
        };

        // Small delay between messages to avoid rate limits
        if (messages.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Error sending Twilio message:', error);
        throw error;
      }
    }

    return lastResponse!;
  }

  /**
   * Validate Twilio webhook signature
   *
   * Security: Ensures requests actually come from Twilio and not a third party.
   *
   * @param signature - X-Twilio-Signature header value
   * @param url - Full webhook URL
   * @param params - Request parameters
   * @returns true if signature is valid
   *
   * @see https://www.twilio.com/docs/usage/security#validating-requests
   */
  static validateWebhookSignature(
    signature: string,
    url: string,
    params: Record<string, string>
  ): boolean {
    checkConfig();

    try {
      // Sort params alphabetically and concatenate with URL
      const data =
        url +
        Object.keys(params)
          .sort()
          .map((key) => key + params[key])
          .join('');

      // Create HMAC SHA1
      const expectedSignature = crypto
        .createHmac('sha1', TWILIO_AUTH_TOKEN!)
        .update(Buffer.from(data, 'utf-8'))
        .digest('base64');

      // Constant-time comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Error validating Twilio signature:', error);
      return false;
    }
  }

  /**
   * Format phone number for WhatsApp
   *
   * @param phone - Phone number (various formats accepted)
   * @returns Formatted phone number with whatsapp: prefix
   *
   * @example
   * ```ts
   * formatPhoneNumber('11999999999') // => 'whatsapp:+5511999999999'
   * formatPhoneNumber('+5511999999999') // => 'whatsapp:+5511999999999'
   * formatPhoneNumber('whatsapp:+5511999999999') // => 'whatsapp:+5511999999999'
   * ```
   */
  static formatPhoneNumber(phone: string): string {
    // Already formatted
    if (phone.startsWith('whatsapp:')) {
      return phone;
    }

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Add country code if not present (assuming Brazil +55)
    if (!cleaned.startsWith('55') && cleaned.length === 11) {
      return `whatsapp:+55${cleaned}`;
    }

    // Add + if not present
    if (!phone.startsWith('+')) {
      return `whatsapp:+${cleaned}`;
    }

    return `whatsapp:${phone}`;
  }

  /**
   * Split long messages into chunks
   *
   * @param message - Message to split
   * @param maxLength - Maximum length per chunk (default 1600)
   * @returns Array of message chunks
   */
  private static splitMessage(message: string, maxLength = 1600): string[] {
    if (message.length <= maxLength) {
      return [message];
    }

    const chunks: string[] = [];
    let currentChunk = '';
    const lines = message.split('\n');

    for (const line of lines) {
      if (currentChunk.length + line.length + 1 > maxLength) {
        // Current chunk is full, start new one
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = line;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    // Add continuation indicators
    return chunks.map((chunk, index) => {
      if (chunks.length > 1) {
        return `[${index + 1}/${chunks.length}]\n${chunk}`;
      }
      return chunk;
    });
  }

  /**
   * Check if Twilio is configured
   */
  static isConfigured(): boolean {
    return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER);
  }
}
