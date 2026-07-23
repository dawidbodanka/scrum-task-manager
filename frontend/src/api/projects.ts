import { apiClient } from './axios';
import type { Project } from '../types';

export const fetchProjects = async (): Promise<Project[]> => {
    const response = await apiClient.get('/projects');
    return response.data;
};

export const createProject = async (project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
    const response = await apiClient.post('/projects', project);
    return response.data;
}

export const deleteProject = async (id: string) => {
    const response = await apiClient.delete(`/projects/${id}`);
    return response.data;
};