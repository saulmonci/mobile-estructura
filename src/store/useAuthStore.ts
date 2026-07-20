import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

export interface User {
  id: number | string;
  name?: string;
  email?: string;
  state_id?: string | number;
  municipality_id?: string | number;
  demarcacion_id?: string | number;
  presidente_id?: string | number;
  [key: string]: any;
}

export interface Catalogos {
  municipalities?: any[];
  demarcaciones?: any[];
  secciones?: any[];
  [key: string]: any;
}

interface AuthState {
  token: string | null;
  user: User | null;
  catalogos: Catalogos | null;
  setAuth: (token: string, user: User) => void;
  setCatalogos: (catalogos: Catalogos) => void;
  logout: () => void;
}

const storage = {
  getItem: async (name: string) => {
    const value = await localforage.getItem(name);
    return value ? JSON.parse(value as string) : null;
  },
  setItem: async (name: string, value: any) => {
    await localforage.setItem(name, JSON.stringify(value));
  },
  removeItem: async (name: string) => {
    await localforage.removeItem(name);
  },
};

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      catalogos: null,
      
      setAuth: (token, user) => set({ token, user }),
      setCatalogos: (catalogos) => set({ catalogos }),
      logout: () => set({ token: null, user: null, catalogos: null })
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);

export default useAuthStore;
