import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { fetchTasks, updateTaskStatus } from '../api/tasks';
import { fetchProjectMembers } from '../api/projects'; // NEW IMPORT
import type { TaskStatus, Task, Role } from '../types';
import { Column } from './Column';
import { TaskForm } from './TaskForm';
import { Plus, Moon, Sun, ArrowLeft, Users } from 'lucide-react'; // ADDED Users ICON
import { TaskCard } from './TaskCard';
import { MembersModal } from './MembersModal'; // NEW IMPORT

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'REVIEW', title: 'Review' },
  { id: 'DONE', title: 'Done' }
];

const PRIORITY_WEIGHT: Record<string, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const Board = () => {
  const { projectId, setProjectId, user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
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

 // Fetch tasks
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => projectId ? fetchTasks(projectId) : Promise.resolve([]),
    enabled: !!projectId,
    refetchInterval: 3000, // FIX: Background polling every 3 seconds for real-time sync
  });

  // Fetch members to determine current user's role
  const { data: members } = useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: () => projectId ? fetchProjectMembers(projectId) : Promise.resolve([]),
    enabled: !!projectId,
  });

  // Determine current user's role in this project (Default to DEVELOPER if not found yet)
  const currentUserRole: Role = members?.find(m => m.id === user?.id)?.role || 'DEVELOPER';
  const isAdmin = currentUserRole === 'ADMIN';

  const updateMutation = useMutation({
    mutationFn: updateTaskStatus,
    onMutate: async ({ taskId, status }) => {
      if (!projectId) return;
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId]);

      queryClient.setQueryData<Task[]>(['tasks', projectId], (oldTasks) => {
        if (!oldTasks) return [];
        return oldTasks.map(task => 
          task.id === taskId ? { ...task, status } : task
        );
      });

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks && projectId) {
        queryClient.setQueryData(['tasks', projectId], context.previousTasks);
      }
      console.error("Error moving task:", err);
    },
    onSettled: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      }
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks?.find(t => t.id === taskId);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks?.find(t => t.id === taskId);
    
    if (task && task.status !== newStatus) {
      updateMutation.mutate({ taskId, status: newStatus });
    }
  };

  if (isLoading) return <div className="p-8 text-xl dark:text-white">Loading board...</div>;
  if (error) return <div className="p-8 text-xl text-red-500">Connection error.</div>;

  return (
    <div className="w-full h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col font-sans">
      
      <div className="p-6 md:p-8 flex justify-between items-center flex-shrink-0">
        
        {/* LEFT HEADER: Back button + Title */}
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
        
        {/* RIGHT HEADER: Theme, Team, Add Task */}
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

          {/* ONLY ADMIN CAN SEE "ADD TASK" BUTTON */}
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
      
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 md:gap-6 flex-1 overflow-x-auto px-6 md:px-8 pb-8 items-start justify-center">
          {COLUMNS.map((column) => (
            <Column 
              key={column.id} 
              id={column.id} 
              title={column.title} 
              tasks={
                tasks
                  ?.filter(t => t.status === column.id)
                  .sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]) || []
              } 
              onEdit={(task) => { setTaskToEdit(task); setIsFormOpen(true); }}
            />
          ))}
        </div>
        
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <TaskCard task={activeTask} onEdit={() => {}} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* MODALS */}
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