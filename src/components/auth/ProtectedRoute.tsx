import { useEffect, useState } from 'react';
import { useNavigate } from '@/lib/router';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Sparkles } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-app">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl nova-gradient mb-4 glow-blue animate-pulse-glow">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center justify-center gap-2 text-secondary">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading NOVA...</span>
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth', { replace: true });
      }
      setShowLoading(false);
    }
  }, [user, loading, navigate]);

  if (loading || (showLoading && !user)) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
