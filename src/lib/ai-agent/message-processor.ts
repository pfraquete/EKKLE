/**
 * Message Processor
 *
 * Core orchestration for the WhatsApp AI Agent.
 * Handles incoming messages, maintains context, calls OpenAI, executes functions.
 */

import { createClient } from '@supabase/supabase-js';
import { OpenAIService, ChatMessage } from '@/lib/openai';
import { SYSTEM_PROMPT, getOnboardingPrompt } from './system-prompt';
import { getAvailableFunctions } from './function-definitions';
import { executeFunctionCall } from './function-executor';
import { TwilioService } from '@/lib/twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Input for processing incoming messages
 */
interface ProcessMessageInput {
  pastorId: string;
  churchId: string;
  phoneNumber: string;
  message: string;
  messageSid: string;
}

/**
 * Process incoming WhatsApp message
 *
 * This is the main entry point for the AI agent.
 * Flow:
 * 1. Get or create conversation
 * 2. Check for pending confirmations
 * 3. Add user message to history
 * 4. Get onboarding status
 * 5. Build context and call OpenAI
 * 6. Handle function calls if needed
 * 7. Send response via Twilio
 * 8. Update conversation and log audit trail
 */
export async function processIncomingMessage(input: ProcessMessageInput) {
  const { pastorId, churchId, phoneNumber, message, messageSid } = input;

  console.log(`[Message Processor] Processing message from pastor ${pastorId}`);

  try {
    // ========================================
    // 1. Get or Create Conversation
    // ========================================
    let conversation = await getOrCreateConversation(pastorId, churchId, phoneNumber);

    // ========================================
    // 2. Check for Pending Confirmations
    // ========================================
    const pendingConfirmation = await getPendingConfirmation(pastorId);

    if (pendingConfirmation) {
      await handleConfirmationResponse(
        pendingConfirmation,
        message,
        phoneNumber,
        conversation
      );
      return;
    }

    // ========================================
    // 3. Add User Message to History
    // ========================================
    const messages = (conversation.messages as ChatMessage[]) || [];
    messages.push({
      role: 'user',
      content: message,
    });

    // Keep only last 20 messages for context (token limit management)
    const recentMessages = messages.slice(-20);

    // ========================================
    // 4. Get Onboarding Status
    // ========================================
    const onboarding = await getOrCreateOnboarding(pastorId, churchId);
    const isOnboardingComplete = onboarding?.is_completed || false;

    // ========================================
    // 5. Build System Prompt
    // ========================================
    let systemPrompt = SYSTEM_PROMPT;
    if (!isOnboardingComplete && onboarding) {
      systemPrompt += getOnboardingPrompt(onboarding);
    }

    // ========================================
    // 6. Get Profile for Role Check
    // ========================================
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', pastorId)
      .single();

    const availableFunctions = getAvailableFunctions({
      role: profile?.role || 'PASTOR',
      isOnboardingComplete,
    });

    // ========================================
    // 7. Call OpenAI
    // ========================================
    const openaiMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages,
    ];

    console.log('[Message Processor] Calling OpenAI...');
    const response = await OpenAIService.createChatCompletion({
      messages: openaiMessages,
      functions: availableFunctions,
      temperature: 0.7,
    });

    // ========================================
    // 8. Check for Function Call
    // ========================================
    const functionCall = OpenAIService.extractFunctionCall(response);

    if (functionCall) {
      console.log(`[Message Processor] Function call detected: ${functionCall.name}`);

      // Execute the function
      const functionResult = await executeFunctionCall(
        functionCall.name,
        functionCall.arguments,
        { pastorId, churchId, conversationId: conversation.id }
      );

      // Add function call to messages
      messages.push({
        role: 'assistant',
        content: '',
        function_call: {
          name: functionCall.name,
          arguments: JSON.stringify(functionCall.arguments),
        },
      });

      // Add function result to messages
      messages.push({
        role: 'function',
        name: functionCall.name,
        content: JSON.stringify(functionResult),
      });

      // If function requires confirmation, send confirmation message
      if (functionResult.requiresConfirmation) {
        // Get the confirmation message from database
        const { data: confirmation } = await supabase
          .from('whatsapp_agent_confirmations')
          .select('confirmation_message')
          .eq('pastor_id', pastorId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (confirmation) {
          await TwilioService.sendWhatsAppMessage(
            TwilioService.formatPhoneNumber(phoneNumber),
            confirmation.confirmation_message
          );

          // Update conversation
          await supabase
            .from('whatsapp_agent_conversations')
            .update({
              messages,
              current_intent: functionCall.name,
              last_message_at: new Date().toISOString(),
            })
            .eq('id', conversation.id);

          return;
        }
      }

      // Call OpenAI again with function result to get final response
      console.log('[Message Processor] Calling OpenAI with function result...');
      const finalResponse = await OpenAIService.createChatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-20),
        ],
        temperature: 0.7,
      });

      const assistantMessage = OpenAIService.extractTextResponse(finalResponse);

      messages.push({
        role: 'assistant',
        content: assistantMessage,
      });

      // Send response to pastor
      await TwilioService.sendWhatsAppMessage(
        TwilioService.formatPhoneNumber(phoneNumber),
        assistantMessage
      );

      // Update conversation
      await supabase
        .from('whatsapp_agent_conversations')
        .update({
          messages,
          current_intent: functionCall.name,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversation.id);

      // Log audit trail
      await logAuditTrail({
        churchId,
        pastorId,
        conversationId: conversation.id,
        actionType: functionCall.name,
        actionDescription: message,
        inputData: { message, function: functionCall.name, args: functionCall.arguments },
        outputData: { response: assistantMessage, result: functionResult },
        status: functionResult.success ? 'success' : 'error',
        errorMessage: functionResult.error,
      });
    } else {
      // Direct text response (no function call)
      const assistantMessage = OpenAIService.extractTextResponse(response);

      messages.push({
        role: 'assistant',
        content: assistantMessage,
      });

      // Send response to pastor
      await TwilioService.sendWhatsAppMessage(
        TwilioService.formatPhoneNumber(phoneNumber),
        assistantMessage
      );

      // Update conversation
      await supabase
        .from('whatsapp_agent_conversations')
        .update({
          messages,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversation.id);

      // Log audit trail
      await logAuditTrail({
        churchId,
        pastorId,
        conversationId: conversation.id,
        actionType: 'chat',
        actionDescription: message,
        inputData: { message },
        outputData: { response: assistantMessage },
        status: 'success',
      });
    }
  } catch (error) {
    console.error('[Message Processor] Error processing message:', error);

    // Send error message to pastor
    await TwilioService.sendWhatsAppMessage(
      TwilioService.formatPhoneNumber(phoneNumber),
      '❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente em alguns instantes.'
    );

    // Log error
    await logAuditTrail({
      churchId,
      pastorId,
      actionType: 'error',
      actionDescription: message,
      inputData: { message },
      status: 'error',
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle confirmation response (SIM/NÃO)
 */
async function handleConfirmationResponse(
  confirmation: any,
  message: string,
  phoneNumber: string,
  conversation: any
) {
  const normalizedMessage = message.trim().toUpperCase();

  if (normalizedMessage === 'SIM') {
    console.log('[Message Processor] Confirmation accepted');

    // Execute the confirmed action
    const result = await executeFunctionCall(
      confirmation.action_type,
      confirmation.action_payload,
      {
        pastorId: confirmation.pastor_id,
        churchId: conversation.church_id,
        conversationId: conversation.id,
        skipConfirmation: true, // Skip confirmation check
      }
    );

    // Update confirmation status
    await supabase
      .from('whatsapp_agent_confirmations')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', confirmation.id);

    // Send success/error message
    const responseMessage = result.success
      ? `✅ Ação confirmada e executada com sucesso!\n\n${result.message || ''}`
      : `❌ Erro ao executar ação: ${result.error}`;

    await TwilioService.sendWhatsAppMessage(
      TwilioService.formatPhoneNumber(phoneNumber),
      responseMessage
    );

    // Log audit trail
    await logAuditTrail({
      churchId: conversation.church_id,
      pastorId: confirmation.pastor_id,
      conversationId: conversation.id,
      actionType: confirmation.action_type,
      actionDescription: `Confirmação: ${message}`,
      inputData: { confirmation: confirmation.action_payload },
      outputData: result,
      status: result.success ? 'success' : 'error',
      errorMessage: result.error,
    });
  } else if (
    normalizedMessage === 'NÃO' ||
    normalizedMessage === 'NAO' ||
    normalizedMessage === 'CANCELAR'
  ) {
    console.log('[Message Processor] Confirmation rejected');

    // Cancel the action
    await supabase
      .from('whatsapp_agent_confirmations')
      .update({ status: 'rejected' })
      .eq('id', confirmation.id);

    await TwilioService.sendWhatsAppMessage(
      TwilioService.formatPhoneNumber(phoneNumber),
      '❌ Ação cancelada. Como posso ajudar com mais alguma coisa?'
    );
  } else {
    // Invalid response - remind user
    await TwilioService.sendWhatsAppMessage(
      TwilioService.formatPhoneNumber(phoneNumber),
      `⚠️ Por favor, responda com *SIM* para confirmar ou *NÃO* para cancelar.\n\n${confirmation.confirmation_message}`
    );
  }
}

/**
 * Get or create conversation
 */
async function getOrCreateConversation(
  pastorId: string,
  churchId: string,
  phoneNumber: string
) {
  const { data: existing } = await supabase
    .from('whatsapp_agent_conversations')
    .select('*')
    .eq('pastor_id', pastorId)
    .single();

  if (existing) {
    return existing;
  }

  const { data: newConversation, error } = await supabase
    .from('whatsapp_agent_conversations')
    .insert({
      church_id: churchId,
      pastor_id: pastorId,
      phone_number: phoneNumber,
      messages: [],
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;

  return newConversation;
}

/**
 * Get pending confirmation
 */
async function getPendingConfirmation(pastorId: string) {
  const { data } = await supabase
    .from('whatsapp_agent_confirmations')
    .select('*')
    .eq('pastor_id', pastorId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data;
}

/**
 * Get or create onboarding
 */
async function getOrCreateOnboarding(pastorId: string, churchId: string) {
  const { data: existing } = await supabase
    .from('whatsapp_agent_onboarding')
    .select('*')
    .eq('pastor_id', pastorId)
    .single();

  if (existing) {
    return existing;
  }

  const { data: newOnboarding, error } = await supabase
    .from('whatsapp_agent_onboarding')
    .insert({
      church_id: churchId,
      pastor_id: pastorId,
      step_church_name_completed: false,
      step_first_cell_completed: false,
      step_initial_members_completed: false,
      step_website_config_completed: false,
    })
    .select()
    .single();

  if (error) throw error;

  return newOnboarding;
}

/**
 * Log audit trail
 */
async function logAuditTrail(data: {
  churchId: string;
  pastorId: string;
  conversationId?: string;
  actionType: string;
  actionDescription: string;
  inputData?: any;
  outputData?: any;
  status: 'success' | 'error' | 'pending';
  errorMessage?: string;
}) {
  await supabase.from('whatsapp_agent_audit_log').insert({
    church_id: data.churchId,
    pastor_id: data.pastorId,
    conversation_id: data.conversationId || null,
    action_type: data.actionType,
    action_description: data.actionDescription,
    input_data: data.inputData,
    output_data: data.outputData,
    status: data.status,
    error_message: data.errorMessage || null,
  });
}
