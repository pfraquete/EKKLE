/**
 * Evolution API Service
 * Handles communication with the Evolution API for WhatsApp integration.
 * 
 * SISTEMA ANTI-BANIMENTO:
 * - Simulação de digitação antes de enviar mensagens
 * - Fila de mensagens com delays aleatórios
 * - Rate limiting inteligente
 * - Delays que simulam comportamento humano
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

// ============================================================================
// CONFIGURAÇÕES ANTI-BANIMENTO
// ============================================================================

/**
 * Configurações de delay para simular comportamento humano
 */
export const ANTI_BAN_CONFIG = {
    // Delay de digitação (ms por caractere)
    TYPING_DELAY_PER_CHAR: 50,
    // Delay mínimo de digitação (ms)
    MIN_TYPING_DELAY: 1000,
    // Delay máximo de digitação (ms)
    MAX_TYPING_DELAY: 5000,
    // Delay entre mensagens na fila (ms)
    MIN_QUEUE_DELAY: 2000,
    MAX_QUEUE_DELAY: 5000,
    // Delay entre mensagens em massa (ms)
    MIN_BULK_DELAY: 3000,
    MAX_BULK_DELAY: 8000,
    // Máximo de mensagens por minuto
    MAX_MESSAGES_PER_MINUTE: 20,
    // Máximo de mensagens em massa por hora
    MAX_BULK_MESSAGES_PER_HOUR: 200,
    // Pausa longa após X mensagens em massa
    BULK_PAUSE_AFTER: 50,
    BULK_PAUSE_DURATION: 60000, // 1 minuto
};

// ============================================================================
// TYPES
// ============================================================================

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

export interface QueuedMessage {
    id: string;
    instanceName: string;
    to: string;
    text: string;
    priority: 'high' | 'normal' | 'low';
    createdAt: Date;
    attempts: number;
    status: 'pending' | 'processing' | 'sent' | 'failed';
    error?: string;
}

export interface SendMessageOptions {
    simulateTyping?: boolean;
    typingDuration?: number;
    useQueue?: boolean;
    priority?: 'high' | 'normal' | 'low';
}

// ============================================================================
// FILA DE MENSAGENS EM MEMÓRIA
// ============================================================================

class MessageQueue {
    private queue: QueuedMessage[] = [];
    private processing = false;
    private messagesSentLastMinute = 0;
    private lastMinuteReset = Date.now();

    /**
     * Adiciona mensagem à fila
     */
    add(message: Omit<QueuedMessage, 'id' | 'createdAt' | 'attempts' | 'status'>): string {
        const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const queuedMessage: QueuedMessage = {
            ...message,
            id,
            createdAt: new Date(),
            attempts: 0,
            status: 'pending',
        };

        // Inserir baseado na prioridade
        if (message.priority === 'high') {
            const firstNonHighIndex = this.queue.findIndex(m => m.priority !== 'high');
            if (firstNonHighIndex === -1) {
                this.queue.push(queuedMessage);
            } else {
                this.queue.splice(firstNonHighIndex, 0, queuedMessage);
            }
        } else {
            this.queue.push(queuedMessage);
        }

        console.log(`[MessageQueue] Added message ${id} to queue. Queue size: ${this.queue.length}`);
        
        // Iniciar processamento se não estiver rodando
        if (!this.processing) {
            this.processQueue();
        }

        return id;
    }

    /**
     * Processa a fila de mensagens
     */
    private async processQueue(): Promise<void> {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;
        console.log(`[MessageQueue] Starting queue processing. ${this.queue.length} messages pending.`);

        while (this.queue.length > 0) {
            // Verificar rate limit
            this.checkRateLimit();
            if (this.messagesSentLastMinute >= ANTI_BAN_CONFIG.MAX_MESSAGES_PER_MINUTE) {
                console.log('[MessageQueue] Rate limit reached. Waiting 60 seconds...');
                await this.sleep(60000);
                this.messagesSentLastMinute = 0;
                this.lastMinuteReset = Date.now();
            }

            const message = this.queue.find(m => m.status === 'pending');
            if (!message) break;

            message.status = 'processing';
            message.attempts++;

            try {
                // Enviar com simulação de digitação
                await EvolutionService.sendTextWithTyping(
                    message.instanceName,
                    message.to,
                    message.text
                );

                message.status = 'sent';
                this.messagesSentLastMinute++;
                console.log(`[MessageQueue] Message ${message.id} sent successfully.`);

                // Remover da fila
                this.queue = this.queue.filter(m => m.id !== message.id);

                // Delay aleatório entre mensagens
                const delay = this.getRandomDelay(
                    ANTI_BAN_CONFIG.MIN_QUEUE_DELAY,
                    ANTI_BAN_CONFIG.MAX_QUEUE_DELAY
                );
                await this.sleep(delay);

            } catch (error) {
                console.error(`[MessageQueue] Error sending message ${message.id}:`, error);
                message.error = error instanceof Error ? error.message : String(error);

                if (message.attempts >= 3) {
                    message.status = 'failed';
                    this.queue = this.queue.filter(m => m.id !== message.id);
                } else {
                    message.status = 'pending';
                    // Delay maior após erro
                    await this.sleep(5000);
                }
            }
        }

        this.processing = false;
        console.log('[MessageQueue] Queue processing completed.');
    }

    /**
     * Verifica e reseta o rate limit se necessário
     */
    private checkRateLimit(): void {
        const now = Date.now();
        if (now - this.lastMinuteReset >= 60000) {
            this.messagesSentLastMinute = 0;
            this.lastMinuteReset = now;
        }
    }

    /**
     * Retorna delay aleatório entre min e max
     */
    private getRandomDelay(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Sleep helper
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Retorna status da fila
     */
    getStatus(): { pending: number; processing: number; total: number } {
        return {
            pending: this.queue.filter(m => m.status === 'pending').length,
            processing: this.queue.filter(m => m.status === 'processing').length,
            total: this.queue.length,
        };
    }

    /**
     * Limpa a fila
     */
    clear(): void {
        this.queue = [];
        console.log('[MessageQueue] Queue cleared.');
    }
}

// Instância global da fila
export const messageQueue = new MessageQueue();

// ============================================================================
// EVOLUTION SERVICE
// ============================================================================

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

            const message = errorBody.message ||
                (errorBody.error ? JSON.stringify(errorBody.error) : null) ||
                `Evolution API error: ${response.status}`;

            throw new Error(message);
        }

        return response.json() as Promise<T>;
    }

    /**
     * Sleep helper
     */
    private static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Retorna delay aleatório entre min e max
     */
    private static getRandomDelay(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Calcula duração da digitação baseado no tamanho do texto
     */
    private static calculateTypingDuration(text: string): number {
        const baseDelay = text.length * ANTI_BAN_CONFIG.TYPING_DELAY_PER_CHAR;
        const clampedDelay = Math.max(
            ANTI_BAN_CONFIG.MIN_TYPING_DELAY,
            Math.min(baseDelay, ANTI_BAN_CONFIG.MAX_TYPING_DELAY)
        );
        // Adiciona variação aleatória de ±20%
        const variation = clampedDelay * 0.2;
        return clampedDelay + this.getRandomDelay(-variation, variation);
    }

    /**
     * Envia status de "digitando" para um contato
     */
    static async sendTypingStatus(instanceName: string, to: string, duration: number = 3000): Promise<void> {
        const normalizedNumber = to.replace(/\D/g, '');
        
        try {
            // Envia status de presença "composing" (digitando)
            await this.request(`/chat/sendPresence/${instanceName}`, {
                method: 'POST',
                body: JSON.stringify({
                    number: normalizedNumber,
                    presence: 'composing',
                }),
            });

            console.log(`[Evolution API] Typing status sent to ${normalizedNumber} for ${duration}ms`);

            // Aguarda a duração da digitação
            await this.sleep(duration);

            // Envia status de presença "paused" (parou de digitar)
            await this.request(`/chat/sendPresence/${instanceName}`, {
                method: 'POST',
                body: JSON.stringify({
                    number: normalizedNumber,
                    presence: 'paused',
                }),
            });

        } catch (error) {
            // Não falhar se o status de digitação não funcionar
            console.warn('[Evolution API] Could not send typing status:', error);
        }
    }

    /**
     * Envia mensagem com simulação de digitação (RECOMENDADO)
     * Esta é a função principal para envio de mensagens com anti-banimento
     */
    static async sendTextWithTyping(
        instanceName: string,
        to: string,
        text: string,
        options: { customTypingDuration?: number } = {}
    ): Promise<EvolutionResponse> {
        const normalizedNumber = to.replace(/\D/g, '');
        
        // Calcular duração da digitação
        const typingDuration = options.customTypingDuration || this.calculateTypingDuration(text);
        
        console.log(`[Evolution API] Sending message with typing simulation (${typingDuration}ms)`);

        // 1. Enviar status de digitação
        await this.sendTypingStatus(instanceName, normalizedNumber, typingDuration);

        // 2. Pequeno delay adicional após "parar de digitar"
        await this.sleep(this.getRandomDelay(200, 500));

        // 3. Enviar a mensagem
        return this.request<EvolutionResponse>(`/message/sendText/${instanceName}`, {
            method: 'POST',
            body: JSON.stringify({
                number: normalizedNumber,
                text: text,
            }),
        });
    }

    /**
     * Adiciona mensagem à fila para envio posterior
     * Use para disparos em massa ou quando precisar controlar o rate
     */
    static queueMessage(
        instanceName: string,
        to: string,
        text: string,
        priority: 'high' | 'normal' | 'low' = 'normal'
    ): string {
        return messageQueue.add({
            instanceName,
            to,
            text,
            priority,
        });
    }

    /**
     * Envia múltiplas mensagens em massa com proteção anti-banimento
     * Inclui delays progressivos e pausas automáticas
     */
    static async sendBulkMessages(
        instanceName: string,
        messages: Array<{ to: string; text: string }>,
        options: {
            onProgress?: (sent: number, total: number, current: { to: string }) => void;
            onError?: (error: Error, message: { to: string; text: string }) => void;
        } = {}
    ): Promise<{ sent: number; failed: number; errors: Array<{ to: string; error: string }> }> {
        const results = {
            sent: 0,
            failed: 0,
            errors: [] as Array<{ to: string; error: string }>,
        };

        console.log(`[Evolution API] Starting bulk send of ${messages.length} messages`);

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];

            try {
                // Enviar com simulação de digitação
                await this.sendTextWithTyping(instanceName, message.to, message.text);
                results.sent++;

                // Callback de progresso
                if (options.onProgress) {
                    options.onProgress(results.sent, messages.length, { to: message.to });
                }

                // Pausa longa após X mensagens
                if (results.sent > 0 && results.sent % ANTI_BAN_CONFIG.BULK_PAUSE_AFTER === 0) {
                    console.log(`[Evolution API] Taking a break after ${results.sent} messages...`);
                    await this.sleep(ANTI_BAN_CONFIG.BULK_PAUSE_DURATION);
                }

                // Delay entre mensagens (maior para bulk)
                if (i < messages.length - 1) {
                    const delay = this.getRandomDelay(
                        ANTI_BAN_CONFIG.MIN_BULK_DELAY,
                        ANTI_BAN_CONFIG.MAX_BULK_DELAY
                    );
                    await this.sleep(delay);
                }

            } catch (error) {
                results.failed++;
                const errorMessage = error instanceof Error ? error.message : String(error);
                results.errors.push({ to: message.to, error: errorMessage });

                console.error(`[Evolution API] Failed to send to ${message.to}:`, errorMessage);

                // Callback de erro
                if (options.onError) {
                    options.onError(error instanceof Error ? error : new Error(errorMessage), message);
                }

                // Delay maior após erro
                await this.sleep(5000);
            }
        }

        console.log(`[Evolution API] Bulk send completed. Sent: ${results.sent}, Failed: ${results.failed}`);
        return results;
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
     * Send a text message (SEM simulação de digitação)
     * Use sendTextWithTyping para envio com anti-banimento
     * @deprecated Use sendTextWithTyping instead
     */
    static async sendText(instanceName: string, to: string, text: string): Promise<EvolutionResponse> {
        // Agora usa sendTextWithTyping por padrão para proteção anti-banimento
        return this.sendTextWithTyping(instanceName, to, text);
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

    /**
     * Retorna status da fila de mensagens
     */
    static getQueueStatus(): { pending: number; processing: number; total: number } {
        return messageQueue.getStatus();
    }

    /**
     * Limpa a fila de mensagens
     */
    static clearQueue(): void {
        messageQueue.clear();
    }
}
