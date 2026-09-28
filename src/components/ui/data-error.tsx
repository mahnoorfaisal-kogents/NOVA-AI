import { AlertCircle, RefreshCw, LogIn } from "lucide-react";

interface DataErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isUnauthorized?: boolean;
}

export function DataError({
  title = "Failed to load data",
  message = "An unexpected error occurred while fetching information from the server.",
  onRetry,
  isUnauthorized = false,
}: DataErrorProps) {
  return (
    <div className="glass-strong border border-error-500/20 rounded-xl p-6 text-center max-w-md mx-auto my-6">
      <div className="w-12 h-12 rounded-xl bg-error-500/10 border border-error-500/20 text-error-400 flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-primary mb-1">{title}</h3>
      <p className="text-xs text-secondary mb-4">{message}</p>
      <div className="flex items-center justify-center gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-tertiary border border-default hover:border-strong text-primary text-xs font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
        {isUnauthorized && (
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-3 py-1.5 nova-gradient text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In Again
          </button>
        )}
      </div>
    </div>
  );
}
