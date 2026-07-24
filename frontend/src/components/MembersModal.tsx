// ============================================================================
// MEMBERS MODAL COMPONENT
// ============================================================================
// Provides a user interface for viewing, inviting, and removing project members.
// Heavily relies on Role-Based Access Control (RBAC) to show/hide administrative actions.

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProjectMembers, inviteProjectMember, removeProjectMember } from '../api/projects';
import { useAuthStore } from '../store/useAuthStore';
import { X, UserPlus, Trash2, Shield, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MembersModalProps {
    projectId: string;
    onClose: () => void;
    currentUserRole: 'ADMIN' | 'DEVELOPER';
}

export const MembersModal = ({ projectId, onClose, currentUserRole }: MembersModalProps) => {
    const [inviteEmail, setInviteEmail] = useState('');
    const queryClient = useQueryClient();
    
    // Extract current user ID to prevent admins from deleting themselves
    const currentUserId = useAuthStore((state) => state.user?.id);

    // --------------------------------------------------------------------------
    // DATA FETCHING & MUTATIONS
    // --------------------------------------------------------------------------

    // Fetch the current list of project members
    const { data: members, isLoading } = useQuery({
        queryKey: ['projectMembers', projectId],
        queryFn: () => fetchProjectMembers(projectId),
    });

    // Mutation: Invite a new member
    const inviteMutation = useMutation({
        mutationFn: inviteProjectMember,
        onSuccess: () => {
            // Force a background refetch of the members list to show the new user instantly
            queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
            setInviteEmail('');
            toast.success('Member invited successfully!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to invite member');
        }
    });

    // Mutation: Remove an existing member
    const removeMutation = useMutation({
        mutationFn: removeProjectMember,
        onSuccess: () => {
            // Force a background refetch to remove the user from the UI instantly
            queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
            toast.success('Member removed successfully!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to remove member');
        }
    });

    // --------------------------------------------------------------------------
    // EVENT HANDLERS
    // --------------------------------------------------------------------------

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;
        inviteMutation.mutate({ projectId, email: inviteEmail.trim() });
    };

    const handleRemove = (memberId: string) => {
        if (confirm("Are you sure you want to remove this member from the project?")) {
            removeMutation.mutate({ projectId, memberId });
        }
    };

    const isAdmin = currentUserRole === 'ADMIN';

    // --------------------------------------------------------------------------
    // RENDER
    // --------------------------------------------------------------------------

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Project Members</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    
                    {/* Invite Form - Strictly visible to Admins only (UI RBAC) */}
                    {isAdmin && (
                        <form onSubmit={handleInvite} className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Email address to invite..."
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <button
                                type="submit"
                                disabled={inviteMutation.isPending || !inviteEmail.trim()}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <UserPlus size={16} />
                                Invite
                            </button>
                        </form>
                    )}

                    {/* Members Directory */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Team ({members?.length || 0})
                        </h3>
                        
                        {isLoading ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="animate-spin text-gray-400" size={24} />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
                                {members?.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                        
                                        {/* Member Info & Avatar */}
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${member.role === 'ADMIN' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                {member.role === 'ADMIN' ? <Shield size={16} /> : <User size={16} />}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {member.name} {member.id === currentUserId && "(You)"}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {member.email}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 
                                          Remove Button - Requires ADMIN role. 
                                          Additionally prevents admins from removing themselves. 
                                        */}
                                        {isAdmin && member.id !== currentUserId && (
                                            <button
                                                onClick={() => handleRemove(member.id)}
                                                disabled={removeMutation.isPending}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0"
                                                title="Remove member"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};