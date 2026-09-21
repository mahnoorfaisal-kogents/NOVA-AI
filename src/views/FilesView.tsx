import { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, Trash2, Upload, Search, File, FileCode, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { ProjectFile } from '@/types';

export function FilesView() {
  const { user } = useAuth();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error: loadError } = await supabase.from('project_files').select('*').eq('user_id', user.id).eq('deleted', false).order('created_at', { ascending: false });
    if (loadError) setError(loadError.message);
    setFiles((data as ProjectFile[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || !user) return;
    setUploading(true);
    setError(null);

    for (const file of Array.from(fileList)) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'txt';
      let contentText: string | null = null;

      if (file.type.startsWith('text/') || ['txt', 'md', 'json', 'csv', 'js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'xml', 'yaml', 'yml'].includes(ext)) {
        contentText = await file.text();
      }

      const { error: uploadError } = await supabase.from('project_files').insert({
        user_id: user.id,
        name: file.name,
        file_type: ext,
        file_size: file.size,
        content_text: contentText,
        tags: [],
        metadata: {},
      });
      if (uploadError) {
        setError(`${file.name}: ${uploadError.message}`);
        break;
      }
    }

    await load();
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    const { error: deleteError } = await supabase.from('project_files').update({ deleted: true }).eq('id', id);
    if (deleteError) { setError(deleteError.message); return; }
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const getFileIcon = (fileType: string) => {
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json', 'xml', 'yaml', 'yml'].includes(fileType)) return FileCode;
    if (['csv', 'xlsx', 'xls'].includes(fileType)) return FileSpreadsheet;
    return File;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filtered = files.filter((f) => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
      {error && <div className="mb-4 rounded-lg border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-300">{error}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <FileText className="w-6 h-6 text-electric-400" /> Files
          </h1>
          <p className="text-sm text-secondary mt-1">Upload, manage, and search your files</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 nova-gradient text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <Upload className="w-4 h-4" /> Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
      </div>

      <div
        className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver ? 'border-electric-500 bg-electric-500/5' : 'border-subtle'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files); }}
      >
        <Upload className="w-8 h-8 text-tertiary mx-auto mb-2" />
        <p className="text-sm text-secondary">
          {uploading ? 'Uploading...' : 'Drag and drop files here, or click Upload'}
        </p>
        <p className="text-xs text-tertiary mt-1">Text, code, markdown, CSV, JSON files are indexed for search</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search files..."
          className="w-full pl-10 pr-3 py-2 glass rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500/50 text-sm"
        />
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 shimmer-bg rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-tertiary mx-auto mb-3" />
          <p className="text-secondary text-sm">{searchQuery ? 'No files match your search.' : 'No files yet. Upload some to get started.'}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((file) => {
            const Icon = getFileIcon(file.file_type);
            return (
              <div key={file.id} className="group flex items-center gap-3 glass rounded-lg px-4 py-3 hover:border-electric-500/20 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-tertiary flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-electric-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary truncate">{file.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-tertiary uppercase">{file.file_type}</span>
                    <span className="text-xs text-tertiary">{formatSize(file.file_size)}</span>
                    {file.content_text && <span className="text-xs text-success-400">Indexed</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 text-tertiary hover:text-error-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
