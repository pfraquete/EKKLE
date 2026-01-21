/**
 * Evolution API Service
 * Handles communication with the Evolution API for WhatsApp integration.
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    console.warn('Evolution API environment variables are missing.');
}

export type ConnectionState = 'open' | 'connecting' | 'close' | 'refused';

export interface EvolutionInstance {
    instanceName: string;
    owner?: string;
    profileName?: string;
    profilePicture?: string;
}

export class EvolutionService {
    private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${EVOLUTION_API_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY!,
            ...options.headers,
        };

        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(error.message || `Evolution API error: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Create a new WhatsApp instance
     */
    static async createInstance(instanceName: string): Promise<any> {
        return this.request('/instance/create', {
            method: 'POST',
            body: JSON.stringify({
                instanceName,
                token: Math.random().toString(36).substring(7),
                qrcode: true,
            }),
        });
    }

    /**
     * Get QR Code for an instance
     */
    static async getQrCode(instanceName: string): Promise<{ base64: string }> {
        const response = await this.request<any>(`/instance/connect/${instanceName}`);
        return { base64: response.base64 };
    }

    /**
     * Get connection state
     */
    static async getConnectionState(instanceName: string): Promise<ConnectionState> {
        const response = await this.request<any>(`/instance/connectionState/${instanceName}`);
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
    static async sendText(instanceName: string, to: string, text: string): Promise<any> {
        return this.request(`/message/sendText/${instanceName}`, {
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
     * Send buttons (Evolution API 1.x / 2.x support may vary)
     */
    static async sendButtons(instanceName: string, to: string, text: string, footer: string, buttons: any[]): Promise<any> {
        return this.request(`/message/sendButtons/${instanceName}`, {
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
