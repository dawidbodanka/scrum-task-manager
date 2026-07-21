export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: Priority;
    projectId: string;
    assigneeId: string | null;
    createdAt: string;
}