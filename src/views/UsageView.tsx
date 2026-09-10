import { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, MessageSquare, Brain, Bot, Zap, FileText, DollarSign, Activity, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PLANS } from '@/lib/plans';
import type { UsageRecord } from '@/types';

export function UsageView() {
  const { user, profile } = useAuth();
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    messagesToday: 0,
    totalTokens: 0,
    agentRuns: 0,
    automationsRun: 0,
    filesStored: 0,
  });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [usageRes, agentRes, autoRes, fileRes] = await Promise.all([
      supabase.from('usage_records').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
      supabase.from('agent_runs').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('automation_runs').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('project_files').select('id, file_size', { count: 'exact' }).eq('user_id', user.id).eq('deleted', false),
    ]);

    const records = usageRes.data as UsageRecord[] ?? [];
    setUsageRecords(records);

    setStats({
      messagesToday: records.filter((r) => new Date(r.created_at) >= today && r.resource_type === 'chat_message').length,
      totalTokens: records.reduce((sum, r) => sum + (r.tokens_input ?? 0) + (r.tokens_output ?? 0), 0),
      agentRuns: agentRes.count ?? 0,
      automationsRun: autoRes.count ?? 0,
      filesStored: fileRes.count ?? 0,
    });

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const plan = profile ? PLANS[profile.plan] : PLANS.free;
  const usagePercent = profile ? (stats.messagesToday / plan.limits.max_messages_per_day) * 100 : 0;

  const statCards = [
    { label: 'Messages Today', value: stats.messagesToday, limit: plan.limits.max_messages_per_day, icon: MessageSquare, color: 'text-electric-400' },
    { label: 'Total Tokens', value: stats.totalTokens.toLocaleString(), icon: TrendingUp, color: 'text-cyan-400' },
    { label: 'Agent Runs', value: stats.agentRuns, limit: plan.limits.max_agents, icon: Bot, color: 'text-success-400' },
    { label: 'Automations Run', value: stats.automationsRun, icon: Zap, color: 'text-warning-400' },
    { label: 'Files Stored', value: stats.filesStored, limit: plan.limits.max_files, icon: FileText, color: 'text-electric-400' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-primary mb-1 flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-electric-400" /> Usage
      </h1>
      <p className="text-sm text-secondary mb-6">Track your AI usage and plan limits</p>

      {/* Plan card */}
      <div className="glass-strong rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-primary">{plan.name}</h2>
            <p className="text-xs text-secondary mt-0.5">{plan.description}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">${plan.price_monthly}<span className="text-sm text-tertiary">/mo</span></p>
          </div>
        </div>
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-secondary mb-1">
            <span>Messages today</span>
            <span>{stats.messagesToday} / {plan.limits.max_messages_per_day}</span>
          </div>
          <div className="h-2 bg-tertiary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${usagePercent > 80 ? 'bg-error-500' : usagePercent > 50 ? 'bg-warning-500' : 'bg-electric-500'}`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-xl font-bold text-primary">{stat.value}</span>
            </div>
            <p className="text-xs text-secondary">{stat.label}</p>
            {stat.limit && <p className="text-xs text-tertiary mt-0.5">Limit: {stat.limit}</p>}
          </div>
        ))}
      </div>

      {/* Recent usage */}
      <div className="glass rounded-xl p-5">
        <h2 className="font-semibold text-primary mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-electric-400" /> Recent Usage
        </h2>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 shimmer-bg rounded-lg" />)}</div>
        ) : usageRecords.length === 0 ? (
          <div className="text-center py-8 text-tertiary text-sm">No usage records yet</div>
        ) : (
          <div className="space-y-1">
            {usageRecords.slice(0, 20).map((rec) => (
              <div key={rec.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-tertiary transition-colors">
                <div className="w-2 h-2 rounded-full bg-electric-500 flex-shrink-0" />
                <span className="text-sm text-secondary flex-1">{rec.resource_type.replace(/_/g, ' ')}</span>
                {rec.model && <span className="text-xs text-tertiary">{rec.model}</span>}
                {rec.tokens_input && rec.tokens_output && (
                  <span className="text-xs text-tertiary">{rec.tokens_input + rec.tokens_output} tokens</span>
                )}
                <span className="text-xs text-tertiary flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {new Date(rec.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
