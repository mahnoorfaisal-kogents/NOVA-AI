import { NavLink, useLocation } from '@/lib/router';
import {
  Home, MessageSquare, FolderKanban, FileText, CheckSquare,
  Bot, Zap, Brain, Search, BarChart3, Settings, Sparkles,
  ChevronLeft, ChevronRight, Activity, Network, Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/files', label: 'Files', icon: FileText },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/agents', label: 'Agents', icon: Bot },
  { to: '/automations', label: 'Automations', icon: Zap },
  { to: '/memory', label: 'Memory', icon: Brain },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/research', label: 'Research', icon: BarChart3 },
  { to: '/timeline', label: 'Timeline', icon: Activity },
  { to: '/knowledge', label: 'Knowledge', icon: Network },
  { to: '/security', label: 'Security', icon: Shield },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { profile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-60'
      } flex-shrink-0 h-screen sticky top-0 glass border-r border-subtle flex flex-col transition-all duration-300 z-30`}
    >
      <div className="h-14 flex items-center px-4 border-b border-subtle flex-shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg nova-gradient flex items-center justify-center flex-shrink-0 glow-blue">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-primary text-lg tracking-tight whitespace-nowrap">NOVA</span>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm transition-all group relative ${
                isActive
                  ? 'bg-electric-500/15 text-electric-300'
                  : 'text-secondary hover:text-primary hover:bg-tertiary'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-electric-400' : ''}`} />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-electric-400 rounded-r-full" />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-2 py-2 border-t border-subtle flex-shrink-0">
        {profile && !collapsed && (
          <div className="px-3 py-2 mb-1">
            <div className="text-xs text-tertiary uppercase tracking-wide">{profile.plan} Plan</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-secondary hover:text-primary hover:bg-tertiary transition-colors"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
