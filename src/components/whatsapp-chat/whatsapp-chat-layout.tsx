'use client'

import { useState, useEffect } from 'react'
import { WhatsAppConversationList } from './whatsapp-conversation-list'
import { WhatsAppChatArea } from './whatsapp-chat-area'
import { WhatsAppEmptyState } from './whatsapp-empty-state'
import { MessageSquare } from 'lucide-react'
import { getWhatsAppMessages, sendWhatsAppMessage } from '@/actions/whatsapp'
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
}

export function WhatsAppChatLayout({
    contacts: initialContacts,
    instanceName,
    isConnected
}: WhatsAppChatLayoutProps) {
    const [contacts, setContacts] = useState<WhatsAppContact[]>(initialContacts)
    const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null)
    const [messages, setMessages] = useState<WhatsAppMessage[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Update contacts when initialContacts changes
    useEffect(() => {
        setContacts(initialContacts)
    }, [initialContacts])

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
                toast.success('Mensagem enviada!')
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
