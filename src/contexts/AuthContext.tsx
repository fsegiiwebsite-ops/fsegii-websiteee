import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ADMIN_REFRESH_MS = 5 * 60 * 1000; // re-check admin status every 5 min

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    metadata?: Partial<Pick<Profile, "major" | "semester" | "track">>
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (
    updates: Partial<Profile>
  ) => Promise<{ data: Profile | null; error: unknown }>;
  refreshProfile: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return data as Profile | null;
  }, []);

  const checkAdmin = useCallback(async () => {
    const { data } = await supabase.rpc("is_admin");
    return !!data;
  }, []);

  const loadSession = useCallback(
    async (sess: Session | null) => {
      if (sess?.user) {
        const [prof, adminFlag] = await Promise.all([
          fetchProfile(sess.user.id),
          checkAdmin(),
        ]);
        setUser(sess.user);
        setSession(sess);
        setProfile(prof);
        setIsAdmin(adminFlag);
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    },
    [fetchProfile, checkAdmin]
  );

  // ── Boot: get existing session ───────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      loadSession(sess);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      loadSession(sess);
    });

    return () => subscription.unsubscribe();
  }, [loadSession]);

  // ── Idle timeout: auto-logout after 30 min inactivity ───────────────────────

  const idleTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!user) return;

    function resetIdle() {
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(async () => {
        await supabase.auth.signOut();
      }, IDLE_TIMEOUT_MS);
    }

    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle(); // start timer

    return () => {
      clearTimeout(idleTimer.current);
      events.forEach((e) => window.removeEventListener(e, resetIdle));
    };
  }, [user]);

  // ── Periodic admin status refresh (every 5 min) ────────────────────────────

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const fresh = await checkAdmin();
      setIsAdmin(fresh);
    }, ADMIN_REFRESH_MS);
    return () => clearInterval(interval);
  }, [user, checkAdmin]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      metadata?: Partial<Pick<Profile, "major" | "semester" | "track">>
    ) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            ...metadata,
          },
        },
      });
      return { error: error as Error | null };
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user) return { data: null, error: new Error("Not authenticated") };
      // Strip role field to prevent privilege escalation
      const { role: _stripped, ...safeUpdates } = updates as Record<string, unknown>;
      const { data, error } = await supabase
        .from("profiles")
        .update(safeUpdates)
        .eq("id", user.id)
        .select()
        .single();
      if (data) setProfile(data as Profile);
      return { data: data as Profile | null, error };
    },
    [user]
  );

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const prof = await fetchProfile(user.id);
    if (prof) setProfile(prof);
  }, [user, fetchProfile]);

  // ── Context Value ────────────────────────────────────────────────────────────

  const value: AuthContextValue = {
    user,
    session,
    profile,
    isLoading,
    isAdmin,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
