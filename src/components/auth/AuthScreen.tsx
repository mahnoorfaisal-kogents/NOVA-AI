import { useState, FormEvent, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sparkles,
  Mail,
  Lock,
  User as UserIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

export function AuthScreen() {
  const { signIn, signUp, resendConfirmation, authState, setAuthState } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "awaiting_confirmation">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sync with authState if changed from context
  useEffect(() => {
    if (authState === "AWAITING_EMAIL_CONFIRMATION") {
      setMode("awaiting_confirmation");
    }
  }, [authState]);

  // Handle resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error);
        }
      } else if (mode === "signup") {
        const result = await signUp(email, password, fullName);
        if (result.error) {
          setError(result.error);
        } else if (result.needsConfirmation) {
          setMode("awaiting_confirmation");
          setResendCooldown(60);
        }
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (resendCooldown > 0 || !email) return;
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    const result = await resendConfirmation(email);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setInfoMessage("Verification email resent. Please check your inbox and spam folder.");
      setResendCooldown(60);
    }
  };

  const switchMode = (newMode: "signin" | "signup") => {
    setError(null);
    setInfoMessage(null);
    setMode(newMode);
    setAuthState(newMode === "signin" ? "UNAUTHENTICATED" : "UNAUTHENTICATED");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-electric-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl nova-gradient mb-4 glow-blue">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">NOVA AI</h1>
          <p className="text-secondary text-sm mt-2">Your personal AI operating system</p>
        </div>

        <div className="glass-strong rounded-2xl p-8 shadow-2xl border border-subtle">
          {mode === "awaiting_confirmation" ? (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-electric-500/20 text-electric-400 rounded-full flex items-center justify-center mx-auto border border-electric-500/30">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-primary">Confirm Your Email</h2>
                <p className="text-secondary text-sm mt-2 leading-relaxed">
                  Account created successfully. We've sent a verification link to:
                </p>
                <p className="font-mono text-electric-400 text-sm mt-1 px-3 py-1 bg-tertiary rounded-md inline-block">
                  {email}
                </p>
                <p className="text-tertiary text-xs mt-3">
                  Please click the link in your email to activate your account and access your
                  dashboard.
                </p>
              </div>

              {infoMessage && (
                <div className="p-3 bg-success-500/10 border border-success-500/30 rounded-lg text-xs text-success-400 text-left">
                  {infoMessage}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-error-500/10 border border-error-500/30 rounded-lg text-left">
                  <AlertCircle className="w-4 h-4 text-error-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-error-400">{error}</p>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={loading || resendCooldown > 0}
                  className="w-full py-2.5 px-4 bg-tertiary border border-default hover:border-strong text-primary text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : "Resend Confirmation Email"}
                </button>

                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="w-full py-2.5 px-4 nova-gradient text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-1 mb-6 p-1 bg-tertiary rounded-lg">
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    mode === "signin"
                      ? "bg-electric-500 text-white shadow-lg"
                      : "text-secondary hover:text-primary"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    mode === "signup"
                      ? "bg-electric-500 text-white shadow-lg"
                      : "text-secondary hover:text-primary"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your name"
                        className="w-full pl-10 pr-4 py-2.5 bg-tertiary border border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500/50 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-tertiary border border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 bg-tertiary border border-subtle rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500/50 transition-colors"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-error-500/10 border border-error-500/30 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-error-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-error-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 nova-gradient text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === "signin" ? "Sign In" : "Create Account"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-tertiary mt-6">
          By continuing, you agree to NOVA's terms and privacy policy.
        </p>
      </div>
    </div>
  );
}
