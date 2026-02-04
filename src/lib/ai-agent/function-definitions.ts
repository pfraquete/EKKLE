/**
 * Function Definitions for OpenAI Function Calling
 *
 * Maps natural language intents to server actions.
 * These definitions tell GPT-4o what functions are available and how to use them.
 *
 * @see https://platform.openai.com/docs/guides/function-calling
 */

import { FunctionDefinition } from '@/lib/openai';

/**
 * All available agent functions
 */
export const AGENT_FUNCTIONS: FunctionDefinition[] = [
  // ============================================
  // CELLS MANAGEMENT
  // ============================================
  {
    name: 'create_cell',
    description:
      'Cria uma nova célula com líder. Use quando o pastor quiser criar/adicionar uma nova célula.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nome da célula (ex: Célula da Paz, Célula Jovem)',
        },
        leaderName: {
          type: 'string',
          description: 'Nome completo do líder da célula',
        },
        leaderEmail: {
          type: 'string',
          description: 'Email do líder (para login e notificações)',
        },
      },
      required: ['name', 'leaderName', 'leaderEmail'],
    },
  },
  {
    name: 'list_cells',
    description:
      'Lista todas as células da igreja. Use quando o pastor quiser ver/visualizar/listar células.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_cell_details',
    description:
      'Obtém detalhes completos de uma célula específica (membros, líder, reuniões, etc).',
    parameters: {
      type: 'object',
      properties: {
        cellId: {
          type: 'string',
          description: 'ID da célula',
        },
      },
      required: ['cellId'],
    },
  },
  {
    name: 'delete_cell_request',
    description:
      'Solicita confirmação para deletar uma célula (AÇÃO CRÍTICA). Use quando o pastor quiser deletar/remover/excluir uma célula.',
    parameters: {
      type: 'object',
      properties: {
        cellId: {
          type: 'string',
          description: 'ID da célula a deletar',
        },
        cellName: {
          type: 'string',
          description: 'Nome da célula (para mostrar na confirmação)',
        },
      },
      required: ['cellId', 'cellName'],
    },
  },

  // ============================================
  // MEMBERS MANAGEMENT
  // ============================================
  {
    name: 'create_member',
    description:
      'Adiciona um novo membro ao sistema. Use quando o pastor quiser adicionar/cadastrar/criar um novo membro.',
    parameters: {
      type: 'object',
      properties: {
        fullName: {
          type: 'string',
          description: 'Nome completo do membro',
        },
        phone: {
          type: 'string',
          description: 'Telefone no formato (11) 99999-9999 ou similar (opcional)',
        },
        email: {
          type: 'string',
          description: 'Email do membro (opcional)',
        },
        cellId: {
          type: 'string',
          description: 'ID da célula à qual o membro pertence',
        },
        memberStage: {
          type: 'string',
          enum: ['VISITOR', 'REGULAR_VISITOR', 'MEMBER', 'LEADER'],
          description:
            'Estágio do membro: VISITOR (visitante), REGULAR_VISITOR (visitante frequente), MEMBER (membro), LEADER (líder)',
        },
        birthday: {
          type: 'string',
          description: 'Data de nascimento no formato YYYY-MM-DD (opcional)',
        },
      },
      required: ['fullName', 'cellId', 'memberStage'],
    },
  },
  {
    name: 'list_members',
    description:
      'Lista membros com filtros opcionais. Use quando o pastor quiser ver/listar membros.',
    parameters: {
      type: 'object',
      properties: {
        cellId: {
          type: 'string',
          description: 'Filtrar membros de uma célula específica (opcional)',
        },
        search: {
          type: 'string',
          description: 'Buscar por nome (opcional)',
        },
      },
    },
  },
  {
    name: 'get_member_details',
    description: 'Obtém detalhes completos de um membro específico.',
    parameters: {
      type: 'object',
      properties: {
        memberId: {
          type: 'string',
          description: 'ID do membro',
        },
      },
      required: ['memberId'],
    },
  },
  {
    name: 'delete_member_request',
    description:
      'Solicita confirmação para deletar um membro (AÇÃO CRÍTICA). Use quando o pastor quiser deletar/remover/excluir um membro.',
    parameters: {
      type: 'object',
      properties: {
        memberId: {
          type: 'string',
          description: 'ID do membro',
        },
        memberName: {
          type: 'string',
          description: 'Nome do membro (para mostrar na confirmação)',
        },
      },
      required: ['memberId', 'memberName'],
    },
  },

  // ============================================
  // SERVICES (CULTOS)
  // ============================================
  {
    name: 'create_service',
    description:
      'Cria um novo culto/serviço. Use quando o pastor quiser criar/agendar um culto.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Título do culto (ex: Culto de Celebração, Culto de Domingo)',
        },
        service_date: {
          type: 'string',
          description: 'Data do culto no formato YYYY-MM-DD',
        },
        service_time: {
          type: 'string',
          description: 'Horário do culto no formato HH:MM (ex: 10:00, 19:30)',
        },
        type: {
          type: 'string',
          enum: ['PRESENCIAL', 'ONLINE', 'HIBRIDO'],
          description:
            'Tipo do culto: PRESENCIAL (somente presencial), ONLINE (somente online), HIBRIDO (ambos)',
        },
        location: {
          type: 'string',
          description: 'Local do culto (opcional, para cultos presenciais ou híbridos)',
        },
        preacher_name: {
          type: 'string',
          description: 'Nome do pregador (opcional)',
        },
      },
      required: ['title', 'service_date', 'service_time', 'type'],
    },
  },
  {
    name: 'list_services',
    description:
      'Lista cultos/serviços agendados. Use quando o pastor quiser ver a agenda de cultos.',
    parameters: {
      type: 'object',
      properties: {
        upcoming: {
          type: 'boolean',
          description:
            'Se true, lista apenas cultos futuros. Se false, lista todos (default: true)',
        },
      },
    },
  },

  // ============================================
  // EVENTS
  // ============================================
  {
    name: 'create_event',
    description:
      'Cria um novo evento. Use quando o pastor quiser criar/agendar um evento.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Título do evento',
        },
        description: {
          type: 'string',
          description: 'Descrição do evento',
        },
        event_date: {
          type: 'string',
          description: 'Data do evento no formato YYYY-MM-DD',
        },
        location: {
          type: 'string',
          description: 'Local do evento',
        },
      },
      required: ['title', 'event_date'],
    },
  },
  {
    name: 'list_events',
    description:
      'Lista eventos. Use quando o pastor quiser ver/listar eventos agendados.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },

  // ============================================
  // COMMUNICATIONS
  // ============================================
  {
    name: 'send_bulk_whatsapp',
    description:
      'Envia mensagem em massa via WhatsApp usando Evolution API. Use quando o pastor quiser enviar mensagem/aviso para múltiplas pessoas.',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description:
            'Mensagem a enviar. Pode usar {{nome}} como placeholder que será substituído pelo primeiro nome de cada destinatário.',
        },
        targetRole: {
          type: 'string',
          enum: ['PASTOR', 'LEADER', 'MEMBER', 'ALL'],
          description:
            'Filtrar destinatários por função: PASTOR, LEADER, MEMBER ou ALL (todos). Opcional.',
        },
        targetMemberStage: {
          type: 'string',
          enum: ['VISITOR', 'REGULAR_VISITOR', 'MEMBER', 'LEADER'],
          description:
            'Filtrar destinatários por estágio de membro: VISITOR, REGULAR_VISITOR, MEMBER, LEADER. Opcional.',
        },
        search: {
          type: 'string',
          description: 'Buscar destinatários por nome (opcional)',
        },
      },
      required: ['message'],
    },
  },

  // ============================================
  // CHURCH CONFIG
  // ============================================
  {
    name: 'update_church_config',
    description:
      'Atualiza configurações da igreja (nome, slug, descrição, endereço). Use quando o pastor quiser configurar/atualizar informações da igreja.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nome da igreja',
        },
        slug: {
          type: 'string',
          description:
            'Slug para URL do site (ex: minha-igreja para https://minha-igreja.ekkle.com.br)',
        },
        description: {
          type: 'string',
          description: 'Descrição da igreja',
        },
        address: {
          type: 'string',
          description: 'Endereço completo da igreja',
        },
      },
    },
  },
  {
    name: 'get_church_info',
    description:
      'Obtém informações da igreja (nome, slug, descrição, etc). Use quando o pastor perguntar sobre dados da igreja.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },

  // ============================================
  // FINANCIAL
  // ============================================
  {
    name: 'get_financial_summary',
    description:
      'Obtém resumo financeiro da igreja (receitas, despesas, saldo). SOMENTE PASTOR pode usar. Use quando o pastor perguntar sobre finanças/dinheiro/arrecadação.',
    parameters: {
      type: 'object',
      properties: {
        month: {
          type: 'number',
          description: 'Mês (1-12, opcional). Se não especificado, usa mês atual.',
        },
        year: {
          type: 'number',
          description: 'Ano (opcional). Se não especificado, usa ano atual.',
        },
      },
    },
  },

  // ============================================
  // ONBOARDING
  // ============================================
  {
    name: 'complete_onboarding_step',
    description:
      'Marca um passo do onboarding como completo. Use AUTOMATICAMENTE após executar cada ação de onboarding com sucesso.',
    parameters: {
      type: 'object',
      properties: {
        step: {
          type: 'string',
          enum: [
            'step_church_name_completed',
            'step_first_cell_completed',
            'step_initial_members_completed',
            'step_website_config_completed',
          ],
          description:
            'Nome do passo a marcar como completo: step_church_name_completed, step_first_cell_completed, step_initial_members_completed, step_website_config_completed',
        },
      },
      required: ['step'],
    },
  },

  // ============================================
  // VISITOR INFORMATION
  // ============================================
  {
    name: 'get_church_location',
    description:
      'Obtém informações de localização da igreja (endereço, como chegar, link do Google Maps). Use quando alguém perguntar onde fica a igreja, como chegar, endereço, localização.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_service_times',
    description:
      'Obtém horários dos cultos da igreja. Use quando alguém perguntar sobre horários dos cultos, quando tem culto, programação de cultos.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_leader_contacts',
    description:
      'Obtém contatos dos líderes de célula. Use quando alguém quiser falar com um líder, participar de uma célula, ou precisar de contato de liderança.',
    parameters: {
      type: 'object',
      properties: {
        area: {
          type: 'string',
          description: 'Filtrar por área/região específica (opcional)',
        },
      },
    },
  },
  {
    name: 'get_next_events',
    description:
      'Obtém próximos eventos e cultos da igreja. Use quando alguém perguntar sobre próximos eventos, o que vai acontecer, agenda da igreja.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Número máximo de eventos a retornar (default: 5)',
        },
      },
    },
  },

  // ============================================
  // UTILITY
  // ============================================
  {
    name: 'ask_clarification',
    description:
      'Use quando precisar de mais informações do usuário antes de executar uma ação. Faça perguntas claras e específicas.',
    parameters: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'Pergunta clara a fazer ao usuário',
        },
        context: {
          type: 'string',
          description:
            'Contexto para a próxima interação (o que você está tentando fazer)',
        },
      },
      required: ['question'],
    },
  },
];

/**
 * Get function definitions based on pastor's permissions and onboarding status
 *
 * This filters available functions based on:
 * - User role (PASTOR has access to all, LEADER has limited access)
 * - Onboarding status (during onboarding, only essential functions are available)
 *
 * @param context - User context (role, onboarding status)
 * @returns Filtered array of function definitions
 */
export function getAvailableFunctions(context: {
  role: string;
  isOnboardingComplete: boolean;
}): FunctionDefinition[] {
  let functions = [...AGENT_FUNCTIONS];

  // Financial functions only for PASTOR
  if (context.role !== 'PASTOR') {
    functions = functions.filter((f) => f.name !== 'get_financial_summary');
  }

  // During onboarding, limit to essential functions
  if (!context.isOnboardingComplete) {
    const onboardingFunctions = [
      'update_church_config',
      'create_cell',
      'create_member',
      'list_cells',
      'list_members',
      'complete_onboarding_step',
      'ask_clarification',
      'get_church_info',
    ];
    functions = functions.filter((f) => onboardingFunctions.includes(f.name));
  }

  return functions;
}

/**
 * Get function by name
 */
export function getFunctionByName(name: string): FunctionDefinition | undefined {
  return AGENT_FUNCTIONS.find((f) => f.name === name);
}

/**
 * Check if a function is a critical action (requires confirmation)
 */
export function isCriticalAction(functionName: string): boolean {
  const criticalFunctions = [
    'delete_cell_request',
    'delete_member_request',
    'delete_service_request',
    'delete_event_request',
    'delete_course_request',
    'delete_product_request',
    'process_payment',
  ];

  return criticalFunctions.includes(functionName);
}
