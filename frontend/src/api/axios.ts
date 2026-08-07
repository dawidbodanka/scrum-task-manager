import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
    baseURL: `${API_BASE_URL.replace(/\/$/, '')}/api`,
});

// Interceptor to add the userId from the auth store to the headers of each request
apiClient.interceptors.request.use((config) => {
    const state = useAuthStore.getState();

    if (state.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
    }

    if (state.user) {
        config.headers['x-user-id'] = state.user.id;
    }
    return config;
})