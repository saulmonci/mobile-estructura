import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

const storage = {
  getItem: async (name) => {
    const value = await localforage.getItem(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: async (name, value) => {
    await localforage.setItem(name, JSON.stringify(value));
  },
  removeItem: async (name) => {
    await localforage.removeItem(name);
  },
};

const useAuthStore = create(
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
