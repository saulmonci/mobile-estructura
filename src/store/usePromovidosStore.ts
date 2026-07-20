import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

export interface Promovido {
  local_id: string;
  status: string;
  nombre?: string;
  apellidos?: string;
  clave_elector?: string;
  curp?: string;
  calle?: string;
  numero?: string;
  colonia?: string;
  codigo_postal?: string;
  telefono?: string;
  state_id?: string | number;
  municipality_id?: string | number;
  demarcacion_id?: string | number;
  seccion_electoral?: string | number;
  promotor_id?: string | number;
  presidente_id?: string | number;
  ine_frente?: string | null;
  ine_reverso?: string | null;
  foto?: string | null;
  [key: string]: any;
}

interface PromovidosState {
  promovidos: Promovido[];
  addPromovido: (promovido: Omit<Promovido, 'local_id' | 'status'>) => void;
  updatePromovido: (local_id: string, updatedData: Partial<Promovido>) => void;
  removePromovido: (local_id: string) => void;
  removeSynced: (synced_ids: string[]) => void;
  clearPromovidos: () => void;
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

const usePromovidosStore = create<PromovidosState>()(
  persist(
    (set) => ({
      promovidos: [],
      
      addPromovido: (promovido) => set((state) => ({
        promovidos: [...state.promovidos, { 
          ...promovido, 
          local_id: Date.now().toString(), 
          status: 'pending_sync' 
        } as Promovido]
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
