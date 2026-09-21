import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from '@/lib/router';
import {
  Sparkles, MessageSquare, FolderKanban, CheckSquare,
  Brain, Bot, Zap, ArrowRight, Activity, Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Conversation, Project, Task, Memory, ActivityEvent } from '@/types';

export function HomeView() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commandInput, setCommandInput] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const [convRes, projRes, taskRes, memRes, actRes] = await Promise.all([
      supabase.from('conversations').select('*').eq('user_id', user.id).eq('archived', false).order('updated_at', { ascending: false }).limit(5),
      supabase.from('projects').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(5),
      supabase.from('tasks').select('*').eq('user_id', user.id).neq('status', 'completed').order('created_at', { ascending: false }).limit(5),
      supabase.from('memories').select('*').eq('user_id', user.id).eq('archived', false).order('updated_at', { ascending: false }).limit(5),
      supabase.from('activity_events').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    ]);

    const failures = [convRes, projRes, taskRes, memRes, actRes].map((r) => r.error?.message).filter((m): m is string => Boolean(m));
    if (failures.length) setError(failures.join(' • '));

    setConversations((convRes.data as Conversation[] | null) ?? []);
    setProjects((projRes.data as Project[] | null) ?? []);
    setTasks((taskRes.data as Task[] | null) ?? []);
    setMemories((memRes.data as Memory[] | null) ?? []);
    setActivity((actRes.data as ActivityEvent[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    navigate('/chat', { state: { initialMessage: commandInput } });
    setCommandInput('');
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const stats = [
    { label: 'Conversations', value: conversations.length, icon: MessageSquare, color: 'text-electric-400' },
    { label: 'Projects', value: projects.length, icon: FolderKanban, color: 'text-cyan-400' },
    { label: 'Active Tasks', value: tasks.length, icon: CheckSquare, color: 'text-success-400' },
    { label: 'Memories', value: memories.length, icon: Brain, color: 'text-warning-400' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl nova-gradient flex items-center justify-center glow-blue">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {greeting()}, {profile?.full_name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-sm text-secondary">How can NOVA help you today?</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-300">
          <span className="min-w-0">{error}</span>
          <button type="button" onClick={() => void loadData()} className="flex-shrink-0 rounded-lg border border-error-500/30 px-3 py-1.5 hover:bg-error-500/10">Retry</button>
        </div>
      )}

      {/* Command Input */}
      <form onSubmit={handleCommand} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Ask NOVA anything, or type a command..."
            className="w-full px-5 py-4 glass-strong rounded-2xl text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500/50 focus:ring-2 focus:ring-electric-500/20 transition-all text-base"
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 nova-gradient text-white rounded-xl hover:opacity-90 transition-opacity"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-2xl font-bold text-primary">{stat.value}</span>
            </div>
            <p className="text-xs text-secondary">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Conversations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-primary flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-electric-400" />
                Recent Conversations
              </h2>
              <button onClick={() => navigate('/chat')} className="text-xs text-electric-400 hover:text-electric-300 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 shimmer-bg rounded-lg" />)}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-tertiary text-sm">
                No conversations yet. Start one by typing above.
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => navigate(`/chat/${conv.id}`)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-tertiary transition-colors text-left group"
                  >
                    <MessageSquare className="w-4 h-4 text-tertiary group-hover:text-electric-400 flex-shrink-0" />
                    <span className="flex-1 text-sm text-primary truncate">{conv.title}</span>
                    <span className="text-xs text-tertiary flex-shrink-0">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Tasks */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-primary flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-success-400" />
                Active Tasks
              </h2>
              <button onClick={() => navigate('/tasks')} className="text-xs text-electric-400 hover:text-electric-300 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="h-10 shimmer-bg rounded-lg" />)}
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-tertiary text-sm">No active tasks</div>
            ) : (
              <div className="space-y-1">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => navigate('/tasks')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-tertiary transition-colors text-left"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      task.priority === 'urgent' ? 'bg-error-500' :
                      task.priority === 'high' ? 'bg-warning-500' :
                      task.priority === 'medium' ? 'bg-electric-500' : 'bg-tertiary'
                    }`} />
                    <span className="flex-1 text-sm text-primary truncate">{task.title}</span>
                    {task.due_date && (
                      <span className="text-xs text-tertiary flex-shrink-0">
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar content */}
        <div className="space-y-6">
          {/* Projects */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-primary flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-cyan-400" />
                Projects
              </h2>
              <button onClick={() => navigate('/projects')} className="text-xs text-electric-400 hover:text-electric-300">
                View all
              </button>
            </div>
            {projects.length === 0 ? (
              <div className="text-center py-6 text-tertiary text-sm">No projects yet</div>
            ) : (
              <div className="space-y-1">
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => navigate('/projects')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-tertiary transition-colors text-left"
                  >
                    <div className="w-3 h-3 rounded flex-shrink-0" style={{ background: proj.color || '#3b82f6' }} />
                    <span className="flex-1 text-sm text-primary truncate">{proj.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent Memories */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-primary flex items-center gap-2">
                <Brain className="w-4 h-4 text-warning-400" />
                Recent Memories
              </h2>
              <button onClick={() => navigate('/memory')} className="text-xs text-electric-400 hover:text-electric-300">
                View all
              </button>
            </div>
            {memories.length === 0 ? (
              <div className="text-center py-6 text-tertiary text-sm">No memories yet</div>
            ) : (
              <div className="space-y-2">
                {memories.map((mem) => (
                  <div key={mem.id} className="px-3 py-2 bg-tertiary/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-1.5 py-0.5 bg-electric-500/15 text-electric-300 rounded">{mem.category}</span>
                    </div>
                    <p className="text-xs text-secondary line-clamp-2">{mem.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-xl p-5">
            <h2 className="font-semibold text-primary mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'New Chat', icon: MessageSquare, to: '/chat' },
                { label: 'New Project', icon: FolderKanban, to: '/projects' },
                { label: 'Agents', icon: Bot, to: '/agents' },
                { label: 'Automations', icon: Zap, to: '/automations' },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.to)}
                  className="flex flex-col items-center gap-2 p-3 bg-tertiary/50 rounded-lg hover:bg-tertiary transition-colors"
                >
                  <action.icon className="w-5 h-5 text-electric-400" />
                  <span className="text-xs text-secondary">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="mt-6 glass rounded-xl p-5">
        <h2 className="font-semibold text-primary flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-electric-400" />
          Recent Activity
        </h2>
        {activity.length === 0 ? (
          <div className="text-center py-6 text-tertiary text-sm">No recent activity</div>
        ) : (
          <div className="space-y-1">
            {activity.map((evt) => (
              <div key={evt.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-tertiary transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-electric-500 flex-shrink-0" />
                <span className="flex-1 text-sm text-secondary">{evt.title}</span>
                <span className="text-xs text-tertiary flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(evt.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
