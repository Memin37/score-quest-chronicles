import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => boolean;
  register: (name: string, phone: string, password: string) => boolean;
  logout: () => void;
  updateProfile: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface StoredUser {
  id: string;
  name: string;
  phone: string;
  password: string;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const getUsers = (): StoredUser[] => {
    return JSON.parse(localStorage.getItem('users') || '[]');
  };

  const saveUsers = (users: StoredUser[]) => {
    localStorage.setItem('users', JSON.stringify(users));
  };

  const register = (name: string, phone: string, password: string): boolean => {
    const users = getUsers();
    if (users.find(u => u.phone === phone)) return false;
    const newUser: StoredUser = { id: crypto.randomUUID(), name, phone, password };
    saveUsers([...users, newUser]);
    const { password: _, ...publicUser } = newUser;
    setUser(publicUser);
    localStorage.setItem('currentUser', JSON.stringify(publicUser));
    return true;
  };

  const login = (phone: string, password: string): boolean => {
    const users = getUsers();
    const found = users.find(u => u.phone === phone && u.password === password);
    if (!found) return false;
    const { password: _, ...publicUser } = found;
    setUser(publicUser);
    localStorage.setItem('currentUser', JSON.stringify(publicUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const updateProfile = (name: string) => {
    if (!user) return;
    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx].name = name;
      saveUsers(users);
    }
    const updated = { ...user, name };
    setUser(updated);
    localStorage.setItem('currentUser', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
