// ============================================================================
// TASK FORM MODAL COMPONENT
// ============================================================================
// A dual-purpose modal used for both Creating and Editing tasks.
// Implements strict Frontend RBAC (Role-Based Access Control) to prevent
// 'DEVELOPER' users from mutating locked fields (Title, Description, Priority)
// while allowing them to update the Status and self-assign tasks.

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../api/axios';
import { toast } from 'sonner';
import type { Task, TaskStatus, Priority, Role, ProjectMember } from '../types';

interface TaskFormProps {
    onClose: () => void;
    taskToEdit?: Task | null;
    currentUserRole: Role;
    members: ProjectMember[];
}

export const TaskForm = ({ onClose, taskToEdit, currentUserRole, members }: TaskFormProps) => {
    const { projectId, user } = useAuthStore();
    const queryClient = useQueryClient();
    
    // Determine form mode (Create vs Edit)
    const isEditing = !!taskToEdit;
    
    // RBAC Flag: Used to disable specific inputs for non-admin users
    const isDeveloper = currentUserRole === 'DEVELOPER';

    // --------------------------------------------------------------------------
    // FORM STATE
    // --------------------------------------------------------------------------
    const [formData, setFormData] = useState({
        title: taskToEdit?.title || '',
        description: taskToEdit?.description || '',
        priority: taskToEdit?.priority || 'MEDIUM',
        status: taskToEdit?.status || 'TODO',
        assigneeId: taskToEdit?.assigneeId || ''
    });

    // --------------------------------------------------------------------------
    // MUTATIONS
    // --------------------------------------------------------------------------
    
    // Handles both POST (Create) and PATCH (Update) based on the current mode
    const saveMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            if (isEditing) {
                const res = await apiClient.patch(`/tasks/${taskToEdit.id}`, data);
                return res.data;
            } else {
                const res = await apiClient.post('/tasks', { ...data, projectId });
                return res.data;
            }
        },
        onSuccess: () => {
            // Force board refresh to reflect new/updated data
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            toast.success(isEditing ? 'Task updated!' : 'Task created!');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to save task');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    // --------------------------------------------------------------------------
    // RENDER
    // --------------------------------------------------------------------------
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isEditing ? (isDeveloper ? 'View Task' : 'Edit Task') : 'Create New Task'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    
                    {/* Title Field - Disabled for Developers */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input
                            type="text"
                            required
                            disabled={isDeveloper}
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                        />
                    </div>

                    {/* Description Field - Disabled for Developers */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                            rows={3}
                            disabled={isDeveloper}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Priority Field - Disabled for Developers */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                            <select
                                disabled={isDeveloper}
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>

                        {/* Status Field - Editable by Everyone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="REVIEW">Review</option>
                                <option value="DONE">Done</option>
                            </select>
                        </div>
                    </div>

                    {/* Assignee Field - RBAC Conditional Rendering */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee</label>
                        {isDeveloper ? (
                            // Developers can only see who is assigned, or assign the task to themselves
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {formData.assigneeId 
                                        ? members.find(m => m.id === formData.assigneeId)?.name || 'Someone else' 
                                        : 'Unassigned'}
                                </span>
                                {formData.assigneeId !== user?.id && (
                                    <button 
                                        type="button" 
                                        onClick={() => setFormData({ ...formData, assigneeId: user?.id || '' })}
                                        className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
                                    >
                                        Assign to me
                                    </button>
                                )}
                            </div>
                        ) : (
                            // Admins can assign the task to anyone in the project
                            <select
                                value={formData.assigneeId}
                                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Unassigned</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saveMutation.isPending}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {saveMutation.isPending ? 'Saving...' : 'Save Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};