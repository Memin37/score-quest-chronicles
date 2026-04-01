import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  phone: string | null;
  isAnonymous?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  loginWithGoogle: () => Promise<string | null>;
  loginAnonymously: () => void;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const randomAdjectives = ['Hızlı', 'Cesur', 'Güçlü', 'Parlak', 'Gizli', 'Sessiz', 'Yıldız', 'Çevik', 'Akıllı', 'Kurnaz'];
const randomNouns = ['Kaplan', 'Kartal', 'Aslan', 'Kurt', 'Şahin', 'Panter', 'Tilki', 'Ejder', 'Phoenix', 'Samurai'];

function generateRandomName(): string {
  const adj = randomAdjectives[Math.floor(Math.random() * randomAdjectives.length)];
  const noun = randomNouns[Math.floor(Math.random() * randomNouns.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${noun}${num}`;
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (!data) return null;
  return { id: data.user_id, name: data.display_name, phone: data.phone };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let loadingResolved = false;
    const resolveLoading = () => {
      if (!loadingResolved) {
        loadingResolved = true;
        setLoading(false);
      }
    };

    // Safety timeout - never stay on loading screen forever
    const timeout = setTimeout(resolveLoading, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setUser(profile || { id: session.user.id, name: session.user.user_metadata?.full_name || 'Oyuncu', phone: null });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        if (session?.user) {
          setUser({ id: session.user.id, name: session.user.user_metadata?.full_name || 'Oyuncu', phone: null });
        }
      } finally {
        resolveLoading();
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setUser(profile || { id: session.user.id, name: session.user.user_metadata?.full_name || 'Oyuncu', phone: null });
        }
      } catch (err) {
        console.error('Get session error:', err);
        if (session?.user) {
          setUser({ id: session.user.id, name: session.user.user_metadata?.full_name || 'Oyuncu', phone: null });
        }
      } finally {
        resolveLoading();
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const register = async (name: string, email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    return error?.message || null;
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message || null;
  };

  const loginWithGoogle = async (): Promise<string | null> => {
    const { lovable } = await import('@/integrations/lovable/index');
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) return result.error.message;
    return null;
  };

  const loginAnonymously = () => {
    setUser({
      id: `anon-${Date.now()}`,
      name: generateRandomName(),
      phone: null,
      isAnonymous: true,
    });
  };

  const logout = async () => {
    if (user?.isAnonymous) {
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (name: string) => {
    if (!user) return;
    await supabase.from('profiles').update({ display_name: name }).eq('user_id', user.id);
    setUser({ ...user, name });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, loginAnonymously, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
