import { useState, useEffect, useCallback } from 'react';
import { Search, Globe, Loader2, AlertCircle, ExternalLink, FileText, Brain, FolderKanban, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { type ChatMessage } from '@/lib/ai/providers';
import { buildSystemPrompt } from '@/lib/ai/personality';
import { orchestrateChat, routeRequest } from '@/lib/ai/orchestrator';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';

interface ResearchStep {
  label: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  result?: string;
}

export function ResearchView() {
  const { user, profile } = useAuth();
  const [query, setQuery] = useState('');
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<ResearchStep[]>([]);
  const [report, setReport] = useState('');
  const [error, setError] = useState<string | null>(null);

  const runResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || running) return;
    setRunning(true);
    setError(null);
    setReport('');

    const researchSteps: ResearchStep[] = [
      { label: 'Understanding the question', status: 'pending' },
      { label: 'Planning research approach', status: 'pending' },
      { label: 'Analyzing available knowledge', status: 'pending' },
      { label: 'Synthesizing findings', status: 'pending' },
      { label: 'Generating report', status: 'pending' },
    ];
    setSteps(researchSteps);

    // Research always runs in NOVA's Research mode.
    const decision = routeRequest('nova-research', profile?.plan ?? 'free', query);

    for (let i = 0; i < researchSteps.length; i++) {
      setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s));

      const prompts = [
        `Analyze this research question and identify the key aspects to investigate: "${query}"`,
        `Create a research plan for: "${query}". What sources and methods would be most reliable?`,
        `Based on your knowledge, what are the key findings about: "${query}"? Be thorough and cite what you can.`,
        `Synthesize the key findings about "${query}" into a coherent analysis. Note areas of uncertainty.`,
        `Write a structured research report on "${query}" with sections: Summary, Key Findings, Analysis, and Sources. Mark any information you are not certain about.`,
      ];

      const systemPrompt = buildSystemPrompt({
        personality: 'analytical',
        basePrompt: 'You are a research assistant. Never fabricate sources or citations. If you do not have reliable information, say so. Distinguish between established facts and your own analysis.',
      });

      const messages: ChatMessage[] = [{ role: 'user', content: prompts[i] }];
      const response = await orchestrateChat(messages, decision, { systemPrompt });

      if (response.error && i === 0) {
        setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'error', result: response.error ?? 'Unknown error' } : s));
        setError(response.error);
        setRunning(false);
        return;
      }

      setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'complete', result: response.content } : s));

      if (i === researchSteps.length - 1) {
        setReport(response.content);
        if (user) {
          await supabase.from('activity_events').insert({
            user_id: user.id,
            event_type: 'research_completed',
            entity_type: 'research',
            entity_id: null,
            title: `Research: ${query.slice(0, 60)}`,
          });
        }
      }
    }

    setRunning(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-primary mb-1 flex items-center gap-2">
        <Search className="w-6 h-6 text-electric-400" /> Research
      </h1>
      <p className="text-sm text-secondary mb-6">
        Multi-step analysis in NOVA's Research mode, with a structured written report at the end.
      </p>
      <p className="text-xs text-tertiary -mt-4 mb-6">
        Research works from what NOVA already knows — it does not browse the live web, and it will
        never invent sources.
      </p>

      <form onSubmit={runResearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What would you like to research?"
            className="flex-1 px-4 py-3 glass-strong rounded-xl text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500/50 focus:ring-2 focus:ring-electric-500/20 text-sm"
            disabled={running}
          />
          <button
            type="submit"
            disabled={!query.trim() || running}
            className="px-6 py-3 nova-gradient text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm font-medium flex items-center gap-2"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {running ? 'Researching...' : 'Research'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-error-500/10 border border-error-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-error-400 flex-shrink-0" />
          <p className="text-sm text-error-400">{error}</p>
        </div>
      )}

      {steps.length > 0 && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-primary text-sm mb-4">Research Progress</h3>
            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.status === 'complete' ? 'bg-success-500/20 text-success-400' :
                    step.status === 'running' ? 'bg-electric-500/20 text-electric-400' :
                    step.status === 'error' ? 'bg-error-500/20 text-error-400' :
                    'bg-tertiary text-tertiary'
                  }`}>
                    {step.status === 'complete' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                     step.status === 'running' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                     step.status === 'error' ? <AlertCircle className="w-3.5 h-3.5" /> :
                     <span className="text-xs">{idx + 1}</span>}
                  </div>
                  <span className={`text-sm ${step.status === 'pending' ? 'text-tertiary' : 'text-primary'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {report && (
            <div className="glass-strong rounded-xl p-6">
              <h3 className="font-semibold text-primary text-sm mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-electric-400" /> Research Report
              </h3>
              <div className="markdown-content text-sm">
                <MarkdownRenderer content={report} />
              </div>
            </div>
          )}
        </div>
      )}

      {!running && steps.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-tertiary mx-auto mb-3" />
          <p className="text-secondary text-sm">Enter a research question above to begin a structured research workflow.</p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {[
              { icon: Brain, label: 'Analyzes knowledge', desc: 'Uses NOVA reasoning to explore the topic' },
              { icon: FileText, label: 'Structured report', desc: 'Produces a clear, organized summary' },
              { icon: AlertCircle, label: 'Honest about limits', desc: 'Never fabricates sources or citations' },
            ].map((item) => (
              <div key={item.label} className="glass rounded-lg p-4 text-center">
                <item.icon className="w-5 h-5 text-electric-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-primary">{item.label}</p>
                <p className="text-xs text-tertiary mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
