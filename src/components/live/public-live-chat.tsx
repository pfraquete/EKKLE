'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, MessageSquareOff, Pin, ShieldCheck, User, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { LiveChatMessage, getPublicChatMessages } from '@/actions/live-streams'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

type PublicLiveChatProps = {
  streamId: string
  churchId: string
  chatEnabled: boolean
  isLive: boolean
}

export function PublicLiveChat({ streamId, churchId, chatEnabled, isLive }: PublicLiveChatProps) {
  const [messages, setMessages] = useState<LiveChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      const initialMessages = await getPublicChatMessages(streamId, churchId)
      setMessages(initialMessages)
    }
    loadMessages()
  }, [streamId, churchId])

  // Subscribe to realtime updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`public-live-chat-${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `live_stream_id=eq.${streamId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('live_chat_messages')
            .select(`
              *,
              profile:profiles(id, full_name, photo_url, role)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => [...prev, data as LiveChatMessage])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `live_stream_id=eq.${streamId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id
                ? { ...msg, ...payload.new }
                : msg
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [streamId])

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [messages])

  // Filter out deleted messages
  const visibleMessages = messages.filter((msg) => !msg.is_deleted)
  const pinnedMessages = visibleMessages.filter((msg) => msg.is_pinned)

  if (!chatEnabled) {
    return (
      <div className="bg-card rounded-[2.5rem] border border-border/50 shadow-2xl h-full flex flex-col">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-2">
            <MessageSquareOff className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-black text-xs uppercase tracking-[0.2em] text-foreground">
              Chat
            </h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <MessageSquareOff className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Chat desabilitado</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-[2.5rem] border border-border/50 shadow-2xl h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h2 className="font-black text-xs uppercase tracking-[0.2em] text-foreground">
              Chat ao Vivo
            </h2>
          </div>
          <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">
            {visibleMessages.length} mensagens
          </div>
        </div>
      </div>

      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <div className="p-4 border-b border-border/50 bg-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <Pin className="w-3 h-3 text-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-primary">
              Fixadas
            </span>
          </div>
          {pinnedMessages.map((msg) => (
            <div key={msg.id} className="bg-background/50 rounded-xl p-3 mb-2 last:mb-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-xs text-foreground">
                  {msg.profile?.full_name || 'Anonimo'}
                </span>
                {msg.profile?.role === 'PASTOR' && (
                  <ShieldCheck className="w-3 h-3 text-primary" />
                )}
              </div>
              <p className="text-sm text-foreground/90">{msg.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
      >
        {visibleMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground/60 text-sm">
              Nenhuma mensagem ainda
            </p>
          </div>
        ) : (
          visibleMessages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  msg.profile?.role === 'PASTOR'
                    ? 'bg-primary text-primary-foreground'
                    : msg.profile?.role === 'LEADER'
                    ? 'bg-amber-500/20 text-amber-500'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {msg.profile?.photo_url ? (
                  <img
                    src={msg.profile.photo_url}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : msg.profile?.role === 'PASTOR' ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>

              {/* Message */}
              <div className="flex-1">
                <div className="bg-muted rounded-2xl px-4 py-2">
                  {/* Name & Badge */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-xs text-foreground">
                      {msg.profile?.full_name || 'Anonimo'}
                    </span>
                    {msg.profile?.role === 'PASTOR' && (
                      <span className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        Pastor
                      </span>
                    )}
                    {msg.profile?.role === 'LEADER' && (
                      <span className="text-xs font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        Lider
                      </span>
                    )}
                  </div>

                  {/* Message Text */}
                  <p className="text-sm text-foreground/90 break-words">
                    {msg.message}
                  </p>

                  {/* Time */}
                  <span className="text-xs mt-1 block text-muted-foreground/60">
                    {formatDistanceToNow(new Date(msg.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Login CTA */}
      <div className="p-4 border-t border-border/50 bg-muted/30">
        <div className="flex items-center gap-3 justify-center">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline font-medium">
              Faca login
            </Link>{' '}
            para participar do chat
          </p>
        </div>
      </div>
    </div>
  )
}
