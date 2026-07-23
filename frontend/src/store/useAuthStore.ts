import { create } from 'zustand';

interface AuthState {
  userId: string;
  projectId: string | null;
  setUserId: (id: string) => void;
  setProjectId: (id: string | null) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  userId: '28d81dbb-3fea-4e0d-a451-80ebf4e6585b',
  projectId: null, // Initialize projectId as null

  setUserId: (id) => set({ userId: id }),
  setProjectId: (id) => set({ projectId: id }),
}));