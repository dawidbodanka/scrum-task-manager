import { apiClient } from './axios';
import type { Task, TaskStatus } from '../types';

export const fetchTasks = async (projectId: string): Promise<Task[]> => {
    const response = await apiClient.get('/tasks', {
        params: { projectId },
    });
    return response.data;
}

export const updateTaskStatus = async({ taskId, status}: { taskId: string; status: TaskStatus }) => {
    const response = await apiClient.patch(`/tasks/${taskId}`, { status });
    return response.data;
}

export const createTask = async(taskData: { title: string; description?: string; priority: string; projectId: string }) => {
    const response = await apiClient.post('/tasks', taskData);
    return response.data;
}

export const deleteTask = async (taskId: string) => {
    const response = await apiClient.delete(`/tasks/${taskId}`);
    return response.data;
} 