import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  projectId: string | null;

  login: (token: string, user: User) => void;
  logout: () => void;
  setProjectId: (id: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // On initialization, load token and user from localStorage if they exist
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null,
  projectId: null,

  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, projectId: null });
  },

  setProjectId: (id) => set({ projectId: id }),
}));