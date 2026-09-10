import { useState, useEffect, useCallback } from 'react';
import { Shield, CheckCircle2, AlertCircle, Clock, FileText, Bot, Zap, Brain } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { AuditLog, ApprovalRequest } from '@/types';

export function SecurityCenterView() {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'audit' | 'approvals' | 'overview'>('overview');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [auditRes, approvalRes] = await Promise.all([
      supabase.from('audit_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('approval_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]);
    setAuditLogs(auditRes.data as AuditLog[] ?? []);
    setApprovals(approvalRes.data as ApprovalRequest[] ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleApproval = async (id: string, status: 'approved' | 'denied') => {
    await supabase.from('approval_requests').update({ status, resolved_at: new Date().toISOString() }).eq('id', id);
    setApprovals((prev) => prev.map((a) => a.id === id ? { ...a, status, resolved_at: new Date().toISOString() } : a));
  };

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const failedActions = auditLogs.filter((a) => a.result === 'failed');

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-primary mb-1 flex items-center gap-2">
        <Shield className="w-6 h-6 text-electric-400" /> Security Center
      </h1>
      <p className="text-sm text-secondary mb-6">Audit logs, approval requests, and security overview</p>

      <div className="flex gap-1 mb-6 p-1 bg-tertiary rounded-lg w-fit">
        {(['overview', 'audit', 'approvals'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
              tab === t ? 'bg-electric-500 text-white' : 'text-secondary hover:text-primary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-5 h-5 text-success-400" />
                <span className="text-xl font-bold text-primary">{pendingApprovals.length}</span>
              </div>
              <p className="text-xs text-secondary">Pending Approvals</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-5 h-5 text-electric-400" />
                <span className="text-xl font-bold text-primary">{auditLogs.length}</span>
              </div>
              <p className="text-xs text-secondary">Total Audit Events</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-5 h-5 text-error-400" />
                <span className="text-xl font-bold text-primary">{failedActions.length}</span>
              </div>
              <p className="text-xs text-secondary">Failed Actions</p>
            </div>
          </div>

          <div className="glass-strong rounded-xl p-5">
            <h3 className="font-semibold text-primary text-sm mb-3">Security Features Active</h3>
            <div className="space-y-2">
              {[
                { label: 'Row-Level Security (RLS)', desc: 'All data is user-scoped — no user can access another user\'s data', active: true },
                { label: 'Audit Logging', desc: 'Important operations are recorded for review', active: true },
                { label: 'Human-in-the-Loop Approvals', desc: 'Sensitive operations require your approval', active: true },
                { label: 'Prompt Injection Defense', desc: 'Retrieved content is separated from system instructions', active: true },
                { label: 'Data Loss Prevention', desc: 'Sensitive information is detected before exposure', active: true },
                { label: 'Multi-User Isolation', desc: 'Conversations, files, memories are strictly separated', active: true },
              ].map((feat) => (
                <div key={feat.label} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-primary">{feat.label}</p>
                    <p className="text-xs text-tertiary">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-primary text-sm mb-4">Audit Log</h3>
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 shimmer-bg rounded-lg" />)}</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-tertiary text-sm">No audit events recorded yet</div>
          ) : (
            <div className="space-y-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-tertiary transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.result === 'success' ? 'bg-success-500' : 'bg-error-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-primary">{log.action}</p>
                    <p className="text-xs text-tertiary">Actor: {log.actor}{log.tool ? ` • Tool: ${log.tool}` : ''}</p>
                  </div>
                  {log.permission && <span className="text-xs px-2 py-0.5 bg-tertiary rounded text-tertiary">{log.permission}</span>}
                  <span className="text-xs text-tertiary flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'approvals' && (
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-20 shimmer-bg rounded-lg" />)}</div>
          ) : approvals.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="w-12 h-12 text-tertiary mx-auto mb-3" />
              <p className="text-secondary text-sm">No approval requests. When agents need to perform sensitive operations, they'll appear here.</p>
            </div>
          ) : (
            approvals.map((approval) => (
              <div key={approval.id} className="glass rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    approval.status === 'pending' ? 'bg-warning-500/15' :
                    approval.status === 'approved' ? 'bg-success-500/15' :
                    approval.status === 'denied' ? 'bg-error-500/15' : 'bg-tertiary'
                  }`}>
                    {approval.status === 'pending' ? <Clock className="w-4 h-4 text-warning-400" /> :
                     approval.status === 'approved' ? <CheckCircle2 className="w-4 h-4 text-success-400" /> :
                     <AlertCircle className="w-4 h-4 text-error-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-primary text-sm">{approval.action}</h3>
                    <p className="text-xs text-secondary mt-1">{approval.description}</p>
                    {approval.data_involved && <p className="text-xs text-tertiary mt-1">Data: {approval.data_involved}</p>}
                    <p className="text-xs text-tertiary mt-1">{new Date(approval.created_at).toLocaleString()}</p>
                  </div>
                  {approval.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApproval(approval.id, 'approved')}
                        className="px-3 py-1.5 bg-success-500/15 text-success-400 rounded-lg text-xs font-medium hover:bg-success-500/25 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproval(approval.id, 'denied')}
                        className="px-3 py-1.5 bg-error-500/15 text-error-400 rounded-lg text-xs font-medium hover:bg-error-500/25 transition-colors"
                      >
                        Deny
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
