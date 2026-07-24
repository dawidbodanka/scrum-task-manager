export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type Role = 'ADMIN' | 'DEVELOPER';

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: Priority;
    projectId: string;
    assigneeId: string | null;
    createdAt: string;
    assignee?: {
        name: string;
        email: string;
    } | null;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
}

export interface ProjectMember {
    id: string; // User ID
    name: string;
    email: string;
    role: Role;
}

export const isTypesFileLoaded = true;