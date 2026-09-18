import { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon, User as UserIcon, Palette, Brain, Shield, Download, Trash2, CreditCard, Cpu, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { PLANS } from '@/lib/plans';
import type { PersonalityType } from '@/types';
import { PERSONALITIES } from '@/lib/ai/personality';
import {
  checkLocalAI,
  getOllamaSettings,
  setOllamaSettings,
  DEFAULT_OLLAMA_URL,
  type LocalStatus,
} from '@/lib/ai/providers';
import {
  testLocalModel,
  localTroubleshooting,
  runModeCheck,
  formatModeReport,
  type ModeTestResult,
} from '@/lib/ai/orchestrator';

type Tab = 'profile' | 'appearance' | 'personality' | 'local-ai' | 'privacy' | 'plans' | 'export';

const MODE_RESULTS_KEY = 'nova.modeCheck.last';

export function SettingsView() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<Tab>('profile');
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [personality, setPersonality] = useState<PersonalityType>('professional');
  const [customPersonality, setCustomPersonality] = useState('');
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [autoMemoryEnabled, setAutoMemoryEnabled] = useState(true);
  const [conversationSaving, setConversationSaving] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Local AI (on this device)
  const [localUrl, setLocalUrl] = useState(DEFAULT_OLLAMA_URL);
  const [localModel, setLocalModel] = useState('');
  const [localStatus, setLocalStatus] = useState<LocalStatus | null>(null);
  const [checkingLocal, setCheckingLocal] = useState(false);
  const [testingLocal, setTestingLocal] = useState(false);
  const [localTest, setLocalTest] = useState<{ ok: boolean; message: string } | null>(null);
  const [modeResults, setModeResults] = useState<ModeTestResult[] | null>(null);
  const [modeResultsAt, setModeResultsAt] = useState<string | null>(null);
  const [checkingModes, setCheckingModes] = useState(false);
  const [copied, setCopied] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryNote, setRetryNote] = useState<string | null>(null);

  const storeResults = (results: ModeTestResult[]) => {
    const at = new Date().toISOString();
    setModeResults(results);
    setModeResultsAt(at);
    try {
      window.localStorage.setItem(MODE_RESULTS_KEY, JSON.stringify({ at, results }));
    } catch { /* storage unavailable */ }
  };

  const handleModeCheck = async () => {
    setCheckingModes(true);
    const results = await runModeCheck(profile?.plan ?? 'free');
    storeResults(results);
    setCheckingModes(false);
  };

  const handleCopyReport = async () => {
    if (!modeResults) return;
    try {
      await navigator.clipboard.writeText(formatModeReport(modeResults, modeResultsAt ?? undefined));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  /**
   * Guided retry: keeps checking for local AI, and as soon as it answers,
   * re-runs only the local modes that failed last time.
   */
  const startGuidedRetry = async () => {
    setRetrying(true);
    setRetryNote('Waiting for local AI to answer...');
    for (let attempt = 1; attempt <= 20; attempt++) {
      const status = await checkLocalAI(localUrl);
      setLocalStatus(status);
      if (status.reachable) {
        const failedLocal = (modeResults ?? [])
          .filter((r) => !r.ok && r.source === 'On this device')
          .map((r) => r.mode);
        if (failedLocal.length === 0) {
          setRetryNote('Local AI is reachable again.');
        } else {
          setRetryNote('Local AI is back — re-running the local modes that failed...');
          const rerun = await runModeCheck(profile?.plan ?? 'free', failedLocal);
          const merged = (modeResults ?? []).map(
            (r) => rerun.find((n) => n.mode === r.mode) ?? r,
          );
          storeResults(merged);
          setRetryNote('Local AI is back and the failing local modes were re-tested.');
        }
        setRetrying(false);
        return;
      }
      setRetryNote(`Still no answer from ${localUrl} (attempt ${attempt} of 20). Restart Ollama and confirm the port above.`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    setRetrying(false);
    setRetryNote(`Gave up after 20 tries. Local AI at ${localUrl} never answered — start Ollama, then press Retry again.`);
  };


  const detectLocal = useCallback(async (url?: string) => {
    setCheckingLocal(true);
    setLocalTest(null);
    const status = await checkLocalAI(url ?? localUrl);
    setLocalStatus(status);
    setCheckingLocal(false);
    return status;
  }, [localUrl]);

  useEffect(() => {
    const saved = getOllamaSettings();
    setLocalUrl(saved.baseUrl);
    setLocalModel(saved.model);
  }, []);

  useEffect(() => {
    if (tab === 'local-ai' && !localStatus && !checkingLocal) {
      void detectLocal();
    }
  }, [tab, localStatus, checkingLocal, detectLocal]);

  const saveLocalSettings = (baseUrl: string, model: string) => {
    setLocalUrl(baseUrl);
    setLocalModel(model);
    setOllamaSettings({ baseUrl, model });
  };

  const handleTestLocalModel = async () => {
    setTestingLocal(true);
    setLocalTest(null);
    const result = await testLocalModel(localUrl, localModel);
    setLocalTest(
      result.ok
        ? { ok: true, message: `${localModel} replied "${result.reply}" in ${result.ms} ms. Local AI is working.` }
        : { ok: false, message: result.error ?? 'The local model test failed.' },
    );
    setTestingLocal(false);
  };

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
  }, [profile]);

  const loadPreferences = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('preferences').select('*').eq('user_id', user.id);
    const prefs = data ?? [];
    const personalityPref = prefs.find((p) => p.key === 'personality');
    if (personalityPref) setPersonality(personalityPref.value as PersonalityType);
    const customPref = prefs.find((p) => p.key === 'custom_personality');
    if (customPref) setCustomPersonality(customPref.value);
    const memPref = prefs.find((p) => p.key === 'memory_enabled');
    if (memPref) setMemoryEnabled(memPref.enabled);
    const autoMemPref = prefs.find((p) => p.key === 'auto_memory_enabled');
    if (autoMemPref) setAutoMemoryEnabled(autoMemPref.enabled);
    const convPref = prefs.find((p) => p.key === 'conversation_saving');
    if (convPref) setConversationSaving(convPref.enabled);
  }, [user]);

  useEffect(() => { loadPreferences(); }, [loadPreferences]);

  const savePreference = async (key: string, value: string, enabled: boolean = true, category: string = 'general') => {
    if (!user) return;
    await supabase.from('preferences').upsert({
      user_id: user.id,
      key,
      value,
      enabled,
      category,
    }, { onConflict: 'user_id,key' });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    await updateProfile({ full_name: fullName });
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const handlePersonalityChange = async (p: PersonalityType) => {
    setPersonality(p);
    await savePreference('personality', p, true, 'ai');
    if (p !== 'custom') await savePreference('custom_personality', '', true, 'ai');
  };

  const handleCustomPersonalitySave = async () => {
    await savePreference('custom_personality', customPersonality, true, 'ai');
  };

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    const exportData: Record<string, unknown> = {};

    const tables = ['conversations', 'messages', 'memories', 'projects', 'tasks', 'agents', 'automations', 'preferences', 'notifications'];
    for (const table of tables) {
      const { data } = await supabase.from(table).select('*').eq('user_id', user.id);
      exportData[table] = data ?? [];
    }

    exportData.profile = profile;

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nova-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    if (!confirm('This will permanently delete ALL your NOVA data (conversations, memories, projects, tasks, files, agents, automations). This cannot be undone. Type DELETE to confirm.')) return;
    const tables = ['messages', 'conversations', 'memories', 'project_files', 'file_versions', 'tasks', 'agents', 'agent_runs', 'automations', 'automation_runs', 'preferences', 'notifications', 'usage_records', 'audit_logs', 'activity_events', 'approval_requests', 'knowledge_entities', 'timeline_entries', 'conversation_summaries', 'folders', 'projects'];
    for (const table of tables) {
      await supabase.from(table).delete().eq('user_id', user.id);
    }
    await signOut();
  };

  const tabs: { id: Tab; label: string; icon: typeof UserIcon }[] = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'personality', label: 'Personality', icon: Brain },
    { id: 'local-ai', label: 'Local AI', icon: Cpu },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'plans', label: 'Plans', icon: CreditCard },
    { id: 'export', label: 'Data Export', icon: Download },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-primary mb-1 flex items-center gap-2">
        <SettingsIcon className="w-6 h-6 text-electric-400" /> Settings
      </h1>
      <p className="text-sm text-secondary mb-6">Manage your account, preferences, and privacy</p>

      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id ? 'bg-electric-500/15 text-electric-300' : 'text-secondary hover:text-primary hover:bg-tertiary'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="glass-strong rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary focus:outline-none focus:border-electric-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="w-full px-3 py-2 bg-tertiary/50 border border-subtle rounded-lg text-tertiary text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-4 py-2 nova-gradient text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {savedMsg && <span className="text-xs text-success-400">Saved!</span>}
          </div>
        </div>
      )}

      {tab === 'appearance' && (
        <div className="glass-strong rounded-xl p-6 space-y-4">
          <h3 className="font-medium text-primary text-sm">Theme</h3>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
              { value: 'system', label: 'System' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`px-4 py-3 rounded-lg border text-sm transition-colors ${
                  theme === opt.value ? 'border-electric-500 bg-electric-500/10 text-electric-300' : 'border-subtle text-secondary hover:text-primary hover:border-default'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'personality' && (
        <div className="glass-strong rounded-xl p-6 space-y-4">
          <h3 className="font-medium text-primary text-sm">AI Personality</h3>
          <p className="text-xs text-secondary">Choose how NOVA communicates with you across all features.</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(PERSONALITIES).map((p) => (
              <button
                key={p.type}
                onClick={() => handlePersonalityChange(p.type)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  personality === p.type ? 'border-electric-500 bg-electric-500/10' : 'border-subtle hover:border-default'
                }`}
              >
                <p className={`text-sm font-medium ${personality === p.type ? 'text-electric-300' : 'text-primary'}`}>{p.name}</p>
                <p className="text-xs text-tertiary mt-0.5">{p.description}</p>
              </button>
            ))}
          </div>
          {personality === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">Custom Personality Instructions</label>
              <textarea
                value={customPersonality}
                onChange={(e) => setCustomPersonality(e.target.value)}
                onBlur={handleCustomPersonalitySave}
                placeholder="Describe how you want NOVA to behave..."
                rows={4}
                className="w-full px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500 text-sm resize-none"
              />
            </div>
          )}
        </div>
      )}

      {tab === 'local-ai' && (
        <div className="glass-strong rounded-xl p-6 space-y-5">
          <div>
            <h3 className="font-medium text-primary text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-electric-400" /> Local AI (on this device)
            </h3>
            <p className="text-xs text-secondary mt-1">
              NOVA can answer on your own machine using Ollama. Private and Offline modes always use
              this — nothing is ever sent to the cloud in those modes. NOVA never downloads a model
              for you; install the ones you want with Ollama first.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Address on this machine</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={localUrl}
                onChange={(e) => setLocalUrl(e.target.value)}
                onBlur={() => saveLocalSettings(localUrl, localModel)}
                placeholder={DEFAULT_OLLAMA_URL}
                className="flex-1 px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500 text-sm"
              />
              <button
                onClick={() => { saveLocalSettings(localUrl, localModel); void detectLocal(localUrl); }}
                disabled={checkingLocal}
                className="flex items-center gap-2 px-3 py-2 bg-tertiary border border-subtle rounded-lg text-sm text-secondary hover:text-primary disabled:opacity-50"
              >
                {checkingLocal ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {checkingLocal ? 'Checking...' : 'Check'}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-tertiary/50">
            {checkingLocal ? (
              <>
                <Loader2 className="w-4 h-4 text-electric-400 animate-spin mt-0.5" />
                <p className="text-xs text-secondary">Looking for local AI on this machine...</p>
              </>
            ) : localStatus?.reachable ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-success-400 mt-0.5" />
                <p className="text-xs text-secondary">
                  Local AI found. {localStatus.models.length}{' '}
                  {localStatus.models.length === 1 ? 'model is' : 'models are'} installed.
                  {localStatus.models.length === 0 && ' Install one with Ollama to use Private and Offline modes.'}
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-warning-400 mt-0.5" />
                <p className="text-xs text-secondary">
                  {localStatus?.error ?? 'Local AI has not been checked yet.'} Private and Offline modes
                  stay unavailable until it is running — NOVA will not use the cloud instead.
                </p>
              </>
            )}
          </div>

          {(() => {
            const help = checkingLocal ? null : localTroubleshooting(localStatus, localUrl, localModel);
            if (!help) return null;
            return (
              <div className="p-3 rounded-lg border border-warning-500/30 bg-warning-500/10">
                <p className="text-xs font-medium text-warning-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {help.headline}
                </p>
                <ol className="mt-2 ml-6 space-y-1 list-decimal">
                  {help.steps.map((step) => (
                    <li key={step} className="text-xs text-secondary">{step}</li>
                  ))}
                </ol>
              </div>
            );
          })()}

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Model for local answers</label>
            {localStatus?.reachable && localStatus.models.length > 0 ? (
              <select
                value={localModel}
                onChange={(e) => { saveLocalSettings(localUrl, e.target.value); setLocalTest(null); }}
                className="w-full px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary focus:outline-none focus:border-electric-500 text-sm"
              >
                <option value="">Select an installed model</option>
                {localStatus.models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={localModel}
                onChange={(e) => setLocalModel(e.target.value)}
                onBlur={() => saveLocalSettings(localUrl, localModel)}
                placeholder="e.g. llama3.1"
                className="w-full px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500 text-sm"
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestLocalModel}
              disabled={testingLocal || !localModel}
              className="flex items-center gap-2 px-4 py-2 nova-gradient text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {testingLocal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
              {testingLocal ? 'Testing...' : 'Test this model'}
            </button>
            <span className="text-xs text-tertiary">Asks the model for a one-word reply. Stays on this device.</span>
          </div>

          {localTest && (
            <div className={`flex items-start gap-2 p-3 rounded-lg border ${
              localTest.ok
                ? 'bg-success-500/10 border-success-500/30'
                : 'bg-error-500/10 border-error-500/30'
            }`}>
              {localTest.ok
                ? <CheckCircle2 className="w-4 h-4 text-success-400 mt-0.5" />
                : <AlertCircle className="w-4 h-4 text-error-400 mt-0.5" />}
              <p className={`text-xs ${localTest.ok ? 'text-success-400' : 'text-error-400'}`}>{localTest.message}</p>
            </div>
          )}

          <div className="border-t border-subtle pt-4 space-y-3">
            <div>
              <h4 className="text-sm font-medium text-primary">Check every mode</h4>
              <p className="text-xs text-secondary mt-1">
                Sends one very short message through Auto, Fast, Reasoning, Coding, Research, Private
                and Offline, then shows where each one ran and how long it took. Private and Offline
                are only tried on this device.
              </p>
            </div>
            <button
              onClick={handleModeCheck}
              disabled={checkingModes}
              className="flex items-center gap-2 px-4 py-2 bg-tertiary border border-subtle rounded-lg text-sm text-secondary hover:text-primary disabled:opacity-50"
            >
              {checkingModes ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {checkingModes ? 'Checking all modes...' : 'Run mode check'}
            </button>

            {modeResults && (
              <div className="space-y-1.5">
                {modeResults.map((r) => (
                  <div
                    key={r.mode}
                    className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                      r.ok ? 'bg-success-500/10 border-success-500/30' : 'bg-error-500/10 border-error-500/30'
                    }`}
                  >
                    {r.ok
                      ? <CheckCircle2 className="w-4 h-4 text-success-400 mt-0.5 shrink-0" />
                      : <AlertCircle className="w-4 h-4 text-error-400 mt-0.5 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-xs text-primary">
                        <span className="font-medium">{r.label}</span>
                        <span className="text-tertiary"> · {r.source} · {r.ms} ms</span>
                      </p>
                      <p className={`text-xs mt-0.5 break-words ${r.ok ? 'text-secondary' : 'text-error-400'}`}>
                        {r.ok ? `Replied "${r.reply}"` : r.error}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-tertiary border-t border-subtle pt-4">
            NOVA has no API keys or AI providers to configure. Cloud answers use NOVA's own managed AI
            runtime, and its credentials never reach your browser.
          </p>
        </div>
      )}

      {tab === 'privacy' && (
        <div className="glass-strong rounded-xl p-6 space-y-4">
          <h3 className="font-medium text-primary text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-electric-400" /> Privacy Controls</h3>
          <div className="space-y-3">
            {[
              { label: 'Long-term Memory', desc: 'Allow NOVA to store and retrieve memories across conversations', state: memoryEnabled, setter: (v: boolean) => { setMemoryEnabled(v); savePreference('memory_enabled', String(v), v, 'privacy'); } },
              { label: 'Automatic Memory', desc: 'Let NOVA automatically identify and save important information', state: autoMemoryEnabled, setter: (v: boolean) => { setAutoMemoryEnabled(v); savePreference('auto_memory_enabled', String(v), v, 'privacy'); } },
              { label: 'Conversation Saving', desc: 'Save conversation history for future reference', state: conversationSaving, setter: (v: boolean) => { setConversationSaving(v); savePreference('conversation_saving', String(v), v, 'privacy'); } },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-tertiary/50 rounded-lg">
                <div>
                  <p className="text-sm text-primary">{item.label}</p>
                  <p className="text-xs text-tertiary mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => item.setter(!item.state)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${item.state ? 'bg-electric-500' : 'bg-tertiary'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${item.state ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-subtle">
            <p className="text-xs text-secondary mb-3">Your data is stored securely and is never shared with other users. AI providers may process your messages to generate responses.</p>
          </div>
        </div>
      )}

      {tab === 'plans' && (
        <div className="space-y-4">
          {Object.values(PLANS).map((plan) => {
            const isCurrent = profile?.plan === plan.tier;
            return (
              <div key={plan.tier} className={`glass-strong rounded-xl p-6 ${isCurrent ? 'border-electric-500/50' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-primary text-lg">{plan.name}</h3>
                    <p className="text-xs text-secondary">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">${plan.price_monthly}<span className="text-sm text-tertiary">/mo</span></p>
                    {isCurrent && <span className="text-xs text-electric-400">Current Plan</span>}
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="text-xs text-secondary flex items-start gap-2">
                      <span className="text-electric-400 mt-0.5">•</span> {feat}
                    </li>
                  ))}
                </ul>
                {!isCurrent && plan.price_monthly > 0 && (
                  <button className="mt-4 px-4 py-2 nova-gradient text-white rounded-lg text-sm font-medium hover:opacity-90">
                    Upgrade to {plan.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'export' && (
        <div className="glass-strong rounded-xl p-6 space-y-4">
          <h3 className="font-medium text-primary text-sm flex items-center gap-2"><Download className="w-4 h-4 text-electric-400" /> Data Export</h3>
          <p className="text-xs text-secondary">Download all your NOVA data as a JSON file. This includes conversations, memories, projects, tasks, agents, automations, and preferences.</p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 nova-gradient text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> {exporting ? 'Exporting...' : 'Export All Data'}
          </button>

          <div className="pt-4 border-t border-subtle">
            <h3 className="font-medium text-error-400 text-sm flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete All Data</h3>
            <p className="text-xs text-secondary mt-1">Permanently delete all your NOVA data. This action cannot be undone.</p>
            <button
              onClick={handleDeleteAllData}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-error-500/15 text-error-400 rounded-lg text-sm font-medium hover:bg-error-500/25 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete Everything
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
