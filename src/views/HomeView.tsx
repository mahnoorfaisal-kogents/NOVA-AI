import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from '@/lib/router';
import {
  Sparkles, MessageSquare, FolderKanban, FileText, CheckSquare,
  Brain, Bot, Zap, ArrowRight, Activity, Clock, Search, BarChart3,
  Network, Shield, Gauge, Settings, Lock, Command, Layers3, Plus, Upload, Play, RefreshCw, Cpu, Database, CircleCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Conversation, Project, Task, Memory, ActivityEvent } from '@/types';

const FEATURES = [
  { label: 'AI Chat', description: 'Conversations, modes and model routing', to: '/chat', icon: MessageSquare, tone: 'electric', available: 'All plans' },
  { label: 'Projects', description: 'Organise work, files and instructions', to: '/projects', icon: FolderKanban, tone: 'cyan', available: 'All plans' },
  { label: 'Files', description: 'Store and work with your project files', to: '/files', icon: FileText, tone: 'blue', available: 'All plans' },
  { label: 'Tasks', description: 'Priorities, due dates and execution', to: '/tasks', icon: CheckSquare, tone: 'success', available: 'All plans' },
  { label: 'Agents', description: 'Specialised AI workers for repeatable work', to: '/agents', icon: Bot, tone: 'purple', available: 'All plans' },
  { label: 'Automations', description: 'Turn recurring work into workflows', to: '/automations', icon: Zap, tone: 'warning', available: 'All plans' },
  { label: 'Memory', description: 'Curate what NOVA remembers', to: '/memory', icon: Brain, tone: 'amber', available: 'All plans' },
  { label: 'Search', description: 'Search across your NOVA workspace', to: '/search', icon: Search, tone: 'cyan', available: 'All plans' },
  { label: 'Usage', description: 'Track usage, limits and model activity', to: '/usage', icon: Gauge, tone: 'blue', available: 'All plans' },
  { label: 'Research', description: 'Deep multi-step research workflows', to: '/research', icon: BarChart3, tone: 'purple', available: 'Pro+' },
  { label: 'Timeline', description: 'Browse your semantic activity history', to: '/timeline', icon: Activity, tone: 'electric', available: 'All plans' },
  { label: 'Knowledge', description: 'Explore connected people and ideas', to: '/knowledge', icon: Network, tone: 'cyan', available: 'Ultimate' },
  { label: 'Security', description: 'Audit, approvals and permissions', to: '/security', icon: Shield, tone: 'success', available: 'All plans' },
  { label: 'Settings', description: 'Account, local AI and preferences', to: '/settings', icon: Settings, tone: 'slate', available: 'All plans' },
] as const;

const toneClasses: Record<string, string> = {
  electric: 'text-electric-400 bg-electric-500/10 border-electric-500/20',
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  success: 'text-success-400 bg-success-500/10 border-success-500/20',
  purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  warning: 'text-warning-400 bg-warning-500/10 border-warning-500/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  slate: 'text-slate-300 bg-slate-500/10 border-slate-500/20',
};

export function HomeView() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [resourceCounts, setResourceCounts] = useState({ files: 0, agents: 0, automations: 0, notifications: 0, usage: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commandInput, setCommandInput] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const [convRes, projRes, taskRes, memRes, actRes, fileRes, agentRes, automationRes, notificationRes, usageRes] = await Promise.all([
      supabase.from('conversations').select('*').eq('user_id', user.id).eq('archived', false).order('updated_at', { ascending: false }).limit(5),
      supabase.from('projects').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(5),
      supabase.from('tasks').select('*').eq('user_id', user.id).neq('status', 'completed').order('created_at', { ascending: false }).limit(5),
      supabase.from('memories').select('*').eq('user_id', user.id).eq('archived', false).order('updated_at', { ascending: false }).limit(5),
      supabase.from('activity_events').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('project_files').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('agents').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('automations').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false),
      supabase.from('usage_records').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

    const failures = [convRes, projRes, taskRes, memRes, actRes, fileRes, agentRes, automationRes, notificationRes, usageRes].map((r) => r.error?.message).filter((m): m is string => Boolean(m));
    if (failures.length) setError(failures.join(' • '));

    setConversations((convRes.data as Conversation[] | null) ?? []);
    setProjects((projRes.data as Project[] | null) ?? []);
    setTasks((taskRes.data as Task[] | null) ?? []);
    setMemories((memRes.data as Memory[] | null) ?? []);
    setActivity((actRes.data as ActivityEvent[] | null) ?? []);
    setResourceCounts({ files: fileRes.count ?? 0, agents: agentRes.count ?? 0, automations: automationRes.count ?? 0, notifications: notificationRes.count ?? 0, usage: usageRes.count ?? 0 });
    setLoading(false);
  }, [user]);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    navigate('/chat', { state: { initialMessage: commandInput.trim() } });
    setCommandInput('');
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const stats = [
    { label: 'Conversations', value: conversations.length, icon: MessageSquare, color: 'text-electric-400', to: '/chat' },
    { label: 'Projects', value: projects.length, icon: FolderKanban, color: 'text-cyan-400', to: '/projects' },
    { label: 'Active Tasks', value: tasks.length, icon: CheckSquare, color: 'text-success-400', to: '/tasks' },
    { label: 'Files', value: resourceCounts.files, icon: FileText, color: 'text-blue-400', to: '/files' },
    { label: 'Agents', value: resourceCounts.agents, icon: Bot, color: 'text-purple-400', to: '/agents' },
    { label: 'Automations', value: resourceCounts.automations, icon: Zap, color: 'text-warning-400', to: '/automations' },
    { label: 'Memories', value: memories.length, icon: Brain, color: 'text-amber-400', to: '/memory' },
    { label: 'AI Usage', value: resourceCounts.usage, icon: Gauge, color: 'text-cyan-400', to: '/usage' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-2xl border border-electric-500/15 bg-gradient-to-br from-electric-500/10 via-transparent to-cyan-500/10 p-6 sm:p-8 mb-6">
        <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-electric-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-24 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl nova-gradient flex items-center justify-center glow-blue">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-electric-300">NOVA Command Center</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary">{greeting()}, {profile?.full_name?.split(' ')[0] || 'there'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-subtle bg-tertiary/50 px-3 py-1.5 text-xs text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" />
              {profile?.plan ? profile.plan.toUpperCase() : 'FREE'} PLAN
            </div>
          </div>
          <p className="text-secondary max-w-2xl mb-5">Everything in your NOVA workspace, one command away. Choose a feature below or ask NOVA to start something for you.</p>
          <form onSubmit={handleCommand}>
            <div className="relative max-w-3xl">
              <Command className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Ask NOVA anything, or type a command..."
                className="w-full pl-11 pr-14 py-3.5 glass-strong rounded-xl text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500/50 focus:ring-2 focus:ring-electric-500/20 transition-all"
                autoFocus
              />
              <button type="submit" aria-label="Send to NOVA" className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 nova-gradient text-white rounded-lg hover:opacity-90 transition-opacity">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-300">
          <span className="min-w-0 truncate">{error}</span>
          <button type="button" onClick={() => void loadData()} className="flex-shrink-0 rounded-lg border border-error-500/30 px-3 py-1.5 hover:bg-error-500/10">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((stat) => (
          <button key={stat.label} onClick={() => navigate(stat.to)} className="glass rounded-xl p-4 text-left hover:border-electric-500/30 hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-2xl font-bold text-primary">{stat.value}</span>
            </div>
            <p className="text-xs text-secondary">{stat.label}</p>
          </button>
        ))}
      </div>

      <section className="mb-8">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-electric-400 mb-1">Workspace</p>
            <h2 className="text-xl font-semibold text-primary">All NOVA features</h2>
          </div>
          <span className="text-xs text-tertiary">{FEATURES.length} modules</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            const locked = feature.available !== 'All plans' && profile?.plan === 'free';
            return (
              <button
                key={feature.to}
                onClick={() => navigate(feature.to)}
                className="group glass rounded-xl p-4 text-left hover:border-electric-500/30 hover:bg-tertiary/60 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${toneClasses[feature.tone]}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  {locked ? <Lock className="w-3.5 h-3.5 text-tertiary" /> : <ArrowRight className="w-3.5 h-3.5 text-tertiary group-hover:text-electric-400 transition-colors" />}
                </div>
                <div className="font-medium text-primary text-sm mb-1">{feature.label}</div>
                <p className="text-xs text-secondary leading-relaxed min-h-9">{feature.description}</p>
                <div className="mt-3 text-[10px] uppercase tracking-wider text-tertiary">{feature.available}</div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-primary flex items-center gap-2"><MessageSquare className="w-4 h-4 text-electric-400" />Recent Conversations</h2>
              <button onClick={() => navigate('/chat')} className="text-xs text-electric-400 hover:text-electric-300 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button>
            </div>
            {loading ? <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-12 shimmer-bg rounded-lg" />)}</div> :
              conversations.length === 0 ? <div className="text-center py-8 text-tertiary text-sm">No conversations yet. Start one above.</div> :
              <div className="space-y-1">{conversations.map((conv) => (
                <button key={conv.id} onClick={() => navigate('/chat')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-tertiary transition-colors text-left group">
                  <MessageSquare className="w-4 h-4 text-tertiary group-hover:text-electric-400 flex-shrink-0" />
                  <span className="flex-1 text-sm text-primary truncate">{conv.title}</span>
                  <span className="text-xs text-tertiary flex-shrink-0">{new Date(conv.updated_at).toLocaleDateString()}</span>
                </button>
              ))}</div>}
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-primary flex items-center gap-2"><CheckSquare className="w-4 h-4 text-success-400" />Active Tasks</h2>
              <button onClick={() => navigate('/tasks')} className="text-xs text-electric-400 hover:text-electric-300 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button>
            </div>
            {loading ? <div className="space-y-2">{[1,2].map((i) => <div key={i} className="h-10 shimmer-bg rounded-lg" />)}</div> :
              tasks.length === 0 ? <div className="text-center py-8 text-tertiary text-sm">No active tasks</div> :
              <div className="space-y-1">{tasks.map((task) => (
                <button key={task.id} onClick={() => navigate('/tasks')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-tertiary transition-colors text-left">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'urgent' ? 'bg-error-500' : task.priority === 'high' ? 'bg-warning-500' : task.priority === 'medium' ? 'bg-electric-500' : 'bg-tertiary'}`} />
                  <span className="flex-1 text-sm text-primary truncate">{task.title}</span>
                  {task.due_date && <span className="text-xs text-tertiary flex-shrink-0">{new Date(task.due_date).toLocaleDateString()}</span>}
                </button>
              ))}</div>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-primary flex items-center gap-2"><FolderKanban className="w-4 h-4 text-cyan-400" />Projects</h2>
              <button onClick={() => navigate('/projects')} className="text-xs text-electric-400 hover:text-electric-300">View all</button>
            </div>
            {projects.length === 0 ? <div className="text-center py-6 text-tertiary text-sm">No projects yet</div> :
              <div className="space-y-1">{projects.map((proj) => (
                <button key={proj.id} onClick={() => navigate('/projects')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-tertiary transition-colors text-left">
                  <div className="w-3 h-3 rounded flex-shrink-0" style={{ background: proj.color || '#3b82f6' }} />
                  <span className="flex-1 text-sm text-primary truncate">{proj.name}</span>
                </button>
              ))}</div>}
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-primary flex items-center gap-2"><Brain className="w-4 h-4 text-warning-400" />Recent Memories</h2>
              <button onClick={() => navigate('/memory')} className="text-xs text-electric-400 hover:text-electric-300">View all</button>
            </div>
            {memories.length === 0 ? <div className="text-center py-6 text-tertiary text-sm">No memories yet</div> :
              <div className="space-y-2">{memories.map((mem) => (
                <div key={mem.id} className="px-3 py-2 bg-tertiary/50 rounded-lg"><div className="flex items-center gap-2 mb-1"><span className="text-xs px-1.5 py-0.5 bg-electric-500/15 text-electric-300 rounded">{mem.category}</span></div><p className="text-xs text-secondary line-clamp-2">{mem.content}</p></div>
              ))}</div>}
          </div>
        </div>
      </div>

      <div className="mt-6 glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-primary flex items-center gap-2"><Activity className="w-4 h-4 text-electric-400" />Recent Activity</h2>
          <button onClick={() => navigate('/timeline')} className="text-xs text-electric-400 hover:text-electric-300 flex items-center gap-1">Open timeline <ArrowRight className="w-3 h-3" /></button>
        </div>
        {activity.length === 0 ? <div className="text-center py-6 text-tertiary text-sm">No recent activity</div> :
          <div className="space-y-1">{activity.map((evt) => (
            <div key={evt.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-tertiary transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-electric-500 flex-shrink-0" />
              <span className="flex-1 text-sm text-secondary">{evt.title}</span>
              <span className="text-xs text-tertiary flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(evt.created_at).toLocaleString()}</span>
            </div>
          ))}</div>}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-subtle bg-tertiary/30 px-4 py-3">
        <div className="flex items-center gap-3"><Layers3 className="w-4 h-4 text-electric-400" /><span className="text-xs text-secondary">NOVA keeps your workspace modules visible here even when a plan feature requires an upgrade.</span></div>
        <button onClick={() => navigate('/settings')} className="text-xs text-electric-400 hover:text-electric-300 flex-shrink-0">Manage</button>
      </div>
    </div>
  );
}
