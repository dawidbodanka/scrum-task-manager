import { apiClient } from './axios';
import type { Task, TaskStatus, User } from '../types';

export const fetchTasks = async (projectId: string): Promise<Task[]> => {
    const response = await apiClient.get('/tasks', {
        params: { projectId },
    });
    return response.data;
}

export const updateTaskStatus = async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
    const response = await apiClient.patch(`/tasks/${taskId}`, { status });
    return response.data;
}

export const createTask = async (taskData: {
    title: string;
    description?: string;
    priority: string;
    projectId: string;
    assigneeId?: string | null;
}) => {
    const response = await apiClient.post('/tasks', taskData);
    return response.data;
};

export const deleteTask = async (taskId: string) => {
    const response = await apiClient.delete(`/tasks/${taskId}`);
    return response.data;
}

export const fetchUsers = async (): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return response.data;
};

// --- ADD THIS FUNCTION ---
export const updateTaskDetails = async ({ taskId, data }: { taskId: string; data: Partial<Task> }) => {
    const response = await apiClient.patch(`/tasks/${taskId}`, data);
    return response.data;
};