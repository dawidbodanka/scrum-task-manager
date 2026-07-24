import { apiClient } from './axios';
import type { Project, ProjectMember } from '../types';

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

// ======================= MEMBERS API =======================

export const fetchProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
    const response = await apiClient.get(`/projects/${projectId}/members`);
    return response.data;
};

export const inviteProjectMember = async ({ projectId, email }: { projectId: string; email: string }) => {
    const response = await apiClient.post(`/projects/${projectId}/members`, { email });
    return response.data;
};

export const removeProjectMember = async ({ projectId, memberId }: { projectId: string; memberId: string }) => {
    const response = await apiClient.delete(`/projects/${projectId}/members/${memberId}`);
    return response.data;
};