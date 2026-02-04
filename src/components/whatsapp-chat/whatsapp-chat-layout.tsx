'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { WhatsAppConversationList } from './whatsapp-conversation-list'
import { WhatsAppChatArea } from './whatsapp-chat-area'
import { WhatsAppEmptyState } from './whatsapp-empty-state'
import { MessageSquare, Wifi, WifiOff } from 'lucide-react'
import { getWhatsAppMessages, sendWhatsAppMessage, getWhatsAppChats } from '@/actions/whatsapp'
import { useRealtimeMessages, RealtimeMessage } from '@/hooks/use-realtime-messages'
import { toast } from 'sonner'

export interface WhatsAppContact {
    id: string
    remoteJid?: string
    name: string
    phone: string
    photo_url?: string | null
    last_message?: string
    last_message_time?: string
    unread_count?: number
    is_online?: boolean
}

export interface WhatsAppMessage {
    id: string
    contact_id: string
    content: string
    is_from_me: boolean
    timestamp: string
    status: 'sent' | 'delivered' | 'read'
    type: 'text' | 'image' | 'audio' | 'document'
}

interface WhatsAppChatLayoutProps {
    contacts: WhatsAppContact[]
    instanceName: string
    isConnected: boolean
    churchId?: string
}

export function WhatsAppChatLayout({
    contacts: initialContacts,
    instanceName,
    isConnected,
    churchId
}: WhatsAppChatLayoutProps) {
    const [contacts, setContacts] = useState<WhatsAppContact[]>(initialContacts)
    const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null)
    const [messages, setMessages] = useState<WhatsAppMessage[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const selectedContactRef = useRef<WhatsAppContact | null>(null)

    // Keep ref in sync with state
    useEffect(() => {
        selectedContactRef.current = selectedContact
    }, [selectedContact])

    // Handle new realtime messages
    const handleNewRealtimeMessage = useCallback((realtimeMsg: RealtimeMessage) => {
        console.log('[Realtime] Processing new message:', realtimeMsg)
        
        // Convert realtime message to our format
        const newMessage: WhatsAppMessage = {
            id: realtimeMsg.id,
            contact_id: realtimeMsg.direction === 'inbound' ? realtimeMsg.from_number : realtimeMsg.to_number,
            content: realtimeMsg.content,
            is_from_me: realtimeMsg.direction === 'outbound',
            timestamp: realtimeMsg.sent_at,
            status: 'delivered',
            type: realtimeMsg.message_type as any || 'text'
        }

        // Determine the contact phone number
        const contactPhone = realtimeMsg.direction === 'inbound' 
            ? realtimeMsg.from_number 
            : realtimeMsg.to_number

        // Check if this message is for the currently selected contact
        const currentContact = selectedContactRef.current
        if (currentContact) {
            const currentContactPhone = currentContact.phone.replace(/\D/g, '')
            if (contactPhone === currentContactPhone || contactPhone.endsWith(currentContactPhone)) {
                // Add message to current conversation
                setMessages(prev => {
                    // Check if message already exists (avoid duplicates)
                    if (prev.some(m => m.id === newMessage.id)) {
                        return prev
                    }
                    return [...prev, newMessage]
                })
            }
        }

        // Update contacts list with new last message
        setContacts(prev => {
            const updatedContacts = prev.map(contact => {
                const contactPhoneClean = contact.phone.replace(/\D/g, '')
                if (contactPhone === contactPhoneClean || contactPhone.endsWith(contactPhoneClean)) {
                    return {
                        ...contact,
                        last_message: realtimeMsg.content,
                        last_message_time: realtimeMsg.sent_at,
                        unread_count: realtimeMsg.direction === 'inbound' && 
                            (!currentContact || currentContact.phone.replace(/\D/g, '') !== contactPhoneClean)
                            ? (contact.unread_count || 0) + 1 
                            : contact.unread_count
                    }
                }
                return contact
            })

            // Sort by last message time
            return updatedContacts.sort((a, b) => {
                const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0
                const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0
                return timeB - timeA
            })
        })

        // Show notification for incoming messages
        if (realtimeMsg.direction === 'inbound') {
            const senderContact = contacts.find(c => {
                const contactPhoneClean = c.phone.replace(/\D/g, '')
                return contactPhone === contactPhoneClean || contactPhone.endsWith(contactPhoneClean)
            })
            
            // Only show toast if not viewing that conversation
            const currentContact = selectedContactRef.current
            if (!currentContact || currentContact.phone.replace(/\D/g, '') !== contactPhone) {
                toast.info(`Nova mensagem de ${senderContact?.name || contactPhone}`, {
                    description: realtimeMsg.content.substring(0, 50) + (realtimeMsg.content.length > 50 ? '...' : '')
                })
            }
        }
    }, [contacts])

    // Setup realtime subscription
    const { isConnected: isRealtimeConnected } = useRealtimeMessages({
        churchId: churchId || null,
        onNewMessage: handleNewRealtimeMessage
    })

    // Update contacts when initialContacts changes
    useEffect(() => {
        setContacts(initialContacts)
    }, [initialContacts])

    // Refresh contacts periodically (every 30 seconds as fallback)
    useEffect(() => {
        if (!isConnected) return

        const refreshContacts = async () => {
            try {
                const { data: chats } = await getWhatsAppChats()
                if (chats && chats.length > 0) {
                    setContacts(chats)
                }
            } catch (error) {
                console.error('Error refreshing contacts:', error)
            }
        }

        const interval = setInterval(refreshContacts, 30000)
        return () => clearInterval(interval)
    }, [isConnected])

    // Filter contacts based on search
    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone.includes(searchQuery)
    )

    // Handle contact selection
    const handleSelectContact = async (contact: WhatsAppContact) => {
        setSelectedContact(contact)
        setIsLoading(true)
        
        try {
            // Fetch real messages from Evolution API
            const remoteJid = contact.remoteJid || `${contact.phone.replace(/\D/g, '')}@s.whatsapp.net`
            const { data: fetchedMessages, error } = await getWhatsAppMessages(remoteJid)
            
            if (error) {
                console.error('Error fetching messages:', error)
                toast.error('Erro ao carregar mensagens')
                setMessages([])
            } else {
                setMessages(fetchedMessages || [])
            }
        } catch (err) {
            console.error('Error fetching messages:', err)
            toast.error('Erro ao carregar mensagens')
            setMessages([])
        } finally {
            setIsLoading(false)
        }

        // Mark as read
        setContacts(prev => prev.map(c => 
            c.id === contact.id ? { ...c, unread_count: 0 } : c
        ))
    }

    // Handle sending message
    const handleSendMessage = async (content: string) => {
        if (!selectedContact || !content.trim()) return

        const newMessage: WhatsAppMessage = {
            id: Date.now().toString(),
            contact_id: selectedContact.id,
            content: content.trim(),
            is_from_me: true,
            timestamp: new Date().toISOString(),
            status: 'sent',
            type: 'text'
        }

        // Optimistically add message to UI
        setMessages(prev => [...prev, newMessage])

        // Update contact's last message
        setContacts(prev => prev.map(c => 
            c.id === selectedContact.id 
                ? { ...c, last_message: content.trim(), last_message_time: new Date().toISOString() }
                : c
        ))

        try {
            // Send via Evolution API
            const remoteJid = selectedContact.remoteJid || `${selectedContact.phone.replace(/\D/g, '')}@s.whatsapp.net`
            const { success, error } = await sendWhatsAppMessage(remoteJid, content.trim())
            
            if (success) {
                // Update message status to delivered
                setMessages(prev => prev.map(m => 
                    m.id === newMessage.id ? { ...m, status: 'delivered' } : m
                ))
            } else {
                toast.error(error || 'Erro ao enviar mensagem')
                // Remove failed message from UI
                setMessages(prev => prev.filter(m => m.id !== newMessage.id))
            }
        } catch (err) {
            console.error('Error sending message:', err)
            toast.error('Erro ao enviar mensagem')
            // Remove failed message from UI
            setMessages(prev => prev.filter(m => m.id !== newMessage.id))
        }
    }

    if (!isConnected) {
        return (
            <div className="h-[calc(100vh-16rem)] bg-[#111b21] rounded-2xl border border-[#2a3942] overflow-hidden flex items-center justify-center">
                <div className="text-center p-8">
                    <div className="w-20 h-20 rounded-full bg-[#00a884]/20 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-10 h-10 text-[#00a884]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#e9edef] mb-2">WhatsApp Desconectado</h3>
                    <p className="text-[#8696a0] max-w-sm">
                        Conecte seu WhatsApp na aba "Conexão WhatsApp" para visualizar as conversas.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-16rem)] bg-[#111b21] rounded-2xl border border-[#2a3942] overflow-hidden">
            {/* Realtime status indicator */}
            <div className="absolute top-2 right-2 z-10">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                    isRealtimeConnected 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                    {isRealtimeConnected ? (
                        <>
                            <Wifi className="w-3 h-3" />
                            <span>Tempo real</span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-3 h-3" />
                            <span>Conectando...</span>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-[380px_1fr] h-full">
                {/* Left: Conversation List */}
                <div className="border-r border-[#2a3942] overflow-hidden">
                    <WhatsAppConversationList
                        contacts={filteredContacts}
                        selectedContact={selectedContact}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onSelectContact={handleSelectContact}
                    />
                </div>

                {/* Right: Chat Area */}
                <div className="overflow-hidden bg-[#0b141a]">
                    {selectedContact ? (
                        <WhatsAppChatArea
                            contact={selectedContact}
                            messages={messages}
                            isLoading={isLoading}
                            onSendMessage={handleSendMessage}
                        />
                    ) : (
                        <WhatsAppEmptyState />
                    )}
                </div>
            </div>
        </div>
    )
}
