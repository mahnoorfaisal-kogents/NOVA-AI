import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@/lib/router';
import { Plus, FolderKanban, MoreHorizontal, Trash2, Edit2, FileText, MessageSquare, CheckSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/types';

export function ProjectsView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error: loadError } = await supabase.from('projects').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    if (loadError) setError(loadError.message);
    setProjects((data as Project[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    const { data, error: createError } = await supabase.from('projects').insert({
      user_id: user.id,
      name: newName.trim(),
      description: newDesc.trim() || null,
      color: '#3b82f6',
    }).select('*').maybeSingle();
    if (createError) { setError(createError.message); return; }
    if (data) {
      setProjects((prev) => [data as Project, ...prev]);
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error: deleteError } = await supabase.from('projects').delete().eq('id', id);
    if (deleteError) { setError(deleteError.message); return; }
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in">
{error && <div className="mb-4 rounded-lg border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-300">{error}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Projects</h1>
          <p className="text-sm text-secondary mt-1">Organize your work into AI-powered project workspaces</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 nova-gradient text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 glass-strong rounded-xl p-5 space-y-3 animate-fade-in-up">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
            className="w-full px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500 text-sm"
            autoFocus
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2 bg-tertiary border border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500 text-sm resize-none"
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 nova-gradient text-white rounded-lg text-sm font-medium hover:opacity-90">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-tertiary text-secondary rounded-lg text-sm hover:text-primary">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 shimmer-bg rounded-xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <FolderKanban className="w-12 h-12 text-tertiary mx-auto mb-3" />
          <p className="text-secondary text-sm">No projects yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <div key={proj.id} className="relative group glass rounded-xl p-5 hover:border-electric-500/30 transition-colors">
              <button onClick={() => navigate(`/projects/${proj.id}`)} className="block w-full text-left">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded" style={{ background: proj.color || '#3b82f6' }} />
                  <h3 className="font-semibold text-primary truncate">{proj.name}</h3>
                </div>
                {proj.description && <p className="text-xs text-secondary line-clamp-2 mb-3">{proj.description}</p>}
                {proj.instructions && (
                  <p className="text-xs text-tertiary italic line-clamp-1">Instructions set</p>
                )}
                <p className="text-xs text-tertiary mt-2">Updated {new Date(proj.updated_at).toLocaleDateString()}</p>
              </button>
              <button
                onClick={() => setMenuOpen(menuOpen === proj.id ? null : proj.id)}
                className="absolute top-3 right-3 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-tertiary transition-all"
              >
                <MoreHorizontal className="w-4 h-4 text-tertiary" />
              </button>
              {menuOpen === proj.id && (
                <div className="absolute top-10 right-3 glass-strong rounded-lg shadow-xl py-1 min-w-[120px] z-50">
                  <button onClick={() => handleDelete(proj.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-error-400 hover:bg-error-500/10">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
