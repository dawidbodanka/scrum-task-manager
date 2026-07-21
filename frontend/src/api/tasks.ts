import { apiClient } from './axios';
import type { Task } from '../types';

export const fetchTasks = async (projectId: string): Promise<Task[]> => {
    const response = await apiClient.get('/tasks', {
        params: { projectId },
    });
    return response.data;
}