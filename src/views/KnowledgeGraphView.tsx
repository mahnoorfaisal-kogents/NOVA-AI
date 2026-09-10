import { useState, useEffect, useCallback } from 'react';
import { Network, Trash2, Plus, User, Brain, FolderKanban, FileText, MessageSquare, CheckSquare, Bot, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { KnowledgeEntity } from '@/types';

const ENTITY_ICONS: Record<string, typeof User> = {
  user: User,
  memory: Brain,
  project: FolderKanban,
  file: FileText,
  conversation: MessageSquare,
  task: CheckSquare,
  agent: Bot,
  automation: Zap,
};

export function KnowledgeGraphView() {
  const { user } = useAuth();
  const [entities, setEntities] = useState<KnowledgeEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('concept');
  const [newDesc, setNewDesc] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('knowledge_entities').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setEntities(data as KnowledgeEntity[] ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    const { data } = await supabase.from('knowledge_entities').insert({
      user_id: user.id,
      entity_type: newType,
      name: newName.trim(),
      description: newDesc.trim() || null,
      relationships: {},
      metadata: {},
    }).select('*').maybeSingle();
    if (data) {
      setEntities((prev) => [data as KnowledgeEntity, ...prev]);
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('knowledge_entities').delete().eq('id', id);
    setEntities((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Network className="w-6 h-6 text-electric-400" /> Knowledge Graph
          </h1>
          <p className="text-sm text-secondary mt-1">Connect and explore relationships between your knowledge entities</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 nova-gradient text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Entity
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 glass-strong rounded-xl p-5 space-y-3 animate-fade-in-up">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Entity name"
            className="w-full px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500 text-sm"
            autoFocus
          />
          <input
            type="text"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="Entity type (e.g. concept, person, technology)"
            className="w-full px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500 text-sm"
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500 text-sm resize-none"
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 nova-gradient text-white rounded-lg text-sm font-medium hover:opacity-90">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-tertiary text-secondary rounded-lg text-sm hover:text-primary">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-24 shimmer-bg rounded-xl" />)}
        </div>
      ) : entities.length === 0 ? (
        <div className="text-center py-16">
          <Network className="w-12 h-12 text-tertiary mx-auto mb-3" />
          <p className="text-secondary text-sm">No knowledge entities yet. Add entities to build your personal knowledge graph.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {entities.map((entity) => {
            const Icon = ENTITY_ICONS[entity.entity_type] ?? Network;
            const relCount = Object.keys(entity.relationships ?? {}).length;
            return (
              <div key={entity.id} className="group glass rounded-xl p-4 hover:border-electric-500/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-electric-500/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-electric-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-primary text-sm truncate">{entity.name}</h3>
                    <p className="text-xs text-tertiary mt-0.5 capitalize">{entity.entity_type}</p>
                    {entity.description && <p className="text-xs text-secondary mt-1 line-clamp-2">{entity.description}</p>}
                    {relCount > 0 && <p className="text-xs text-electric-400 mt-1">{relCount} relationships</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(entity.id)}
                    className="p-1 opacity-0 group-hover:opacity-100 text-tertiary hover:text-error-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
