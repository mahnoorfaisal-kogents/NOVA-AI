import { useState, useEffect, useCallback } from 'react';
import { Plus, Zap, Trash2, Play, Clock, CheckCircle2, AlertCircle, Loader2, Power } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Automation, AutomationTrigger, AutomationActionType } from '@/types';

const TRIGGERS: { value: AutomationTrigger; label: string }[] = [
  { value: 'schedule', label: 'Schedule' },
  { value: 'task_event', label: 'Task Event' },
  { value: 'file_event', label: 'File Event' },
  { value: 'project_event', label: 'Project Event' },
  { value: 'user_command', label: 'User Command' },
];

const ACTIONS: { value: AutomationActionType; label: string }[] = [
  { value: 'ai_invocation', label: 'AI Invocation' },
  { value: 'task_creation', label: 'Create Task' },
  { value: 'task_update', label: 'Update Task' },
  { value: 'memory_update', label: 'Update Memory' },
  { value: 'notification', label: 'Notification' },
  { value: 'file_processing', label: 'Process File' },
];

export function AutomationsView() {
  const { user } = useAuth();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTrigger, setNewTrigger] = useState<AutomationTrigger>('schedule');
  const [newAction, setNewAction] = useState<AutomationActionType>('notification');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('automations').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setAutomations(data as Automation[] ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    const { data } = await supabase.from('automations').insert({
      user_id: user.id,
      name: newName.trim(),
      trigger_type: newTrigger,
      action_type: newAction,
      trigger_config: {},
      conditions: {},
      action_config: {},
    }).select('*').maybeSingle();
    if (data) {
      setAutomations((prev) => [data as Automation, ...prev]);
      setNewName('');
      setShowCreate(false);
    }
  };

  const handleToggle = async (auto: Automation) => {
    await supabase.from('automations').update({ enabled: !auto.enabled }).eq('id', auto.id);
    setAutomations((prev) => prev.map((a) => a.id === auto.id ? { ...a, enabled: !a.enabled } : a));
  };

  const handleDelete = async (id: string) => {
    await supabase.from('automations').delete().eq('id', id);
    setAutomations((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Zap className="w-6 h-6 text-electric-400" /> Automations
          </h1>
          <p className="text-sm text-secondary mt-1">Trigger actions automatically based on events</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 nova-gradient text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New Automation
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 glass-strong rounded-xl p-5 space-y-3 animate-fade-in-up">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Automation name"
            className="w-full px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500 text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <select value={newTrigger} onChange={(e) => setNewTrigger(e.target.value as AutomationTrigger)} className="px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary text-sm focus:outline-none focus:border-electric-500">
              {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={newAction} onChange={(e) => setNewAction(e.target.value as AutomationActionType)} className="px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary text-sm focus:outline-none focus:border-electric-500">
              {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 nova-gradient text-white rounded-lg text-sm font-medium hover:opacity-90">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-tertiary text-secondary rounded-lg text-sm hover:text-primary">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 shimmer-bg rounded-lg" />)}</div>
      ) : automations.length === 0 ? (
        <div className="text-center py-16">
          <Zap className="w-12 h-12 text-tertiary mx-auto mb-3" />
          <p className="text-secondary text-sm">No automations yet. Create one to automate repetitive tasks.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {automations.map((auto) => (
            <div key={auto.id} className="group glass rounded-xl p-4 flex items-center gap-3 hover:border-electric-500/20 transition-colors">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${auto.enabled ? 'bg-electric-500/15' : 'bg-tertiary'}`}>
                <Zap className={`w-5 h-5 ${auto.enabled ? 'text-electric-400' : 'text-tertiary'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-primary text-sm">{auto.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-tertiary">{TRIGGERS.find((t) => t.value === auto.trigger_type)?.label}</span>
                  <span className="text-xs text-tertiary">→</span>
                  <span className="text-xs text-tertiary">{ACTIONS.find((a) => a.value === auto.action_type)?.label}</span>
                </div>
              </div>
              <button
                onClick={() => handleToggle(auto)}
                className={`p-2 rounded-lg transition-colors ${auto.enabled ? 'text-success-400 hover:bg-success-500/10' : 'text-tertiary hover:bg-tertiary'}`}
                title={auto.enabled ? 'Disable' : 'Enable'}
              >
                <Power className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(auto.id)}
                className="p-2 opacity-0 group-hover:opacity-100 text-tertiary hover:text-error-400 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
