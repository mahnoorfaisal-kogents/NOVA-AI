import { useState, useEffect, useCallback } from 'react';
import { Plus, Bot, Trash2, Zap, FileText, Search, BarChart3, Code, PenTool, Shield, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Agent, AgentType } from '@/types';

const AGENT_TYPES: { type: AgentType; label: string; icon: typeof Bot; description: string }[] = [
  { type: 'general', label: 'General', icon: Bot, description: 'Versatile assistant for any task' },
  { type: 'research', label: 'Research', icon: Search, description: 'Deep research and source analysis' },
  { type: 'coding', label: 'Coding', icon: Code, description: 'Code generation and debugging' },
  { type: 'writing', label: 'Writing', icon: PenTool, description: 'Content creation and editing' },
  { type: 'data_analysis', label: 'Data Analysis', icon: BarChart3, description: 'Analyze and visualize data' },
  { type: 'planning', label: 'Planning', icon: Zap, description: 'Strategic planning and roadmaps' },
  { type: 'productivity', label: 'Productivity', icon: CheckCircle2, description: 'Task and workflow management' },
  { type: 'file_analyst', label: 'File Analyst', icon: FileText, description: 'Document analysis and extraction' },
  { type: 'security', label: 'Security', icon: Shield, description: 'Security analysis and review' },
  { type: 'automation', label: 'Automation', icon: Zap, description: 'Automate repetitive tasks' },
  { type: 'verification', label: 'Verification', icon: CheckCircle2, description: 'Verify and validate results' },
];

export function AgentsView() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AgentType>('general');
  const [newInstructions, setNewInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error: loadError } = await supabase.from('agents').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (loadError) setError(loadError.message);
    setAgents((data as Agent[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    const { data, error: createError } = await supabase.from('agents').insert({
      user_id: user.id,
      name: newName.trim(),
      type: newType,
      instructions: newInstructions.trim() || null,
    }).select('*').maybeSingle();
    if (createError) { setError(createError.message); return; }
    if (data) {
      setAgents((prev) => [data as Agent, ...prev]);
      setNewName('');
      setNewType('general');
      setNewInstructions('');
      setShowCreate(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error: deleteError } = await supabase.from('agents').delete().eq('id', id);
    if (deleteError) { setError(deleteError.message); return; }
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  const getAgentIcon = (type: AgentType) => AGENT_TYPES.find((a) => a.type === type)?.icon ?? Bot;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in">
      {error && <div className="mb-4 rounded-lg border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-300">{error}</div>}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Bot className="w-6 h-6 text-electric-400" /> Agents
          </h1>
          <p className="text-sm text-secondary mt-1">Specialized AI agents for different types of work</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 nova-gradient text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New Agent
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 glass-strong rounded-xl p-5 space-y-3 animate-fade-in-up">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Agent name (e.g. 'Code Reviewer')"
            className="w-full px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500 text-sm"
            autoFocus
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {AGENT_TYPES.map((at) => (
              <button
                key={at.type}
                type="button"
                onClick={() => setNewType(at.type)}
                className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-colors ${
                  newType === at.type
                    ? 'border-electric-500 bg-electric-500/10 text-electric-300'
                    : 'border-subtle text-secondary hover:text-primary hover:border-default'
                }`}
              >
                <at.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs">{at.label}</span>
              </button>
            ))}
          </div>
          <textarea
            value={newInstructions}
            onChange={(e) => setNewInstructions(e.target.value)}
            placeholder="Custom instructions for this agent..."
            rows={3}
            className="w-full px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500 text-sm resize-none"
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 nova-gradient text-white rounded-lg text-sm font-medium hover:opacity-90">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-tertiary text-secondary rounded-lg text-sm hover:text-primary">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 shimmer-bg rounded-xl" />)}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16">
          <Bot className="w-12 h-12 text-tertiary mx-auto mb-3" />
          <p className="text-secondary text-sm">No agents yet. Create one to automate your work.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent) => {
            const Icon = getAgentIcon(agent.type);
            return (
              <div key={agent.id} className="group glass rounded-xl p-4 hover:border-electric-500/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-electric-500/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-electric-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-primary text-sm">{agent.name}</h3>
                    <p className="text-xs text-tertiary mt-0.5">{AGENT_TYPES.find((a) => a.type === agent.type)?.label}</p>
                    {agent.instructions && (
                      <p className="text-xs text-secondary mt-1 line-clamp-2">{agent.instructions}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        agent.permissions === 'safe' ? 'bg-success-500/15 text-success-400' :
                        agent.permissions === 'confirm' ? 'bg-warning-500/15 text-warning-400' :
                        'bg-error-500/15 text-error-400'
                      }`}>
                        {agent.permissions}
                      </span>
                      {agent.tools.length > 0 && (
                        <span className="text-xs text-tertiary">{agent.tools.length} tools</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(agent.id)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 text-tertiary hover:text-error-400 transition-all"
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
