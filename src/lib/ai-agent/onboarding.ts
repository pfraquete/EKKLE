/**
 * Onboarding System
 *
 * Manages the onboarding flow for new pastors using the WhatsApp AI Agent.
 * Automatically detects completed steps and guides pastors through initial setup.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Onboarding status interface
 */
export interface OnboardingStatus {
  id: string;
  church_id: string;
  pastor_id: string;
  step_church_name_completed: boolean;
  step_first_cell_completed: boolean;
  step_initial_members_completed: boolean;
  step_website_config_completed: boolean;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Check if pastor needs onboarding and initialize if needed
 *
 * @param pastorId - Pastor's profile ID
 * @param churchId - Church ID
 * @returns Onboarding status
 */
export async function checkAndInitializeOnboarding(
  pastorId: string,
  churchId: string
): Promise<OnboardingStatus> {
  // Check if onboarding record exists
  const { data: existing } = await supabase
    .from('whatsapp_agent_onboarding')
    .select('*')
    .eq('pastor_id', pastorId)
    .single();

  if (existing) {
    return existing;
  }

  // Create new onboarding record
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
 * Auto-detect completed onboarding steps based on database state
 *
 * This checks the actual data in the database and updates onboarding
 * status accordingly. Useful for detecting when steps are completed
 * outside of the WhatsApp flow.
 *
 * @param pastorId - Pastor's profile ID
 * @param churchId - Church ID
 * @returns Updated onboarding status
 */
export async function autoDetectOnboardingProgress(
  pastorId: string,
  churchId: string
): Promise<OnboardingStatus | null> {
  // Get church info
  const { data: church } = await supabase
    .from('churches')
    .select('name, slug')
    .eq('id', churchId)
    .single();

  // Get cells count
  const { data: cells } = await supabase
    .from('cells')
    .select('id')
    .eq('church_id', churchId)
    .limit(1);

  // Get members count
  const { data: members } = await supabase
    .from('profiles')
    .select('id')
    .eq('church_id', churchId)
    .eq('role', 'MEMBER')
    .eq('is_active', true)
    .limit(3);

  // Determine which steps are completed
  const updates: Partial<OnboardingStatus> = {};

  // Step 1: Church name configured (not default)
  if (church?.name && church.name !== 'Nova Igreja' && church.name.trim() !== '') {
    updates.step_church_name_completed = true;
  }

  // Step 2: First cell created
  if (cells && cells.length > 0) {
    updates.step_first_cell_completed = true;
  }

  // Step 3: At least 3 members added
  if (members && members.length >= 3) {
    updates.step_initial_members_completed = true;
  }

  // Step 4: Website slug configured
  if (church?.slug && church.slug.trim() !== '') {
    updates.step_website_config_completed = true;
  }

  // Update onboarding if there are changes
  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from('whatsapp_agent_onboarding')
      .update(updates)
      .eq('pastor_id', pastorId);

    if (error) {
      console.error('Error updating onboarding progress:', error);
    }
  }

  // Get updated status
  const { data: onboarding } = await supabase
    .from('whatsapp_agent_onboarding')
    .select('*')
    .eq('pastor_id', pastorId)
    .single();

  // If all steps complete, mark completion timestamp
  if (onboarding?.is_completed && !onboarding.completed_at) {
    await supabase
      .from('whatsapp_agent_onboarding')
      .update({ completed_at: new Date().toISOString() })
      .eq('pastor_id', pastorId);
  }

  return onboarding;
}

/**
 * Get next onboarding step message
 *
 * Returns a friendly message guiding the user to the next step.
 *
 * @param onboarding - Current onboarding status
 * @returns Message for next step
 */
export function getNextOnboardingStepMessage(onboarding: OnboardingStatus): string {
  if (!onboarding.step_church_name_completed) {
    return `🎉 *Bem-vindo ao Ekkle!*

Vamos começar configurando sua igreja. É rápido e fácil!

*Passo 1 de 4: Nome da Igreja*

Qual é o nome da sua igreja?`;
  }

  if (!onboarding.step_first_cell_completed) {
    return `✅ *Nome da igreja configurado!*

*Passo 2 de 4: Primeira Célula*

Agora vamos criar sua primeira célula.

Para isso, preciso de:
• Nome da célula
• Nome do líder
• Email do líder

Pode me passar essas informações?`;
  }

  if (!onboarding.step_initial_members_completed) {
    return `✅ *Primeira célula criada!*

*Passo 3 de 4: Membros Iniciais*

Vamos adicionar alguns membros à sua célula (pelo menos 3).

Para cada membro, preciso de:
• Nome completo
• Célula
• Estágio (visitante, membro, líder)

Qual o primeiro membro?`;
  }

  if (!onboarding.step_website_config_completed) {
    return `✅ *Membros adicionados!*

*Passo 4 de 4: Site Público*

Por último, vamos configurar o endereço do seu site.

Qual slug você quer usar? (ex: minha-igreja)

Seu site ficará: https://[slug].ekkle.com.br`;
  }

  return `🎊 *Parabéns! Onboarding completo!*

Sua igreja está configurada e pronta para usar o Ekkle!

Agora você pode:
✅ Gerenciar células e membros
✅ Criar cultos e eventos
✅ Enviar mensagens em massa
✅ Ver relatórios e métricas
✅ E muito mais!

*Como posso ajudar hoje?*`;
}

/**
 * Get onboarding progress percentage
 *
 * @param onboarding - Current onboarding status
 * @returns Progress percentage (0-100)
 */
export function getOnboardingProgress(onboarding: OnboardingStatus): number {
  const steps = [
    onboarding.step_church_name_completed,
    onboarding.step_first_cell_completed,
    onboarding.step_initial_members_completed,
    onboarding.step_website_config_completed,
  ];

  const completed = steps.filter(Boolean).length;
  return Math.round((completed / steps.length) * 100);
}

/**
 * Get current onboarding step number
 *
 * @param onboarding - Current onboarding status
 * @returns Current step number (1-4, or 5 if complete)
 */
export function getCurrentOnboardingStep(onboarding: OnboardingStatus): number {
  if (!onboarding.step_church_name_completed) return 1;
  if (!onboarding.step_first_cell_completed) return 2;
  if (!onboarding.step_initial_members_completed) return 3;
  if (!onboarding.step_website_config_completed) return 4;
  return 5; // Complete
}

/**
 * Check if specific step is completed
 *
 * @param onboarding - Current onboarding status
 * @param step - Step to check
 * @returns True if step is completed
 */
export function isStepCompleted(
  onboarding: OnboardingStatus,
  step:
    | 'church_name'
    | 'first_cell'
    | 'initial_members'
    | 'website_config'
): boolean {
  const stepMap = {
    church_name: onboarding.step_church_name_completed,
    first_cell: onboarding.step_first_cell_completed,
    initial_members: onboarding.step_initial_members_completed,
    website_config: onboarding.step_website_config_completed,
  };

  return stepMap[step];
}

/**
 * Mark step as completed
 *
 * @param pastorId - Pastor's profile ID
 * @param step - Step to mark as completed
 */
export async function markStepCompleted(
  pastorId: string,
  step:
    | 'step_church_name_completed'
    | 'step_first_cell_completed'
    | 'step_initial_members_completed'
    | 'step_website_config_completed'
): Promise<void> {
  await supabase
    .from('whatsapp_agent_onboarding')
    .update({ [step]: true })
    .eq('pastor_id', pastorId);

  // Check if all steps are now complete
  const { data: onboarding } = await supabase
    .from('whatsapp_agent_onboarding')
    .select('*')
    .eq('pastor_id', pastorId)
    .single();

  if (onboarding?.is_completed && !onboarding.completed_at) {
    await supabase
      .from('whatsapp_agent_onboarding')
      .update({ completed_at: new Date().toISOString() })
      .eq('pastor_id', pastorId);
  }
}
