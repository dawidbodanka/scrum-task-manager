import { apiClient } from './axios';

export const loginUser = async (data: any) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
}

export const registerUser = async (data: any) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
}