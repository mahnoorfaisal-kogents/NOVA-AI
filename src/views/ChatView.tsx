import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from '@/lib/router';
import {
  Send, Loader2, Plus, MessageSquare, Pin, Archive, Trash2,
  MoreHorizontal, ArrowLeft, Copy, RefreshCw, AlertCircle, ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { providerLabel, type ChatMessage } from '@/lib/ai/providers';
import { orchestrateChat, routeRequest } from '@/lib/ai/orchestrator';
import { buildSystemPrompt } from '@/lib/ai/personality';
import { getModelsForPlan } from '@/lib/models';
import { getPlanLimits } from '@/lib/plans';
import type { Conversation, Message, PersonalityType, ModelInfo } from '@/types';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';

export function ChatView() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showConvMenu, setShowConvMenu] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const locationState = (history.state as { initialMessage?: string }) || {};

  const availableModels = profile ? getModelsForPlan(profile.plan) : [];
  const limits = profile ? getPlanLimits(profile.plan) : null;

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('updated_at', { ascending: false });
    setConversations(data as Conversation[] ?? []);
  }, [user]);

  const loadMessages = useCallback(async (convId: string) => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    setMessages(data as Message[] ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    } else {
      setMessages([]);
      setLoading(false);
    }
  }, [conversationId, loadMessages]);

  useEffect(() => {
    if (locationState.initialMessage && !conversationId && !sending) {
      setInput(locationState.initialMessage);
      inputRef.current?.focus();
    }
  }, [locationState.initialMessage, conversationId, sending]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createConversation = async (title?: string): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: title || 'New Conversation' })
      .select('*')
      .maybeSingle();
    if (error || !data) return null;
    await loadConversations();
    return data.id;
  };

  const recordUsage = async (model: string, provider: string, tokensIn: number, tokensOut: number) => {
    if (!user) return;
    await supabase.from('usage_records').insert({
      user_id: user.id,
      resource_type: 'chat_message',
      model,
      provider,
      tokens_input: tokensIn,
      tokens_output: tokensOut,
    });
  };

  const recordActivity = async (title: string, entityType: string, entityId: string) => {
    if (!user) return;
    await supabase.from('activity_events').insert({
      user_id: user.id,
      event_type: 'created',
      entity_type: entityType,
      entity_id: entityId,
      title,
    });
  };

  const handleSend = async () => {
    if (!input.trim() || !user || sending) return;

    const messageText = input.trim();
    setInput('');
    setError(null);
    setSending(true);

    let convId = conversationId ?? undefined;
    if (!convId) {
      const title = messageText.slice(0, 50) + (messageText.length > 50 ? '...' : '');
      convId = (await createConversation(title)) ?? undefined;
      if (!convId) {
        setError('Failed to create conversation');
        setSending(false);
        return;
      }
      navigate(`/chat/${convId}`, { replace: true });
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: convId,
      user_id: user.id,
      role: 'user',
      content: messageText,
      model: null,
      provider: null,
      status: 'sent',
      parent_message_id: null,
      branch_id: null,
      tokens: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    const { error: insertError } = await supabase.from('messages').insert({
      conversation_id: convId,
      user_id: user.id,
      role: 'user',
      content: messageText,
      status: 'sent',
    });
    if (insertError) {
      setError('Failed to save message');
      setSending(false);
      return;
    }

    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);

    const decision = routeRequest(selectedModel, profile?.plan ?? 'free', messageText);
    const model = decision.model;

    const chatMessages: ChatMessage[] = [...messages, { role: 'user' as const, content: messageText }].map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    const systemPrompt = buildSystemPrompt({
      personality: 'professional' as PersonalityType,
    });

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: convId,
      user_id: user.id,
      role: 'assistant',
      content: '',
      model: model.id,
      provider: model.provider,
      status: 'streaming',
      parent_message_id: null,
      branch_id: null,
      tokens: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    abortRef.current = new AbortController();
    const response = await sendChat(chatMessages, model, {
      systemPrompt,
      signal: abortRef.current.signal,
    });

    if (response.error) {
      setError(response.error);
      setMessages((prev) => prev.map((m) =>
        m.id === assistantMessage.id ? { ...m, content: '', status: 'error' } : m
      ));
      const { error: dbError } = await supabase.from('messages').insert({
        conversation_id: convId,
        user_id: user.id,
        role: 'assistant',
        content: '',
        model: model.id,
        provider: model.provider,
        status: 'error',
      });
      if (!dbError) {
        recordActivity(`Chat error in conversation`, 'conversation', convId);
      }
    } else {
      setMessages((prev) => prev.map((m) =>
        m.id === assistantMessage.id ? { ...m, content: response.content, status: 'complete', tokens: response.tokensOutput } : m
      ));

      await supabase.from('messages').insert({
        conversation_id: convId,
        user_id: user.id,
        role: 'assistant',
        content: response.content,
        model: model.id,
        provider: model.provider,
        status: 'complete',
        tokens: response.tokensOutput,
      });

      await recordUsage(model.id, model.provider, response.tokensInput, response.tokensOutput);
      await recordActivity(`Sent message in conversation`, 'conversation', convId);
    }

    await loadConversations();
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    navigate('/chat');
    setMessages([]);
    setError(null);
  };

  const handleDeleteConversation = async (id: string) => {
    await supabase.from('conversations').delete().eq('id', id);
    await loadConversations();
    if (conversationId === id) navigate('/chat');
  };

  const handleTogglePin = async (id: string, pinned: boolean) => {
    await supabase.from('conversations').update({ pinned: !pinned }).eq('id', id);
    await loadConversations();
  };

  const handleArchive = async (id: string) => {
    await supabase.from('conversations').update({ archived: true }).eq('id', id);
    await loadConversations();
    if (conversationId === id) navigate('/chat');
  };

  const handleRegenerate = async () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;
    setMessages((prev) => {
      const lastAssistantIdx = [...prev].reverse().findIndex((m) => m.role === 'assistant');
      if (lastAssistantIdx === -1) return prev;
      const actualIdx = prev.length - 1 - lastAssistantIdx;
      return prev.filter((_, i) => i !== actualIdx);
    });
    setInput(lastUserMsg.content);
    setTimeout(() => handleSend(), 100);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Conversation list */}
      <div className="w-64 glass border-r border-subtle flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-subtle">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 nova-gradient text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-tertiary text-sm px-4">
              No conversations yet. Start a new chat to begin.
            </div>
          ) : (
            conversations.map((conv) => (
              <div key={conv.id} className="relative group mb-0.5">
                <button
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                    conversationId === conv.id
                      ? 'bg-electric-500/15 text-electric-300'
                      : 'text-secondary hover:text-primary hover:bg-tertiary'
                  }`}
                >
                  {conv.pinned && <Pin className="w-3 h-3 flex-shrink-0" />}
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-sm truncate">{conv.title}</span>
                </button>
                <button
                  onClick={() => setShowConvMenu(showConvMenu === conv.id ? null : conv.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-tertiary transition-all"
                >
                  <MoreHorizontal className="w-3.5 h-3.5 text-tertiary" />
                </button>
                {showConvMenu === conv.id && (
                  <div className="absolute right-2 top-full mt-1 glass-strong rounded-lg shadow-xl py-1 min-w-[140px] z-50">
                    <button onClick={() => handleTogglePin(conv.id, conv.pinned)} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-secondary hover:text-primary hover:bg-tertiary">
                      <Pin className="w-3 h-3" /> {conv.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button onClick={() => handleArchive(conv.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-secondary hover:text-primary hover:bg-tertiary">
                      <Archive className="w-3 h-3" /> Archive
                    </button>
                    <button onClick={() => handleDeleteConversation(conv.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-error-400 hover:bg-error-500/10">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-12 border-b border-subtle flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {conversationId && (
              <button onClick={() => navigate('/chat')} className="p-1 rounded hover:bg-tertiary text-secondary">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <span className="text-sm font-medium text-primary truncate">
              {conversations.find((c) => c.id === conversationId)?.title || 'New Conversation'}
            </span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-tertiary border border-subtle rounded-lg text-xs text-secondary hover:text-primary hover:border-default transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-electric-500" />
              {availableModels.find((m) => m.id === selectedModel)?.display_name || 'Auto'}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showModelMenu && (
              <div className="absolute right-0 top-full mt-1 glass-strong rounded-lg shadow-xl py-1 min-w-[240px] z-50">
                <button
                  onClick={() => { setSelectedModel(null); setShowModelMenu(false); }}
                  className="w-full flex flex-col items-start gap-0.5 px-3 py-2 text-xs text-secondary hover:text-primary hover:bg-tertiary"
                >
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-electric-500" /> Auto</span>
                  <span className="text-tertiary pl-4">NOVA picks the best mode for each message.</span>
                </button>
                {availableModels.filter((m) => m.id !== 'nova-auto').map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedModel(m.id); setShowModelMenu(false); }}
                    className={`w-full flex flex-col items-start gap-0.5 px-3 py-2 text-xs hover:bg-tertiary ${selectedModel === m.id ? 'text-electric-400' : 'text-secondary hover:text-primary'}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${m.provider === 'ollama' ? 'bg-success-500' : 'bg-electric-500'}`} />
                      {m.display_name}
                    </span>
                    {m.description && <span className="text-tertiary pl-4 text-left">{m.description}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-electric-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl nova-gradient flex items-center justify-center mb-4 glow-blue animate-orb-float">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-primary mb-2">Start a conversation</h2>
              <p className="text-sm text-secondary max-w-md">
                Ask NOVA anything. Your conversations are saved and you can switch between them anytime.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'w-full'}`}>
                    <div className={`rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-electric-500 text-white'
                        : 'glass text-primary'
                    }`}>
                      {msg.status === 'error' ? (
                        <div className="flex items-center gap-2 text-error-400">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Failed to generate response. {error && `(${error})`}</span>
                        </div>
                      ) : msg.status === 'streaming' && !msg.content ? (
                        <div className="flex items-center gap-2 text-secondary">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">NOVA is thinking...</span>
                        </div>
                      ) : msg.role === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="markdown-content text-sm">
                          <MarkdownRenderer content={msg.content} />
                        </div>
                      )}
                    </div>
                    {msg.role === 'assistant' && msg.status === 'complete' && (
                      <div className="flex items-center gap-2 mt-1.5 px-2">
                        <button onClick={() => handleCopy(msg.content)} className="p-1 text-tertiary hover:text-secondary transition-colors" title="Copy">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={handleRegenerate} className="p-1 text-tertiary hover:text-secondary transition-colors" title="Regenerate">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs text-tertiary ml-auto">
                          {providerLabel(msg.provider)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-subtle p-4 flex-shrink-0">
          {error && (
            <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-error-500/10 border border-error-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-error-400 flex-shrink-0" />
              <p className="text-xs text-error-400 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-error-400 hover:text-error-300 text-xs">Dismiss</button>
            </div>
          )}
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 px-4 py-3 glass-strong rounded-xl text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500/50 focus:ring-2 focus:ring-electric-500/20 transition-all resize-none text-sm max-h-32"
              style={{ minHeight: '48px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="p-3 nova-gradient text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-tertiary text-center mt-2">
            NOVA may make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
