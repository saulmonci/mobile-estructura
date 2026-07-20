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

const usePromovidosStore = create(
  persist(
    (set, get) => ({
      promovidos: [],
      
      addPromovido: (promovido) => set((state) => ({
        promovidos: [...state.promovidos, { 
          ...promovido, 
          local_id: Date.now().toString(), 
          status: 'pending_sync' 
        }]
      })),
      
      updatePromovido: (local_id, updatedData) => set((state) => ({
        promovidos: state.promovidos.map(p => p.local_id === local_id ? { ...p, ...updatedData } : p)
      })),
      
      removePromovido: (local_id) => set((state) => ({
        promovidos: state.promovidos.filter(p => p.local_id !== local_id)
      })),
      
      // Called when sync is successful to clean up synced records
      removeSynced: (synced_ids) => set((state) => ({
        promovidos: state.promovidos.filter(p => !synced_ids.includes(p.local_id))
      })),

      clearPromovidos: () => set({ promovidos: [] })
    }),
    {
      name: 'promovidos-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);

export default usePromovidosStore;
