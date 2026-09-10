import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@/lib/router';
import {
  Search, MessageSquare, FolderKanban, FileText, CheckSquare,
  Bot, Zap, Brain, Settings, Home, BarChart3, Clock, ArrowRight
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface Command {
  id: string;
  label: string;
  icon: typeof Home;
  action: () => void;
  category: string;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    { id: 'home', label: 'Home', icon: Home, action: () => navigate('/'), category: 'Navigation' },
    { id: 'new-chat', label: 'New Chat', icon: MessageSquare, action: () => navigate('/chat'), category: 'Chat' },
    { id: 'projects', label: 'Projects', icon: FolderKanban, action: () => navigate('/projects'), category: 'Navigation' },
    { id: 'files', label: 'Files', icon: FileText, action: () => navigate('/files'), category: 'Navigation' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, action: () => navigate('/tasks'), category: 'Navigation' },
    { id: 'agents', label: 'Agents', icon: Bot, action: () => navigate('/agents'), category: 'AI' },
    { id: 'automations', label: 'Automations', icon: Zap, action: () => navigate('/automations'), category: 'AI' },
    { id: 'memory', label: 'Memory', icon: Brain, action: () => navigate('/memory'), category: 'Knowledge' },
    { id: 'search', label: 'Universal Search', icon: Search, action: () => navigate('/search'), category: 'Knowledge' },
    { id: 'research', label: 'Research', icon: BarChart3, action: () => navigate('/research'), category: 'AI' },
    { id: 'settings', label: 'Settings', icon: Settings, action: () => navigate('/settings'), category: 'System' },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[selectedIndex];
      if (cmd) {
        cmd.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl glass-strong rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-subtle">
          <Search className="w-4 h-4 text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands or ask NOVA..."
            className="flex-1 bg-transparent text-primary placeholder:text-tertiary focus:outline-none text-sm"
            autoFocus
          />
          <kbd className="text-xs text-tertiary px-1.5 py-0.5 bg-tertiary rounded border border-subtle">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-tertiary text-sm">No commands found</div>
          ) : (
            filtered.map((cmd, idx) => (
              <button
                key={cmd.id}
                onClick={() => { cmd.action(); onClose(); }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  idx === selectedIndex ? 'bg-electric-500/15 text-electric-300' : 'text-secondary hover:text-primary hover:bg-tertiary'
                }`}
              >
                <cmd.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left text-sm">{cmd.label}</span>
                <span className="text-xs text-tertiary">{cmd.category}</span>
                {idx === selectedIndex && <ArrowRight className="w-3 h-3 text-electric-400" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
