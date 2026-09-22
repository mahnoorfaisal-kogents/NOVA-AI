import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Settings, LogOut, User as UserIcon, ChevronDown, Command, Sun, Moon, Monitor, Cpu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from '@/lib/router';

interface TopBarProps {
  onCommandPalette: () => void;
}

export function TopBar({ onCommandPalette }: TopBarProps) {
  const { user, profile, signOut } = useAuth();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [mode, setMode] = useState(() => typeof window === 'undefined' ? 'nova-auto' : localStorage.getItem('nova-ai-mode') || 'nova-auto');
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<HTMLDivElement>(null);
  const MODES: Array<{ id: string; label: string }> = [
    { id: 'nova-auto', label: 'Auto' },
    { id: 'nova-fast', label: 'Fast' },
    { id: 'nova-reasoning', label: 'Reasoning' },
    { id: 'nova-coding', label: 'Coding' },
    { id: 'nova-research', label: 'Research' },
    { id: 'nova-private', label: 'Private' },
    { id: 'nova-offline', label: 'Offline' },
  ];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowThemeMenu(false);
      if (modeRef.current && !modeRef.current.contains(e.target as Node)) setShowModeMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const onModeChange = (event: Event) => setMode((event as CustomEvent<string>).detail || 'nova-auto');
    window.addEventListener('nova-ai-mode-change', onModeChange);
    return () => window.removeEventListener('nova-ai-mode-change', onModeChange);
  }, []);

  const themeIcon = theme === 'dark' ? <Moon className="w-4 h-4" /> : theme === 'light' ? <Sun className="w-4 h-4" /> : <Monitor className="w-4 h-4" />;
  const activeMode = MODES.find((item) => item.id === mode) ?? MODES[0];
  const setAiMode = (nextMode: string) => {
    setMode(nextMode);
    localStorage.setItem('nova-ai-mode', nextMode);
    window.dispatchEvent(new CustomEvent('nova-ai-mode-change', { detail: nextMode }));
    setShowModeMenu(false);
  };

  return (
    <header className="h-14 glass border-b border-subtle flex items-center justify-between px-4 sticky top-0 z-20">
      <button
        onClick={onCommandPalette}
        className="flex items-center gap-2 px-3 py-1.5 bg-tertiary border border-subtle rounded-lg text-tertiary hover:text-secondary hover:border-default transition-all text-sm min-w-[200px]"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Search or ask NOVA...</span>
        <kbd className="flex items-center gap-0.5 text-xs bg-app px-1.5 py-0.5 rounded border border-subtle">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      <div className="flex items-center gap-1">
        <div className="relative" ref={modeRef}>
          <button onClick={() => setShowModeMenu(!showModeMenu)} className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-secondary hover:text-primary hover:bg-tertiary transition-colors" title="AI mode">
            <Cpu className="w-4 h-4 text-electric-400" /><span className="text-xs font-medium">{activeMode.label}</span><ChevronDown className="w-3 h-3 text-tertiary" />
          </button>
          {showModeMenu && (
            <div className="absolute right-0 top-full mt-1 glass-strong rounded-lg shadow-xl py-1 min-w-[150px] z-50">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-tertiary">AI Mode</div>
              {MODES.map((item) => (
                <button key={item.id} onClick={() => setAiMode(item.id)} className={item.id === mode ? "w-full flex items-center justify-between px-3 py-2 text-sm text-electric-400 bg-electric-500/10" : "w-full flex items-center justify-between px-3 py-2 text-sm text-secondary hover:text-primary hover:bg-tertiary"}>
                  <span>{item.label}</span>{(item.id === 'nova-private' || item.id === 'nova-offline') && <span className="text-[9px] text-success-400">LOCAL</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-tertiary transition-colors"
            title="Theme"
          >
            {themeIcon}
          </button>
          {showThemeMenu && (
            <div className="absolute right-0 top-full mt-1 glass-strong rounded-lg shadow-xl py-1 min-w-[140px] z-50">
              {([
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'system', label: 'System', icon: Monitor },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setTheme(opt.value); setShowThemeMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    theme === opt.value ? 'text-electric-400 bg-electric-500/10' : 'text-secondary hover:text-primary hover:bg-tertiary'
                  }`}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-tertiary transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-electric-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-full mt-1 glass-strong rounded-lg shadow-xl w-80 max-h-96 overflow-hidden z-50 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-subtle">
                <span className="font-medium text-primary text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-electric-400 hover:text-electric-300">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-tertiary text-sm">No notifications</div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`w-full text-left px-4 py-3 border-b border-subtle hover:bg-tertiary transition-colors ${!n.read ? 'bg-electric-500/5' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read && <div className="w-2 h-2 rounded-full bg-electric-500 mt-1.5 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary">{n.title}</p>
                          <p className="text-xs text-secondary mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-tertiary transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-tertiary border border-subtle flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-medium text-secondary">
                  {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
                </span>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-tertiary" />
          </button>
          {showProfile && (
            <div className="absolute right-0 top-full mt-1 glass-strong rounded-lg shadow-xl py-1 min-w-[200px] z-50">
              <div className="px-3 py-2 border-b border-subtle">
                <p className="text-sm font-medium text-primary truncate">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-tertiary truncate">{user?.email}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-electric-500/15 text-electric-300 text-xs rounded-full">
                  {profile?.plan?.toUpperCase()} Plan
                </div>
              </div>
              <button
                onClick={() => { setShowProfile(false); navigate('/settings'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:text-primary hover:bg-tertiary transition-colors"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              <button
                onClick={() => { setShowProfile(false); navigate('/settings?tab=profile'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:text-primary hover:bg-tertiary transition-colors"
              >
                <UserIcon className="w-4 h-4" /> Profile
              </button>
              <div className="border-t border-subtle my-1" />
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-400 hover:bg-error-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
