/**
 * Integration configuration data
 * This is a helper file that can be used both on client and server
 */

export interface IntegrationConfigInfo {
    name: string
    description: string
    icon: string
}

export const INTEGRATION_CONFIGS: Record<string, IntegrationConfigInfo> = {
    stripe: {
        name: 'Stripe',
        description: 'Pagamentos e assinaturas',
        icon: 'credit-card'
    },
    evolution: {
        name: 'Evolution API',
        description: 'WhatsApp Business',
        icon: 'message-circle'
    },
    mux: {
        name: 'Mux',
        description: 'Videos e streaming',
        icon: 'video'
    },
    livekit: {
        name: 'LiveKit',
        description: 'Salas de video ao vivo',
        icon: 'radio'
    },
    resend: {
        name: 'Resend',
        description: 'Envio de emails',
        icon: 'mail'
    },
    openai: {
        name: 'OpenAI',
        description: 'Agente IA (GPT)',
        icon: 'bot'
    },
    pagarme: {
        name: 'Pagar.me',
        description: 'Pagamentos da loja',
        icon: 'shopping-bag'
    }
}

export function getIntegrationConfig(provider: string): IntegrationConfigInfo {
    return INTEGRATION_CONFIGS[provider] || {
        name: provider,
        description: 'Integracao externa',
        icon: 'puzzle'
    }
}
