// ============================================================================
// MAIN BOARD COMPONENT
// ============================================================================
// Handles the core drag-and-drop interface, real-time task polling, 
// optimistic UI updates, and role-based rendering.

import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { fetchTasks, updateTaskStatus } from '../api/tasks';
import { fetchProjectMembers } from '../api/projects';
import type { TaskStatus, Task, Role } from '../types';
import { Column } from './Column';
import { TaskForm } from './TaskForm';
import { Plus, Moon, Sun, ArrowLeft, Users } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { MembersModal } from './MembersModal';

// Static definitions for columns
const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'REVIEW', title: 'Review' },
  { id: 'DONE', title: 'Done' }
];

// Used to sort tasks within columns (High priority appears first)
const PRIORITY_WEIGHT: Record<string, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const Board = () => {
  const { projectId, setProjectId, user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // Local UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  
  // Drag & Drop specific state
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // Theme Management (Persisted in localStorage)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // --------------------------------------------------------------------------
  // DATA FETCHING & SYNC
  // --------------------------------------------------------------------------

  // Fetch tasks with Background Polling for real-time synchronization
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => projectId ? fetchTasks(projectId) : Promise.resolve([]),
    enabled: !!projectId,
    refetchInterval: 3000, // Silently refresh data every 3s to reflect team changes
  });

  // Fetch team members to determine the current user's permissions
  const { data: members } = useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: () => projectId ? fetchProjectMembers(projectId) : Promise.resolve([]),
    enabled: !!projectId,
  });

  // Role-Based Access Control (RBAC) on the frontend
  const currentUserRole: Role = members?.find(m => m.id === user?.id)?.role || 'DEVELOPER';
  const isAdmin = currentUserRole === 'ADMIN';

  // --------------------------------------------------------------------------
  // OPTIMISTIC MUTATIONS (DRAG & DROP)
  // --------------------------------------------------------------------------

  // Updates task status with "Optimistic UI" approach:
  // We update the UI instantly before the server responds, and rollback if the request fails.
  const updateMutation = useMutation({
    mutationFn: updateTaskStatus,
    onMutate: async ({ taskId, status }) => {
      if (!projectId) return;
      
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      
      // Snapshot the previous value for rollback capability
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId]);

      // Optimistically update the cache with the new task status
      queryClient.setQueryData<Task[]>(['tasks', projectId], (oldTasks) => {
        if (!oldTasks) return [];
        return oldTasks.map(task => 
          task.id === taskId ? { ...task, status } : task
        );
      });

      return { previousTasks };
    },
    // Rollback UI to previous snapshot if the server request fails
    onError: (err, _, context) => {
      if (context?.previousTasks && projectId) {
        queryClient.setQueryData(['tasks', projectId], context.previousTasks);
      }
      console.error("Error moving task:", err);
    },
    // Always refetch after error or success to guarantee synchronization
    onSettled: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      }
    },
  });

  // --------------------------------------------------------------------------
  // DRAG & DROP HANDLERS
  // --------------------------------------------------------------------------

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks?.find(t => t.id === taskId);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    
    if (!over) return; // Dropped outside a valid column

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks?.find(t => t.id === taskId);
    
    // Only trigger mutation if the column actually changed
    if (task && task.status !== newStatus) {
      updateMutation.mutate({ taskId, status: newStatus });
    }
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  if (isLoading) return <div className="p-8 text-xl dark:text-white">Loading board...</div>;
  if (error) return <div className="p-8 text-xl text-red-500">Connection error.</div>;

  return (
    <div className="w-full h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col font-sans">
      
      {/* HEADER SECTION */}
      <div className="p-6 md:p-8 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setProjectId(null)}
            className="p-2 -ml-2 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Back to projects"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Sprint Board</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button 
            onClick={() => setIsMembersModalOpen(true)}
            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors shadow-sm font-medium"
          >
            <Users size={18} />
            <span className="hidden sm:inline">Team</span>
          </button>

          {/* RBAC: Only project ADMINs can create new tasks */}
          {isAdmin && (
            <button 
              onClick={() => { setTaskToEdit(null); setIsFormOpen(true); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm font-medium"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          )}
        </div>
      </div>
      
      {/* KANBAN BOARD SECTION */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 md:gap-6 flex-1 overflow-x-auto px-6 md:px-8 pb-8 items-start justify-center">
          {COLUMNS.map((column) => (
            <Column 
              key={column.id} 
              id={column.id} 
              title={column.title} 
              // Inject filtered and priority-sorted tasks into the column
              tasks={
                tasks
                  ?.filter(t => t.status === column.id)
                  .sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]) || []
              } 
              onEdit={(task) => { setTaskToEdit(task); setIsFormOpen(true); }}
            />
          ))}
        </div>
        
        {/* Visual overlay for the item currently being dragged */}
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <TaskCard task={activeTask} onEdit={() => {}} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* MODALS SECTION */}
      {isMembersModalOpen && projectId && (
        <MembersModal 
          projectId={projectId} 
          onClose={() => setIsMembersModalOpen(false)} 
          currentUserRole={currentUserRole} 
        />
      )}

      {isFormOpen && (
        <TaskForm 
          onClose={() => setIsFormOpen(false)} 
          taskToEdit={taskToEdit} 
          currentUserRole={currentUserRole}
          members={members || []}
        />
      )}
    </div>
  );
};