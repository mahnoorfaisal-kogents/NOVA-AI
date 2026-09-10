import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, MessageSquare, FolderKanban, CheckSquare, Brain, Bot, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  created_at: string;
}

export function SearchView() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!user || !q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const like = `%${q}%`;
    const [conv, msg, proj, task, mem, agent, auto] = await Promise.all([
      supabase.from('conversations').select('id, title, created_at').eq('user_id', user.id).ilike('title', like).limit(10),
      supabase.from('messages').select('id, content, created_at, conversation_id').eq('user_id', user.id).ilike('content', like).limit(10),
      supabase.from('projects').select('id, name, description, created_at').eq('user_id', user.id).ilike('name', like).limit(5),
      supabase.from('tasks').select('id, title, created_at').eq('user_id', user.id).ilike('title', like).limit(10),
      supabase.from('memories').select('id, content, category, created_at').eq('user_id', user.id).ilike('content', like).limit(10),
      supabase.from('agents').select('id, name, type, created_at').eq('user_id', user.id).ilike('name', like).limit(5),
      supabase.from('automations').select('id, name, created_at').eq('user_id', user.id).ilike('name', like).limit(5),
    ]);

    const all: SearchResult[] = [
      ...((conv.data ?? []).map((r) => ({ type: 'conversation', id: r.id, title: r.title, created_at: r.created_at }))),
      ...((msg.data ?? []).map((r) => ({ type: 'message', id: r.id, title: r.content.slice(0, 80) + (r.content.length > 80 ? '...' : ''), subtitle: 'In conversation', created_at: r.created_at }))),
      ...((proj.data ?? []).map((r) => ({ type: 'project', id: r.id, title: r.name, subtitle: r.description ?? undefined, created_at: r.created_at }))),
      ...((task.data ?? []).map((r) => ({ type: 'task', id: r.id, title: r.title, created_at: r.created_at }))),
      ...((mem.data ?? []).map((r) => ({ type: 'memory', id: r.id, title: r.content.slice(0, 80) + (r.content.length > 80 ? '...' : ''), subtitle: r.category, created_at: r.created_at }))),
      ...((agent.data ?? []).map((r) => ({ type: 'agent', id: r.id, title: r.name, subtitle: r.type, created_at: r.created_at }))),
      ...((auto.data ?? []).map((r) => ({ type: 'automation', id: r.id, title: r.name, created_at: r.created_at }))),
    ];

    setResults(all);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const iconFor = (type: string) => {
    const icons: Record<string, typeof Search> = {
      conversation: MessageSquare,
      message: MessageSquare,
      project: FolderKanban,
      task: CheckSquare,
      memory: Brain,
      agent: Bot,
      automation: Zap,
    };
    return icons[type] ?? FileText;
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-primary mb-1 flex items-center gap-2">
        <Search className="w-6 h-6 text-electric-400" /> Universal Search
      </h1>
      <p className="text-sm text-secondary mb-6">Search across all your conversations, projects, tasks, memories, and more</p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search everything..."
          className="w-full pl-10 pr-4 py-3 glass-strong rounded-xl text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500/50 focus:ring-2 focus:ring-electric-500/20 text-sm"
          autoFocus
        />
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 shimmer-bg rounded-lg" />)}</div>
      ) : query.trim() && results.length === 0 ? (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-tertiary mx-auto mb-3" />
          <p className="text-secondary text-sm">No results found for "{query}"</p>
        </div>
      ) : !query.trim() ? (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-tertiary mx-auto mb-3" />
          <p className="text-secondary text-sm">Start typing to search across everything in NOVA</p>
        </div>
      ) : (
        <div className="space-y-1">
          {results.map((r) => {
            const Icon = iconFor(r.type);
            return (
              <div key={`${r.type}-${r.id}`} className="flex items-center gap-3 glass rounded-lg px-4 py-3 hover:border-electric-500/20 transition-colors">
                <Icon className="w-4 h-4 text-tertiary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary truncate">{r.title}</p>
                  {r.subtitle && <p className="text-xs text-tertiary">{r.subtitle}</p>}
                </div>
                <span className="text-xs text-tertiary capitalize">{r.type}</span>
                <span className="text-xs text-tertiary">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
