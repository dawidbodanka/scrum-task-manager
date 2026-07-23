import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export const apiClient = axios.create({
    baseURL: 'http://localhost:3000/api',
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