import { create } from 'zustand';

interface AuthState {
  userId: string;
  projectId: string;
  setUserId: (id: string) => void;
  setProjectId: (id: string) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
    userId: '28d81dbb-3fea-4e0d-a451-80ebf4e6585b',     
    projectId: '964cdb6f-68ec-48a9-838a-c79d18640691',
  
  setUserId: (id) => set({ userId: id }),
  setProjectId: (id) => set({ projectId: id }),
}));