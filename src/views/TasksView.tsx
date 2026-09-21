import { useState, useEffect, useCallback } from 'react';
import { Plus, CheckSquare, Trash2, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Task, TaskStatus, TaskPriority } from '@/types';

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-tertiary',
  medium: 'bg-electric-500',
  high: 'bg-warning-500',
  urgent: 'bg-error-500',
};

export function TasksView() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error: loadError } = await supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (loadError) setError(loadError.message);
    setTasks((data as Task[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim()) return;
    const { data, error: createError } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: newTitle.trim(),
      priority: newPriority,
    }).select('*').maybeSingle();
    if (createError) { setError(createError.message); return; }
    if (data) {
      setTasks((prev) => [data as Task, ...prev]);
      setNewTitle('');
      setNewPriority('medium');
      setShowCreate(false);
    }
  };

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'completed';
    const { error: updateError } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
    if (updateError) { setError(updateError.message); return; }
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));
  };

  const handleDelete = async (id: string) => {
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', id);
    if (deleteError) { setError(deleteError.message); return; }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const counts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
{error && <div className="mb-4 rounded-lg border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-300">{error}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Tasks</h1>
          <p className="text-sm text-secondary mt-1">Manage your to-dos, in-progress work, and completed items</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 nova-gradient text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 glass-strong rounded-xl p-4 space-y-3 animate-fade-in-up">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500 text-sm"
            autoFocus
          />
          <div className="flex gap-2 items-center">
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
              className="px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary text-sm focus:outline-none focus:border-electric-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
            <button type="submit" className="px-4 py-2 nova-gradient text-white rounded-lg text-sm font-medium hover:opacity-90">Add</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-tertiary text-secondary rounded-lg text-sm hover:text-primary">Cancel</button>
          </div>
        </form>
      )}

      <div className="flex gap-1 mb-4 p-1 bg-tertiary rounded-lg w-fit">
        {(['all', 'todo', 'in_progress', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              filter === f ? 'bg-electric-500 text-white' : 'text-secondary hover:text-primary'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_LABELS[f]} ({counts[f]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 shimmer-bg rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CheckSquare className="w-12 h-12 text-tertiary mx-auto mb-3" />
          <p className="text-secondary text-sm">No tasks here. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((task) => (
            <div key={task.id} className="group flex items-center gap-3 glass rounded-lg px-4 py-3 hover:border-electric-500/20 transition-colors">
              <button
                onClick={() => toggleStatus(task)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  task.status === 'completed' ? 'bg-success-500 border-success-500' : 'border-subtle hover:border-electric-500'
                }`}
              >
                {task.status === 'completed' && <CheckSquare className="w-3 h-3 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${task.status === 'completed' ? 'text-tertiary line-through' : 'text-primary'}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-tertiary">{STATUS_LABELS[task.status]}</span>
                  {task.due_date && (
                    <span className="text-xs text-tertiary flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                  {task.ai_created && <span className="text-xs text-electric-400">AI</span>}
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[task.priority]} flex-shrink-0`} title={task.priority} />
              <button
                onClick={() => handleDelete(task.id)}
                className="p-1 opacity-0 group-hover:opacity-100 text-tertiary hover:text-error-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
