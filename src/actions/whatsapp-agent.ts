/**
 * WhatsApp Agent Server Actions
 *
 * Server actions for managing WhatsApp AI Agent data.
 * These actions allow pastors to view conversation history, onboarding status,
 * and audit logs from the web interface.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { getProfile } from './auth';

/**
 * Get conversation history for current pastor
 *
 * Returns the full conversation history with the AI agent.
 *
 * @returns Conversation data or error
 */
export async function getConversationHistory() {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      throw new Error('Não autorizado');
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('whatsapp_agent_conversations')
      .select('*')
      .eq('pastor_id', profile.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      throw error;
    }

    return { success: true, data: data || null };
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get onboarding status for current pastor
 *
 * @returns Onboarding status data or error
 */
export async function getOnboardingStatus() {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      throw new Error('Não autorizado');
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('whatsapp_agent_onboarding')
      .select('*')
      .eq('pastor_id', profile.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { success: true, data: data || null };
  } catch (error: any) {
    console.error('Error fetching onboarding:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get audit log for current pastor
 *
 * Returns a paginated list of all actions performed by the AI agent.
 *
 * @param limit - Number of records to return (default 50)
 * @returns Audit log data or error
 */
export async function getAgentAuditLog(limit = 50) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      throw new Error('Não autorizado');
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('whatsapp_agent_audit_log')
      .select('*')
      .eq('pastor_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching audit log:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clear conversation history
 *
 * Resets the conversation, useful for testing or if the pastor wants
 * to start fresh.
 *
 * @returns Success or error
 */
export async function clearConversationHistory() {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      throw new Error('Não autorizado');
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('whatsapp_agent_conversations')
      .update({
        messages: [],
        current_intent: null,
        context_data: {},
      })
      .eq('pastor_id', profile.id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error clearing conversation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get pending confirmations for current pastor
 *
 * @returns List of pending confirmations
 */
export async function getPendingConfirmations() {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      throw new Error('Não autorizado');
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('whatsapp_agent_confirmations')
      .select('*')
      .eq('pastor_id', profile.id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching confirmations:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get agent statistics for current pastor
 *
 * Returns statistics about agent usage (total messages, actions, etc)
 *
 * @returns Statistics data
 */
export async function getAgentStatistics() {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      throw new Error('Não autorizado');
    }

    const supabase = await createClient();

    // Get conversation stats
    const { data: conversation } = await supabase
      .from('whatsapp_agent_conversations')
      .select('messages')
      .eq('pastor_id', profile.id)
      .single();

    const totalMessages = (conversation?.messages as any[])?.length || 0;

    // Get audit log stats
    const { data: auditLog } = await supabase
      .from('whatsapp_agent_audit_log')
      .select('action_type, status')
      .eq('pastor_id', profile.id);

    const totalActions = auditLog?.length || 0;
    const successfulActions =
      auditLog?.filter((log) => log.status === 'success').length || 0;
    const failedActions =
      auditLog?.filter((log) => log.status === 'error').length || 0;

    // Get onboarding status
    const { data: onboarding } = await supabase
      .from('whatsapp_agent_onboarding')
      .select('is_completed, completed_at')
      .eq('pastor_id', profile.id)
      .single();

    return {
      success: true,
      data: {
        totalMessages,
        totalActions,
        successfulActions,
        failedActions,
        onboardingCompleted: onboarding?.is_completed || false,
        onboardingCompletedAt: onboarding?.completed_at || null,
      },
    };
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    return { success: false, error: error.message };
  }
}
