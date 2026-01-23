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
     */
    static async sendText(instanceName: string, to: string, text: string): Promise<EvolutionResponse> {
        return this.request<EvolutionResponse>(`/message/sendText/${instanceName}`, {
            method: 'POST',
            body: JSON.stringify({
                number: to,
                options: {
                    delay: 1200,
                    presence: 'composing',
                    linkPreview: false,
                },
                textMessage: {
                    text,
                },
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
}
