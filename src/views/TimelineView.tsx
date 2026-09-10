import { useState, useEffect, useCallback } from 'react';
import { Activity, Clock, Filter, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { TimelineEntry } from '@/types';

export function TimelineView() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('timeline_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    setEntries(data as TimelineEntry[] ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = entries.filter((e) => {
    const matchesSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || (e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesType = filterType === 'all' || e.event_type === filterType;
    return matchesSearch && matchesType;
  });

  const eventTypes = [...new Set(entries.map((e) => e.event_type))];

  const groupByDate = (items: TimelineEntry[]) => {
    const groups: Record<string, TimelineEntry[]> = {};
    for (const item of items) {
      const date = new Date(item.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    }
    return groups;
  };

  const grouped = groupByDate(filtered);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-primary mb-1 flex items-center gap-2">
        <Activity className="w-6 h-6 text-electric-400" /> Timeline
      </h1>
      <p className="text-sm text-secondary mb-6">A searchable timeline of your meaningful activity in NOVA</p>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search timeline..."
            className="w-full pl-10 pr-3 py-2 glass rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500/50 text-sm"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 glass rounded-lg text-primary text-sm focus:outline-none focus:border-electric-500/50"
        >
          <option value="all">All Types</option>
          {eventTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-12 shimmer-bg rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Activity className="w-12 h-12 text-tertiary mx-auto mb-3" />
          <p className="text-secondary text-sm">No timeline entries yet. Your activity will appear here as you use NOVA.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-xs font-medium text-tertiary uppercase tracking-wide mb-2">{date}</h3>
              <div className="space-y-1">
                {items.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 glass rounded-lg px-4 py-3 hover:border-electric-500/20 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-electric-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary">{entry.title}</p>
                      {entry.description && <p className="text-xs text-tertiary mt-0.5">{entry.description}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-1.5 py-0.5 bg-tertiary rounded text-tertiary">{entry.entity_type}</span>
                        {entry.semantic_tags.map((tag) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 bg-electric-500/10 text-electric-300 rounded">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-tertiary flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" /> {new Date(entry.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
