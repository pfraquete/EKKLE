/**
 * Evolution API Service
 * Handles communication with the Evolution API for WhatsApp integration.
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    console.warn('Evolution API environment variables are missing.');
}

const checkConfig = () => {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        throw new Error('Configuração da Evolution API ausente no servidor (.env)');
    }
}

export type ConnectionState = 'open' | 'connecting' | 'close' | 'refused';

export interface EvolutionInstance {
    instanceName: string;
    owner?: string;
    profileName?: string;
    profilePicture?: string;
}

export interface EvolutionResponse {
    success?: boolean;
    message?: string;
    [key: string]: unknown;
}

export interface EvolutionQrResponse {
    base64: string;
}

export interface EvolutionStateResponse {
    instance: {
        state: ConnectionState;
    };
}

export interface EvolutionChat {
    id: string;
    remoteJid: string;
    pushName?: string;
    profilePicUrl?: string;
    lastMessage?: {
        content: string;
        timestamp: number;
    };
    unreadCount?: number;
}

export interface EvolutionMessage {
    id: string;
    key: {
        id: string;
        fromMe: boolean;
        remoteJid: string;
    };
    pushName?: string;
    message?: {
        conversation?: string;
        extendedTextMessage?: {
            text: string;
        };
    };
    messageType?: string;
    messageTimestamp?: number;
}

export class EvolutionService {
    private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        checkConfig();
        const url = `${EVOLUTION_API_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY!,
            ...options.headers,
        };

        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'Unknown error', response: 'No JSON body' }));
            console.error('[Evolution API Error]', { endpoint, status: response.status, body: errorBody });

            // Construct a more useful error message
            const message = errorBody.message ||
                (errorBody.error ? JSON.stringify(errorBody.error) : null) ||
                `Evolution API error: ${response.status}`;

            throw new Error(message);
        }

        return response.json() as Promise<T>;
    }

    /**
     * Create a new WhatsApp instance
     */
    static async createInstance(instanceName: string): Promise<EvolutionResponse> {
        const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/evolution`;
        
        return this.request<EvolutionResponse>('/instance/create', {
            method: 'POST',
            body: JSON.stringify({
                instanceName,
                integration: 'WHATSAPP-BAILEYS',
                webhook: {
                    url: webhookUrl,
                    byEvents: true,
                    base64: true,
                    events: [
                        'MESSAGES_UPSERT',
                        'CONNECTION_UPDATE',
                        'QRCODE_UPDATED',
                    ],
                },
                websocket: {
                    enabled: false,
                },
                rabbitmq: {
                    enabled: false,
                },
                chatwoot: {
                    enabled: false,
                },
            }),
        });
    }

    /**
     * Get QR Code for an instance
     */
    static async getQrCode(instanceName: string): Promise<{ base64: string }> {
        const response = await this.request<EvolutionQrResponse>(`/instance/connect/${instanceName}`);
        return { base64: response.base64 };
    }

    /**
     * Get instance details
     */
    static async getInstance(instanceName: string): Promise<EvolutionInstance | null> {
        try {
            return await this.request<EvolutionInstance>(`/instance/fetchInstances/${instanceName}?instanceName=${instanceName}`);
        } catch (error) {
            return null;
        }
    }

    /**
     * Restart an instance
     */
    static async restartInstance(instanceName: string): Promise<void> {
        await this.request(`/instance/restart/${instanceName}`, {
            method: 'PUT',
        });
    }

    /**
     * Get connection state
     */
    static async getConnectionState(instanceName: string): Promise<ConnectionState> {
        const response = await this.request<EvolutionStateResponse>(`/instance/connectionState/${instanceName}`);
        return response.instance.state;
    }

    /**
     * Logout an instance
     */
    static async logoutInstance(instanceName: string): Promise<void> {
        await this.request(`/instance/logout/${instanceName}`, {
            method: 'DELETE',
        });
    }

    /**
     * Delete an instance
     */
    static async deleteInstance(instanceName: string): Promise<void> {
        await this.request(`/instance/delete/${instanceName}`, {
            method: 'DELETE',
        });
    }

    /**
     * Send a text message
     * Updated for Evolution API v2 format
     */
    static async sendText(instanceName: string, to: string, text: string): Promise<EvolutionResponse> {
        // Normalize phone number - remove non-digits and ensure proper format
        const normalizedNumber = to.replace(/\D/g, '');
        
        console.log('[Evolution API] Sending message to:', normalizedNumber);
        console.log('[Evolution API] Instance:', instanceName);
        
        return this.request<EvolutionResponse>(`/message/sendText/${instanceName}`, {
            method: 'POST',
            body: JSON.stringify({
                number: normalizedNumber,
                text: text,
            }),
        });
    }

    /**
     * Send buttons
     */
    static async sendButtons(instanceName: string, to: string, text: string, footer: string, buttons: unknown[]): Promise<EvolutionResponse> {
        return this.request<EvolutionResponse>(`/message/sendButtons/${instanceName}`, {
            method: 'POST',
            body: JSON.stringify({
                number: to,
                mainItens: {
                    title: "Confirmação",
                    content: text,
                    footer: footer,
                    buttons: buttons
                }
            }),
        });
    }

    /**
     * Get all chats for an instance
     */
    static async getChats(instanceName: string): Promise<EvolutionChat[]> {
        try {
            const response = await this.request<any>(`/chat/findChats/${instanceName}`, {
                method: 'POST',
                body: JSON.stringify({}),
            });
            return response || [];
        } catch (error) {
            console.error('[Evolution API] Error fetching chats:', error);
            return [];
        }
    }

    /**
     * Get messages for a specific chat
     */
    static async getMessages(instanceName: string, remoteJid: string, limit: number = 50): Promise<{ messages: { records: EvolutionMessage[] } }> {
        try {
            const response = await this.request<any>(`/chat/findMessages/${instanceName}`, {
                method: 'POST',
                body: JSON.stringify({
                    where: {
                        key: {
                            remoteJid: remoteJid
                        }
                    },
                    limit: limit
                }),
            });
            return response;
        } catch (error) {
            console.error('[Evolution API] Error fetching messages:', error);
            return { messages: { records: [] } };
        }
    }

    /**
     * Get contacts for an instance
     */
    static async getContacts(instanceName: string): Promise<any[]> {
        try {
            const response = await this.request<any>(`/chat/findContacts/${instanceName}`, {
                method: 'POST',
                body: JSON.stringify({}),
            });
            return response || [];
        } catch (error) {
            console.error('[Evolution API] Error fetching contacts:', error);
            return [];
        }
    }
}
