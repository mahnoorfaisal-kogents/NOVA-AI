import { useState, useEffect, useCallback } from 'react';
import { Plus, Brain, Trash2, Archive, Search, Tag, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Memory, MemoryCategory } from '@/types';

const CATEGORIES: MemoryCategory[] = ['personal', 'preferences', 'work', 'technical', 'projects', 'goals', 'instructions', 'important_facts', 'temporary'];

const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  personal: 'Personal',
  preferences: 'Preferences',
  work: 'Work',
  technical: 'Technical',
  projects: 'Projects',
  goals: 'Goals',
  instructions: 'Instructions',
  important_facts: 'Important Facts',
  temporary: 'Temporary',
};

export function MemoryView() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('personal');
  const [newImportance, setNewImportance] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<MemoryCategory | 'all'>('all');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('memories').select('*').eq('user_id', user.id).eq('archived', false).order('updated_at', { ascending: false });
    setMemories(data as Memory[] ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newContent.trim()) return;
    const { data } = await supabase.from('memories').insert({
      user_id: user.id,
      content: newContent.trim(),
      category: newCategory,
      importance: newImportance,
      source: 'manual',
      user_confirmed: true,
    }).select('*').maybeSingle();
    if (data) {
      setMemories((prev) => [data as Memory, ...prev]);
      setNewContent('');
      setNewCategory('personal');
      setNewImportance(5);
      setShowCreate(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('memories').delete().eq('id', id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleArchive = async (id: string) => {
    await supabase.from('memories').update({ archived: true }).eq('id', id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const filtered = memories.filter((m) => {
    const matchesSearch = !searchQuery || m.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Brain className="w-6 h-6 text-warning-400" /> Memory
          </h1>
          <p className="text-sm text-secondary mt-1">NOVA's long-term memory across all your conversations</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 nova-gradient text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Memory
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 glass-strong rounded-xl p-4 space-y-3 animate-fade-in-up">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="What should NOVA remember?"
            rows={3}
            className="w-full px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500 text-sm resize-none"
            autoFocus
          />
          <div className="flex gap-2 items-center">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
              className="px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary text-sm focus:outline-none focus:border-electric-500"
            >
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-secondary">Importance:</span>
              <input
                type="range"
                min={1}
                max={10}
                value={newImportance}
                onChange={(e) => setNewImportance(Number(e.target.value))}
                className="w-24 accent-electric-500"
              />
              <span className="text-xs text-primary w-6">{newImportance}</span>
            </div>
            <button type="submit" className="px-4 py-2 nova-gradient text-white rounded-lg text-sm font-medium hover:opacity-90">Save</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-tertiary text-secondary rounded-lg text-sm hover:text-primary">Cancel</button>
          </div>
        </form>
      )}

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="w-full pl-10 pr-3 py-2 glass rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500/50 text-sm"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as MemoryCategory | 'all')}
          className="px-3 py-2 glass rounded-lg text-primary text-sm focus:outline-none focus:border-electric-500/50"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((cat) => <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-20 shimmer-bg rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Brain className="w-12 h-12 text-tertiary mx-auto mb-3" />
          <p className="text-secondary text-sm">{searchQuery || filterCategory !== 'all' ? 'No memories match your filters.' : 'No memories yet. Add one to help NOVA remember.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((mem) => (
            <div key={mem.id} className="group glass rounded-xl p-4 hover:border-electric-500/20 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary mb-2">{mem.content}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-electric-500/15 text-electric-300 rounded flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {CATEGORY_LABELS[mem.category]}
                    </span>
                    <span className="text-xs text-tertiary">Importance: {mem.importance}/10</span>
                    <span className="text-xs text-tertiary">Confidence: {(mem.confidence * 100).toFixed(0)}%</span>
                    {mem.user_confirmed && (
                      <span className="text-xs text-success-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Confirmed
                      </span>
                    )}
                    <span className="text-xs text-tertiary flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(mem.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleArchive(mem.id)} className="p-1.5 text-tertiary hover:text-warning-400 transition-colors" title="Archive">
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(mem.id)} className="p-1.5 text-tertiary hover:text-error-400 transition-colors" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
