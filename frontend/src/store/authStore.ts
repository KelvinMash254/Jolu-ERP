import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Company } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  currentCompany: Company | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setCurrentCompany: (company: Company) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      currentCompany: null,
      setAuth: (user, accessToken, refreshToken) => {
        const primary = user.companies.find((c) => c.isPrimary) || user.companies[0];
        set({ user, accessToken, refreshToken, currentCompany: primary || null });
      },
      setCurrentCompany: (company) => set({ currentCompany: company }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, currentCompany: null }),
    }),
    { name: 'jolu-auth' }
  )
);
