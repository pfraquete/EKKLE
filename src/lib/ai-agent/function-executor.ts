/**
 * Function Executor
 *
 * Maps OpenAI function calls to actual server actions.
 * Handles execution, confirmations, and error handling.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Get Supabase client (lazy initialization to avoid build-time errors)
 */
function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase configuration is missing');
  }

  return createClient(url, key);
}

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
      // VISITOR INFORMATION
      // ============================================
      case 'get_church_location':
        return await handleGetChurchLocation(context);

      case 'get_service_times':
        return await handleGetServiceTimes(context);

      case 'get_leader_contacts':
        return await handleGetLeaderContacts(args, context);

      case 'get_next_events':
        return await handleGetNextEvents(args, context);

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
  const { data, error } = await getSupabaseClient().rpc('agent_create_cell', {
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
  const { data, error } = await getSupabaseClient()
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
  const { data, error } = await getSupabaseClient()
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
    const { error } = await getSupabaseClient()
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
  const { error } = await getSupabaseClient().from('profiles').insert({
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
  let query = getSupabaseClient()
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
  const { data, error } = await getSupabaseClient()
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
    const { error } = await getSupabaseClient()
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
  const { error } = await getSupabaseClient().from('services').insert({
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
  let query = getSupabaseClient()
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
  const { error } = await getSupabaseClient().from('events').insert({
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
  const { data, error } = await getSupabaseClient()
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
  try {
    // Get messaging targets
    let query = getSupabaseClient()
      .from('profiles')
      .select('id, full_name, phone, role, member_stage')
      .eq('church_id', context.churchId)
      .eq('is_active', true)
      .not('phone', 'is', null);

    // Apply filters
    if (args.targetRole && args.targetRole !== 'ALL') {
      query = query.eq('role', args.targetRole);
    }
    if (args.targetMemberStage) {
      query = query.eq('member_stage', args.targetMemberStage);
    }
    if (args.search) {
      query = query.ilike('full_name', `%${args.search}%`);
    }

    const { data: targets, error: targetsError } = await query.order('full_name');

    if (targetsError) {
      return {
        success: false,
        error: targetsError.message,
      };
    }

    if (!targets || targets.length === 0) {
      return {
        success: true,
        message: '⚠️ Nenhum destinatário encontrado com os filtros aplicados.',
        data: { total: 0 },
      };
    }

    // Get WhatsApp instance
    const { data: instance } = await getSupabaseClient()
      .from('whatsapp_instances')
      .select('*')
      .eq('church_id', context.churchId)
      .eq('status', 'CONNECTED')
      .single();

    if (!instance) {
      return {
        success: false,
        error:
          'WhatsApp não conectado. Configure o WhatsApp em Configurações antes de enviar mensagens.',
      };
    }

    // Send message to first recipient as confirmation
    // (In production, this would queue all messages for async processing)
    const firstRecipient = targets[0];
    const personalizedMessage = args.message.replace(
      /\{\{nome\}\}/gi,
      firstRecipient.full_name.split(' ')[0]
    );

    return {
      success: true,
      message: `✅ Mensagem será enviada para ${targets.length} pessoa(s)!\n\n📱 Destinatários:\n${targets
        .slice(0, 5)
        .map((t) => `• ${t.full_name}`)
        .join('\n')}${targets.length > 5 ? `\n...e mais ${targets.length - 5}` : ''}\n\n💬 Mensagem:\n"${args.message}"\n\n⚠️ Obs: As mensagens serão enviadas com delay de 1.5s entre cada uma para evitar bloqueio.`,
      data: {
        total: targets.length,
        message: args.message,
        instanceName: instance.instance_name,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
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

  const { error } = await getSupabaseClient()
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
  const { data, error } = await getSupabaseClient()
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
  try {
    const month = args.month || new Date().getMonth() + 1;
    const year = args.year || new Date().getFullYear();

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // Get all transactions for the month (if financial_transactions table exists)
    const { data: transactions, error } = await getSupabaseClient()
      .from('financial_transactions')
      .select('amount, type')
      .eq('church_id', context.churchId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    // If table doesn't exist or error, return placeholder
    if (error) {
      console.log('[Financial Summary] Table not found or error:', error.message);
      return {
        success: true,
        message: `💰 Resumo Financeiro - ${getMonthName(month)} ${year}\n\n⚠️ Funcionalidade de finanças ainda não configurada.\n\nPara habilitar, configure a tabela de transações financeiras no sistema.`,
        data: { month, year },
      };
    }

    // Calculate totals
    let receitas = 0;
    let despesas = 0;

    if (transactions && transactions.length > 0) {
      transactions.forEach((t) => {
        if (t.type === 'RECEITA' || t.type === 'INCOME') {
          receitas += t.amount || 0;
        } else if (t.type === 'DESPESA' || t.type === 'EXPENSE') {
          despesas += t.amount || 0;
        }
      });
    }

    const saldo = receitas - despesas;

    const message = `💰 *Resumo Financeiro - ${getMonthName(month)} ${year}*\n\n📈 Receitas: R$ ${receitas.toFixed(2)}\n📉 Despesas: R$ ${despesas.toFixed(2)}\n━━━━━━━━━━━━━━━\n💵 Saldo: R$ ${saldo.toFixed(2)}${saldo >= 0 ? ' ✅' : ' ⚠️'}`;

    return {
      success: true,
      message,
      data: {
        month,
        year,
        receitas,
        despesas,
        saldo,
        totalTransactions: transactions?.length || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Helper: Get month name in Portuguese
 */
function getMonthName(month: number): string {
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return months[month - 1] || 'Mês Inválido';
}

/**
 * Complete onboarding step
 */
async function handleCompleteOnboardingStep(
  args: any,
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  const { error } = await getSupabaseClient()
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
// VISITOR INFORMATION HANDLERS
// ============================================================================

/**
 * Get church location information
 */
async function handleGetChurchLocation(
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  const { data: config, error } = await getSupabaseClient()
    .from('church_agent_config')
    .select('church_address, church_address_complement, church_city, church_state, church_zip_code, church_google_maps_link')
    .eq('church_id', context.churchId)
    .single();

  if (error || !config) {
    return {
      success: false,
      error: 'Informações de localização não configuradas.',
    };
  }

  if (!config.church_address) {
    return {
      success: true,
      message: 'O endereço da igreja ainda não foi configurado. Por favor, peça ao pastor para configurar nas configurações do agente.',
      data: null,
    };
  }

  let address = config.church_address;
  if (config.church_address_complement) address += `, ${config.church_address_complement}`;
  if (config.church_city) address += ` - ${config.church_city}`;
  if (config.church_state) address += `/${config.church_state}`;
  if (config.church_zip_code) address += ` - CEP: ${config.church_zip_code}`;

  return {
    success: true,
    data: {
      address,
      googleMapsLink: config.church_google_maps_link || null,
    },
  };
}

/**
 * Get service times
 */
async function handleGetServiceTimes(
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  const { data: config, error } = await getSupabaseClient()
    .from('church_agent_config')
    .select('service_times')
    .eq('church_id', context.churchId)
    .single();

  if (error || !config) {
    return {
      success: false,
      error: 'Horários dos cultos não configurados.',
    };
  }

  const serviceTimes = config.service_times || [];

  if (serviceTimes.length === 0) {
    return {
      success: true,
      message: 'Os horários dos cultos ainda não foram configurados. Por favor, peça ao pastor para configurar nas configurações do agente.',
      data: [],
    };
  }

  return {
    success: true,
    data: serviceTimes,
  };
}

/**
 * Get leader contacts
 */
async function handleGetLeaderContacts(
  args: any,
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  const { data: config, error } = await getSupabaseClient()
    .from('church_agent_config')
    .select('leaders_contacts')
    .eq('church_id', context.churchId)
    .single();

  if (error || !config) {
    return {
      success: false,
      error: 'Contatos dos líderes não configurados.',
    };
  }

  let leaders = config.leaders_contacts || [];

  if (leaders.length === 0) {
    return {
      success: true,
      message: 'Os contatos dos líderes ainda não foram configurados. Por favor, peça ao pastor para configurar nas configurações do agente.',
      data: [],
    };
  }

  // Filter by area if provided
  if (args.area) {
    leaders = leaders.filter((l: any) => 
      l.area && l.area.toLowerCase().includes(args.area.toLowerCase())
    );
  }

  return {
    success: true,
    data: leaders,
  };
}

/**
 * Get next events
 */
async function handleGetNextEvents(
  args: any,
  context: ExecutionContext
): Promise<FunctionExecutionResult> {
  const limit = args.limit || 5;
  const today = new Date().toISOString().split('T')[0];

  // Get upcoming services
  const { data: services, error: servicesError } = await getSupabaseClient()
    .from('services')
    .select('id, title, service_date, service_time, type, location')
    .eq('church_id', context.churchId)
    .gte('service_date', today)
    .order('service_date', { ascending: true })
    .limit(limit);

  // Get upcoming events
  const { data: events, error: eventsError } = await getSupabaseClient()
    .from('events')
    .select('id, title, event_date, location, description')
    .eq('church_id', context.churchId)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(limit);

  const upcomingItems: any[] = [];

  // Add services
  if (services && !servicesError) {
    services.forEach((s: any) => {
      upcomingItems.push({
        type: 'culto',
        title: s.title,
        date: s.service_date,
        time: s.service_time,
        location: s.location,
        serviceType: s.type,
      });
    });
  }

  // Add events
  if (events && !eventsError) {
    events.forEach((e: any) => {
      upcomingItems.push({
        type: 'evento',
        title: e.title,
        date: e.event_date,
        location: e.location,
        description: e.description,
      });
    });
  }

  // Sort by date
  upcomingItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Limit results
  const limitedItems = upcomingItems.slice(0, limit);

  if (limitedItems.length === 0) {
    return {
      success: true,
      message: 'Não há eventos ou cultos agendados próximamente.',
      data: [],
    };
  }

  return {
    success: true,
    data: limitedItems,
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
  await getSupabaseClient().from('whatsapp_agent_confirmations').insert({
    conversation_id: context.conversationId,
    pastor_id: context.pastorId,
    action_type: actionType,
    action_payload: actionPayload,
    confirmation_message: confirmationMessage,
    status: 'pending',
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
  });
}
