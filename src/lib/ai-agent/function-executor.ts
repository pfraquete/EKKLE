/**
 * Function Executor
 *
 * Maps OpenAI function calls to actual server actions.
 * Handles execution, confirmations, and error handling.
 */

import { createClient } from '@supabase/supabase-js';

// Note: We'll implement the actual imports after creating the helper functions
// For now, we'll use placeholders and implement them properly

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Execution context
 */
interface ExecutionContext {
  pastorId: string;
  churchId: string;
  conversationId: string;
  skipConfirmation?: boolean;
}

/**
 * Function execution result
 */
export interface FunctionExecutionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
  requiresConfirmation?: boolean;
}

/**
 * Execute a function call from OpenAI
 *
 * @param functionName - Name of the function to execute
 * @param args - Function arguments
 * @param context - Execution context (pastor, church, conversation)
 * @returns Execution result
 */
export async function executeFunctionCall(
  functionName: string,
  args: Record<string, any>,
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  console.log(`[Function Executor] Executing: ${functionName}`, args);

  try {
    switch (functionName) {
      // ============================================
      // CELLS
      // ============================================
      case 'create_cell':
        return await handleCreateCell(args, context);

      case 'list_cells':
        return await handleListCells(context);

      case 'get_cell_details':
        return await handleGetCellDetails(args, context);

      case 'delete_cell_request':
        return await handleDeleteCellRequest(args, context);

      // ============================================
      // MEMBERS
      // ============================================
      case 'create_member':
        return await handleCreateMember(args, context);

      case 'list_members':
        return await handleListMembers(args, context);

      case 'get_member_details':
        return await handleGetMemberDetails(args, context);

      case 'delete_member_request':
        return await handleDeleteMemberRequest(args, context);

      // ============================================
      // SERVICES
      // ============================================
      case 'create_service':
        return await handleCreateService(args, context);

      case 'list_services':
        return await handleListServices(args, context);

      // ============================================
      // EVENTS
      // ============================================
      case 'create_event':
        return await handleCreateEvent(args, context);

      case 'list_events':
        return await handleListEvents(context);

      // ============================================
      // COMMUNICATIONS
      // ============================================
      case 'send_bulk_whatsapp':
        return await handleSendBulkWhatsApp(args, context);

      // ============================================
      // CHURCH CONFIG
      // ============================================
      case 'update_church_config':
        return await handleUpdateChurchConfig(args, context);

      case 'get_church_info':
        return await handleGetChurchInfo(context);

      // ============================================
      // FINANCIAL
      // ============================================
      case 'get_financial_summary':
        return await handleGetFinancialSummary(args, context);

      // ============================================
      // ONBOARDING
      // ============================================
      case 'complete_onboarding_step':
        return await handleCompleteOnboardingStep(args, context);

      // ============================================
      // UTILITY
      // ============================================
      case 'ask_clarification':
        return {
          success: true,
          message: args.question,
          data: { context: args.context },
        };

      default:
        return {
          success: false,
          error: `Função desconhecida: ${functionName}`,
        };
    }
  } catch (error) {
    console.error(`[Function Executor] Error in ${functionName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// HANDLER FUNCTIONS
// ============================================================================

/**
 * Create cell
 */
async function handleCreateCell(
  args: any,
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  const { data, error } = await supabase.rpc('agent_create_cell', {
    p_church_id: context.churchId,
    p_pastor_id: context.pastorId,
    p_name: args.name,
    p_leader_name: args.leaderName,
    p_leader_email: args.leaderEmail,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: `✅ Célula "${args.name}" criada com sucesso com ${args.leaderName} como líder!`,
    data,
  };
}

/**
 * List cells
 */
async function handleListCells(
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  const { data, error } = await supabase
    .from('cells')
    .select(
      `
      id,
      name,
      status,
      day_of_week,
      time,
      created_at,
      leader:leader_id(full_name, email, phone)
    `
    )
    .eq('church_id', context.churchId)
    .order('name');

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      message: 'Você ainda não tem células cadastradas.',
      data: [],
    };
  }

  return {
    success: true,
    data,
  };
}

/**
 * Get cell details
 */
async function handleGetCellDetails(
  args: any,
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  const { data, error } = await supabase
    .from('cells')
    .select(
      `
      *,
      leader:leader_id(full_name, email, phone),
      members:profiles!cell_id(count)
    `
    )
    .eq('id', args.cellId)
    .eq('church_id', context.churchId)
    .single();

  if (error) {
    return {
      success: false,
      error: 'Célula não encontrada',
    };
  }

  return {
    success: true,
    data,
  };
}

/**
 * Delete cell request (requires confirmation)
 */
async function handleDeleteCellRequest(
  args: any,
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  if (!context.skipConfirmation) {
    // Create confirmation request
    await createConfirmation(
      context,
      'delete_cell',
      { cellId: args.cellId },
      `⚠️ *ATENÇÃO:* Você está prestes a deletar a célula "${args.cellName}".\n\nEsta ação *NÃO PODE* ser desfeita. Todos os dados da célula serão permanentemente removidos.\n\n*Digite SIM para confirmar ou NÃO para cancelar.*`
    );

    return {
      success: true,
      requiresConfirmation: true,
      message: 'Aguardando confirmação...',
    };
  } else {
    // Execute deletion
    const { error } = await supabase
      .from('cells')
      .delete()
      .eq('id', args.cellId)
      .eq('church_id', context.churchId);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: `✅ Célula "${args.cellName}" deletada com sucesso.`,
    };
  }
}

/**
 * Create member
 */
async function handleCreateMember(
  args: any,
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  const { error } = await supabase.from('profiles').insert({
    full_name: args.fullName,
    phone: args.phone || null,
    email: args.email || null,
    member_stage: args.memberStage,
    cell_id: args.cellId,
    church_id: context.churchId,
    role: 'MEMBER',
    is_active: true,
    birthday: args.birthday || null,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: `✅ Membro "${args.fullName}" adicionado com sucesso!`,
  };
}

/**
 * List members
 */
async function handleListMembers(
  args: any,
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  let query = supabase
    .from('profiles')
    .select(
      `
      id,
      full_name,
      phone,
      email,
      member_stage,
      role,
      cell:cell_id(name)
    `
    )
    .eq('church_id', context.churchId)
    .eq('is_active', true);

  if (args.cellId) {
    query = query.eq('cell_id', args.cellId);
  }

  if (args.search) {
    query = query.ilike('full_name', `%${args.search}%`);
  }

  const { data, error } = await query.order('full_name');

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      message: 'Nenhum membro encontrado.',
      data: [],
    };
  }

  return {
    success: true,
    data,
  };
}

/**
 * Get member details
 */
async function handleGetMemberDetails(
  args: any,
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      *,
      cell:cell_id(name, leader:leader_id(full_name))
    `
    )
    .eq('id', args.memberId)
    .eq('church_id', context.churchId)
    .single();

  if (error) {
    return {
      success: false,
      error: 'Membro não encontrado',
    };
  }

  return {
    success: true,
    data,
  };
}

/**
 * Delete member request (requires confirmation)
 */
async function handleDeleteMemberRequest(
  args: any,
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  if (!context.skipConfirmation) {
    await createConfirmation(
      context,
      'delete_member',
      { memberId: args.memberId },
      `⚠️ *ATENÇÃO:* Você está prestes a remover o membro "${args.memberName}".\n\n*Digite SIM para confirmar ou NÃO para cancelar.*`
    );

    return {
      success: true,
      requiresConfirmation: true,
      message: 'Aguardando confirmação...',
    };
  } else {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', args.memberId)
      .eq('church_id', context.churchId);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: `✅ Membro "${args.memberName}" removido com sucesso.`,
    };
  }
}

/**
 * Create service
 */
async function handleCreateService(
  args: any,
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  const { error } = await supabase.from('services').insert({
    church_id: context.churchId,
    title: args.title,
    service_date: args.service_date,
    service_time: args.service_time,
    type: args.type,
    location: args.location || null,
    preacher_name: args.preacher_name || null,
    is_published: true,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: `✅ Culto "${args.title}" criado com sucesso para ${args.service_date} às ${args.service_time}!`,
  };
}

/**
 * List services
 */
async function handleListServices(
  args: any,
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  let query = supabase
    .from('services')
    .select('id, title, service_date, service_time, type, location')
    .eq('church_id', context.churchId);

  if (args.upcoming !== false) {
    const today = new Date().toISOString().split('T')[0];
    query = query.gte('service_date', today);
  }

  const { data, error } = await query.order('service_date');

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      message: 'Nenhum culto agendado.',
      data: [],
    };
  }

  return {
    success: true,
    data,
  };
}

/**
 * Create event
 */
async function handleCreateEvent(
  args: any,
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  const { error } = await supabase.from('events').insert({
    church_id: context.churchId,
    title: args.title,
    description: args.description || '',
    start_date: args.event_date,
    location: args.location || '',
    category: 'EVENT',
    is_published: true,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: `✅ Evento "${args.title}" criado com sucesso!`,
  };
}

/**
 * List events
 */
async function handleListEvents(
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, start_date, location, category')
    .eq('church_id', context.churchId)
    .order('start_date');

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      message: 'Nenhum evento agendado.',
      data: [],
    };
  }

  return {
    success: true,
    data,
  };
}

/**
 * Send bulk WhatsApp (via Evolution API)
 */
async function handleSendBulkWhatsApp(
  args: any,
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  // This is a placeholder - actual implementation needs to call Evolution API
  // For now, we'll return a simulation
  return {
    success: true,
    message: `📱 Mensagem será enviada em massa via WhatsApp.\n\nEsta funcionalidade requer integração com Evolution API.`,
    data: {
      message: args.message,
      filters: {
        role: args.targetRole,
        memberStage: args.targetMemberStage,
        search: args.search,
      },
    },
  };
}

/**
 * Update church config
 */
async function handleUpdateChurchConfig(
  args: any,
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  const updates: any = {};
  if (args.name) updates.name = args.name;
  if (args.slug) updates.slug = args.slug;
  if (args.description) updates.description = args.description;
  if (args.address) updates.address = args.address;

  const { error } = await supabase
    .from('churches')
    .update(updates)
    .eq('id', context.churchId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: '✅ Configurações da igreja atualizadas com sucesso!',
    data: updates,
  };
}

/**
 * Get church info
 */
async function handleGetChurchInfo(
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  const { data, error } = await supabase
    .from('churches')
    .select('id, name, slug, description, address, logo_url')
    .eq('id', context.churchId)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    data,
  };
}

/**
 * Get financial summary
 */
async function handleGetFinancialSummary(
  args: any,
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  // Placeholder - actual implementation needs financial calculations
  return {
    success: true,
    message:
      '💰 Resumo financeiro está em desenvolvimento.\n\nEsta funcionalidade será implementada em breve.',
    data: {
      month: args.month || new Date().getMonth() + 1,
      year: args.year || new Date().getFullYear(),
    },
  };
}

/**
 * Complete onboarding step
 */
async function handleCompleteOnboardingStep(
  args: any,
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  const { error } = await supabase
    .from('whatsapp_agent_onboarding')
    .update({ [args.step]: true })
    .eq('pastor_id', context.pastorId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: '✅ Passo do onboarding completado!',
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a confirmation request for critical actions
 */
async function createConfirmation(
  context: ExecutionContext,
  actionType: string,
  actionPayload: Record<string, any>,
  confirmationMessage: string
) {
  await supabase.from('whatsapp_agent_confirmations').insert({
    conversation_id: context.conversationId,
    pastor_id: context.pastorId,
    action_type: actionType,
    action_payload: actionPayload,
    confirmation_message: confirmationMessage,
    status: 'pending',
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
  });
}
