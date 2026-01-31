/**
 * Twilio WhatsApp Webhook Endpoint
 *
 * Receives incoming WhatsApp messages from Twilio and processes them
 * through the AI agent.
 *
 * Security:
 * - Validates Twilio signature to ensure requests come from Twilio
 * - Verifies pastor is registered in the system
 * - Rate limiting to prevent abuse
 *
 * @see https://www.twilio.com/docs/whatsapp/tutorial/send-and-receive-media-messages-whatsapp-nodejs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TwilioService } from '@/lib/twilio';
import { OpenAIService } from '@/lib/openai';
import { processIncomingMessage } from '@/lib/ai-agent/message-processor';
import {
  getWelcomeMessage,
} from '@/lib/ai-agent/system-prompt-optimized'; // Using optimized prompt
import { whatsappRateLimiter } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Get Supabase client with service role (lazy initialization)
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration is missing');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * POST handler - Receives incoming WhatsApp messages from Twilio
 */
export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();
  logger.info('[Twilio Webhook] Received POST request');

  try {
    // ========================================
    // 1. Parse Request Data
    // ========================================
    const formData = await request.formData();

    // Extract Twilio parameters
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    // Log without exposing full phone/message (logger masks sensitive data)
    logger.debug('[Twilio Webhook] Message received', { from: params.From, hasBody: !!params.Body });

    // ========================================
    // 2. Validate Twilio Signature
    // ========================================
    const signature = request.headers.get('x-twilio-signature') || '';
    const url = request.url;

    // SECURITY: Validate that request actually comes from Twilio
    if (!TwilioService.validateWebhookSignature(signature, url, params)) {
      logger.warn('[Twilio Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // ========================================
    // 3. Extract Message Details
    // ========================================
    const from = params.From; // whatsapp:+5511999999999
    const body = params.Body; // User's message
    const messageSid = params.MessageSid; // Unique message ID

    if (!from || !body) {
      logger.warn('[Twilio Webhook] Missing required fields');
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // ========================================
    // 4. Find Pastor by Phone Number
    // ========================================
    const phoneNumber = from.replace('whatsapp:', '').replace('+', '');
    logger.debug('[Twilio Webhook] Looking for pastor', { phoneLastDigits: phoneNumber.slice(-4) });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, church_id, role, full_name, is_active')
      .or(`phone.eq.${phoneNumber},phone.eq.+${phoneNumber}`)
      .eq('role', 'PASTOR')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (profileError || !profile) {
      logger.info('[Twilio Webhook] Pastor not found', { phoneLastDigits: phoneNumber.slice(-4) });

      // Send help message to unknown number
      await TwilioService.sendWhatsAppMessage(
        from,
        `👋 Olá! Não encontrei seu cadastro como pastor no sistema Ekkle.

Para usar este assistente, você precisa estar cadastrado como pastor na plataforma.

Acesse: https://ekkle.com.br para criar sua conta.

Em caso de dúvidas, entre em contato com o suporte.`
      );

      return NextResponse.json({ status: 'unknown_user' });
    }

    logger.info('[Twilio Webhook] Found pastor', { pastorId: profile.id });

    // ========================================
    // 5. Rate Limiting Check
    // ========================================
    const allowed = await whatsappRateLimiter.checkLimit(profile.id);

    if (!allowed) {
      const remaining = whatsappRateLimiter.getRemaining(profile.id);
      logger.warn('[Twilio Webhook] Rate limit exceeded', { pastorId: profile.id });

      // Send rate limit message
      await TwilioService.sendWhatsAppMessage(
        from,
        `⚠️ *Limite de mensagens atingido*

Você pode enviar até 10 mensagens por minuto.

Por favor, aguarde alguns segundos antes de enviar mais mensagens.`
      );

      return NextResponse.json({ status: 'rate_limited' }, { status: 429 });
    }

    // ========================================
    // 6. Check if First Time User
    // ========================================
    const { data: conversation } = await supabase
      .from('whatsapp_agent_conversations')
      .select('id')
      .eq('pastor_id', profile.id)
      .single();

    const isFirstMessage = !conversation;

    // ========================================
    // 6. Send Welcome Message (First Time Only)
    // ========================================
    if (isFirstMessage) {
      logger.info('[Twilio Webhook] First message from pastor, sending welcome', { pastorId: profile.id });

      const welcomeMessage = getWelcomeMessage(profile.full_name.split(' ')[0]);

      await TwilioService.sendWhatsAppMessage(from, welcomeMessage);

      // Create initial conversation record
      await supabase.from('whatsapp_agent_conversations').insert({
        church_id: profile.church_id,
        pastor_id: profile.id,
        phone_number: from,
        messages: [],
        status: 'active',
      });

      // Create onboarding record
      await supabase.from('whatsapp_agent_onboarding').insert({
        church_id: profile.church_id,
        pastor_id: profile.id,
      });

      return NextResponse.json({ status: 'welcome_sent' });
    }

    // ========================================
    // 8. Process Message Through AI Agent
    // ========================================
    // Run async without blocking response to Twilio
    // Twilio expects quick response (< 15 seconds)
    processIncomingMessage({
      pastorId: profile.id,
      churchId: profile.church_id,
      phoneNumber: from,
      message: body,
      messageSid,
    }).catch((error) => {
      logger.error('[Twilio Webhook] Error processing message', error, { pastorId: profile.id });
    });

    // ========================================
    // 9. Return Success Response
    // ========================================
    return NextResponse.json({ status: 'processing' });
  } catch (error) {
    logger.error('[Twilio Webhook] Unexpected error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * GET handler - Health check / verification endpoint
 */
export async function GET(request: NextRequest) {
  logger.debug('[Twilio Webhook] Health check');

  const isConfigured =
    TwilioService.isConfigured() && OpenAIService.isConfigured();

  return NextResponse.json({
    status: 'Twilio WhatsApp webhook endpoint active',
    configured: isConfigured,
    timestamp: new Date().toISOString(),
  });
}
