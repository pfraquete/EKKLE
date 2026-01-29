'use server';

import { createClient } from '@/lib/supabase/server';
import { getProfile } from './auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  createRecipient,
  getRecipient,
  updateRecipient,
  PagarmeRecipient,
  PagarmeError,
} from '@/lib/pagarme';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const recipientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  document: z.string().min(11, 'CPF/CNPJ inválido'),
  bank_code: z.string().min(1, 'Banco é obrigatório'),
  account_type: z.enum(['checking', 'savings']),
  account_number: z.string().min(1, 'Número da conta é obrigatório'),
  account_digit: z.string().min(1, 'Dígito da conta é obrigatório'),
  branch_number: z.string().min(1, 'Agência é obrigatória'),
  branch_digit: z.string().optional(),
  holder_name: z.string().min(1, 'Nome do titular é obrigatório'),
  holder_document: z.string().min(11, 'CPF/CNPJ do titular é obrigatório'),
  transfer_interval: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
});

type RecipientInput = z.infer<typeof recipientSchema>;

// =====================================================
// GET CHURCH RECIPIENT
// =====================================================

export async function getChurchRecipient() {
  try {
    const profile = await getProfile();
    if (!profile) {
      return { success: false, error: 'Não autenticado' };
    }

    const supabase = await createClient();
    const { data: recipient, error } = await supabase
      .from('recipients')
      .select('*')
      .eq('church_id', profile.church_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching recipient:', error);
      return { success: false, error: 'Erro ao buscar recebedor' };
    }

    return { success: true, recipient };
  } catch (error) {
    console.error('Error in getChurchRecipient:', error);
    return { success: false, error: 'Erro ao buscar recebedor' };
  }
}

// =====================================================
// CREATE CHURCH RECIPIENT
// =====================================================

export async function createChurchRecipient(input: RecipientInput) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return { success: false, error: 'Não autenticado' };
    }

    if (profile.role !== 'PASTOR') {
      return { success: false, error: 'Apenas pastores podem configurar recebedores' };
    }

    const validated = recipientSchema.parse(input);

    const supabase = await createClient();

    // Check if recipient already exists
    const { data: existing } = await supabase
      .from('recipients')
      .select('id')
      .eq('church_id', profile.church_id)
      .single();

    if (existing) {
      return { success: false, error: 'Recebedor já configurado. Use a opção de atualizar.' };
    }

    // Get church data
    const { data: church } = await supabase
      .from('churches')
      .select('name')
      .eq('id', profile.church_id)
      .single();

    if (!church) {
      return { success: false, error: 'Igreja não encontrada' };
    }

    // Clean and validate documents
    const cleanDocument = validated.document.replace(/\D/g, '');
    const cleanHolderDocument = validated.holder_document.replace(/\D/g, '');

    // Determine document types
    const documentType = cleanDocument.length <= 11 ? 'individual' : 'company';
    const holderType = cleanHolderDocument.length <= 11 ? 'individual' : 'company';

    // Create recipient in Pagar.me
    const pagarmeRecipient: PagarmeRecipient = {
      name: validated.name,
      email: validated.email,
      document: cleanDocument,
      type: documentType,
      description: `Recebedor da igreja ${church.name}`,
      default_bank_account: {
        holder_name: validated.holder_name,
        holder_type: holderType,
        holder_document: cleanHolderDocument,
        bank: validated.bank_code,
        branch_number: validated.branch_number,
        branch_check_digit: validated.branch_digit,
        account_number: validated.account_number,
        account_check_digit: validated.account_digit,
        type: validated.account_type,
      },
      transfer_settings: {
        transfer_enabled: true,
        transfer_interval: validated.transfer_interval,
      },
      metadata: {
        church_id: profile.church_id,
        church_name: church.name,
      },
    };

    console.log('Creating recipient in Pagar.me...');
    const pagarmeResponse = await createRecipient(pagarmeRecipient);
    console.log('Recipient created in Pagar.me:', pagarmeResponse.id);

    // Save to database
    const { data: recipient, error: insertError } = await supabase
      .from('recipients')
      .insert({
        church_id: profile.church_id,
        pagarme_recipient_id: pagarmeResponse.id,
        name: validated.name,
        email: validated.email,
        document: cleanDocument,
        document_type: documentType === 'individual' ? 'CPF' : 'CNPJ',
        type: documentType,
        bank_code: validated.bank_code,
        account_type: validated.account_type,
        account_number: validated.account_number,
        account_digit: validated.account_digit,
        branch_number: validated.branch_number,
        branch_digit: validated.branch_digit,
        holder_name: validated.holder_name,
        holder_document: cleanHolderDocument,
        transfer_interval: validated.transfer_interval,
        status: 'active',
        verified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving recipient to database:', insertError);
      return { success: false, error: 'Erro ao salvar recebedor no banco de dados' };
    }

    revalidatePath('/configuracoes/pagamentos');
    revalidatePath('/dashboard/loja');

    return { success: true, recipient };
  } catch (error) {
    console.error('Error creating recipient:', error);

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    if (error instanceof PagarmeError) {
      const errorMessage =
        error.data?.errors?.[0]?.message || error.data?.message || 'Erro no gateway de pagamento';
      return { success: false, error: errorMessage };
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Erro ao criar recebedor' };
  }
}

// =====================================================
// UPDATE CHURCH RECIPIENT
// =====================================================

export async function updateChurchRecipient(input: Partial<RecipientInput>) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      return { success: false, error: 'Não autorizado' };
    }

    const supabase = await createClient();

    // Get existing recipient
    const { data: recipient, error: fetchError } = await supabase
      .from('recipients')
      .select('*')
      .eq('church_id', profile.church_id)
      .single();

    if (fetchError || !recipient) {
      return { success: false, error: 'Recebedor não encontrado' };
    }

    // Update in Pagar.me (only email and name can be updated)
    const updateData: Partial<PagarmeRecipient> = {};

    if (input.email) updateData.email = input.email;
    if (input.name) updateData.name = input.name;

    if (Object.keys(updateData).length > 0) {
      console.log('Updating recipient in Pagar.me...');
      await updateRecipient(recipient.pagarme_recipient_id, updateData);
    }

    // Update in database
    const dbUpdate: Record<string, unknown> = {};
    if (input.email) dbUpdate.email = input.email;
    if (input.name) dbUpdate.name = input.name;
    if (input.transfer_interval) dbUpdate.transfer_interval = input.transfer_interval;

    if (Object.keys(dbUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from('recipients')
        .update(dbUpdate)
        .eq('id', recipient.id);

      if (updateError) {
        console.error('Error updating recipient in database:', updateError);
        return { success: false, error: 'Erro ao atualizar recebedor' };
      }
    }

    revalidatePath('/configuracoes/pagamentos');

    return { success: true };
  } catch (error) {
    console.error('Error updating recipient:', error);

    if (error instanceof PagarmeError) {
      const errorMessage =
        error.data?.errors?.[0]?.message || error.data?.message || 'Erro no gateway de pagamento';
      return { success: false, error: errorMessage };
    }

    return { success: false, error: 'Erro ao atualizar recebedor' };
  }
}

// =====================================================
// SYNC RECIPIENT FROM PAGAR.ME
// Fetch latest status from Pagar.me and update database
// =====================================================

export async function syncRecipientFromPagarme() {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      return { success: false, error: 'Não autorizado' };
    }

    const supabase = await createClient();

    // Get existing recipient
    const { data: recipient, error: fetchError } = await supabase
      .from('recipients')
      .select('*')
      .eq('church_id', profile.church_id)
      .single();

    if (fetchError || !recipient) {
      return { success: false, error: 'Recebedor não encontrado' };
    }

    // Fetch from Pagar.me
    console.log('Syncing recipient from Pagar.me...');
    const pagarmeRecipient = await getRecipient(recipient.pagarme_recipient_id);

    // Update database with latest info
    const { error: updateError } = await supabase
      .from('recipients')
      .update({
        status: pagarmeRecipient.status === 'active' ? 'active' : 'pending',
        name: pagarmeRecipient.name,
        email: pagarmeRecipient.email,
      })
      .eq('id', recipient.id);

    if (updateError) {
      console.error('Error updating recipient from sync:', updateError);
      return { success: false, error: 'Erro ao sincronizar recebedor' };
    }

    revalidatePath('/configuracoes/pagamentos');

    return { success: true, recipient: pagarmeRecipient };
  } catch (error) {
    console.error('Error syncing recipient:', error);

    if (error instanceof PagarmeError) {
      const errorMessage =
        error.data?.errors?.[0]?.message || error.data?.message || 'Erro no gateway de pagamento';
      return { success: false, error: errorMessage };
    }

    return { success: false, error: 'Erro ao sincronizar recebedor' };
  }
}
