import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { UserProfile, PlanTier, AuthState } from "@/types";

interface SignUpResult {
  error: string | null;
  needsConfirmation?: boolean;
  user?: User | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authState: AuthState;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<SignUpResult>;
  resendConfirmation: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>;
  setAuthState: (state: AuthState) => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>("INITIALIZING");
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("[Auth] Error fetching profile:", error.message);
        return;
      }

      if (data) {
        setProfile(data as UserProfile);
      } else {
        // Safe profile initialization
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({ id: userId, email: "", plan: "free" as PlanTier })
          .select("*")
          .maybeSingle();
        if (createError) {
          console.warn("[Auth] Non-blocking profile auto-creation notice:", createError.message);
        }
        if (newProfile) setProfile(newProfile as UserProfile);
      }
    } catch (err) {
      console.warn("[Auth] Profile retrieval error:", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;
        if (error) {
          console.error("[Auth] Initial session error:", error.message);
          setAuthError(error.message);
          setAuthState("ERROR");
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setAuthState("AUTHENTICATED");
          fetchProfile(session.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          setAuthState("UNAUTHENTICATED");
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("[Auth] getSession fatal:", err);
        setAuthState("UNAUTHENTICATED");
        setLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        switch (event) {
          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
          case "USER_UPDATED":
            if (currentSession?.user) {
              setAuthState("AUTHENTICATED");
              await fetchProfile(currentSession.user.id);
            }
            break;
          case "SIGNED_OUT":
            setAuthState("UNAUTHENTICATED");
            setProfile(null);
            break;
          case "INITIAL_SESSION":
            if (currentSession?.user) {
              setAuthState("AUTHENTICATED");
              await fetchProfile(currentSession.user.id);
            } else {
              setAuthState("UNAUTHENTICATED");
            }
            break;
          default:
            break;
        }
      },
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthState("SIGNING_IN");
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthState("ERROR");
        setAuthError(error.message);
        return { error: error.message };
      }
      setSession(data.session);
      setUser(data.user);
      setAuthState("AUTHENTICATED");
      return { error: null };
    } catch (err: any) {
      const msg = err?.message || "Failed to sign in";
      setAuthState("ERROR");
      setAuthError(msg);
      return { error: msg };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
  ): Promise<SignUpResult> => {
    setAuthState("SIGNING_UP");
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName ?? "" } },
      });

      if (error) {
        setAuthState("ERROR");
        setAuthError(error.message);
        return { error: error.message };
      }

      // Check if email confirmation is required (user created but no session)
      if (data?.user && !data?.session) {
        setAuthState("AWAITING_EMAIL_CONFIRMATION");
        return { error: null, needsConfirmation: true, user: data.user };
      }

      if (data?.session) {
        setSession(data.session);
        setUser(data.user);
        setAuthState("AUTHENTICATED");
        return { error: null, needsConfirmation: false, user: data.user };
      }

      return { error: null, needsConfirmation: false, user: data?.user ?? null };
    } catch (err: any) {
      const msg = err?.message || "Failed to sign up";
      setAuthState("ERROR");
      setAuthError(msg);
      return { error: msg };
    }
  };

  const resendConfirmation = async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || "Failed to resend confirmation email" };
    }
  };

  const signOut = async () => {
    setAuthState("SIGNING_OUT");
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("[Auth] Sign out error:", err);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setAuthState("UNAUTHENTICATED");
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: "Not authenticated" };
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (!error) await refreshProfile();
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        authState,
        authError,
        signIn,
        signUp,
        resendConfirmation,
        signOut,
        refreshProfile,
        updateProfile,
        setAuthState,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
