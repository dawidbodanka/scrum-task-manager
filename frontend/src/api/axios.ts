import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export const apiClient = axios.create({
    baseURL: 'http://localhost:3000/api',
});

apiClient.interceptors.request.use((config) => {
    const { userId } = useAuthStore.getState();

    if(userId){
        config.headers['x-user-id'] = userId;
    }
    return config;
})