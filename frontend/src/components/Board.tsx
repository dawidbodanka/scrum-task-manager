import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { fetchTasks, updateTaskStatus } from '../api/tasks';
import type { TaskStatus, Task } from '../types';
import { Column } from './Column';
import { TaskForm } from './TaskForm';
import { Plus, Moon, Sun } from 'lucide-react';
import { TaskCard } from './TaskCard';

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
  const projectId = useAuthStore((state) => state.projectId);
  const queryClient = useQueryClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  
  // Stan przechowujący aktualnie przeciągane zadanie
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
// 1. Sprawdzamy localStorage lub ustawienia systemu Windows/Mac na starcie
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Jeśli użytkownik jest tu pierwszy raz, sprawdź czy ma ciemny system
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // 2. Kiedy zmieniamy motyw, zapisujemy go do localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => fetchTasks(projectId),
  });

  const updateMutation = useMutation({
    mutationFn: updateTaskStatus,
    
    // OPTYMISTYCZNA AKTUALIZACJA
    onMutate: async ({ taskId, status }) => {
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
    
    // OBSŁUGA BŁĘDÓW SERWERA
    onError: (error, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId], context.previousTasks);
      }
      console.error("Błąd podczas przenoszenia zadania:", error);
    },
    
    // OSTATECZNE ODŚWIEŻENIE W TLE
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks?.find(t => t.id === taskId);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null); // Ukrywa "latający" klocek
    
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
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Sprint Board</h1>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>

          <button 
            onClick={() => { setTaskToEdit(null); setIsFormOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Add Task
          </button>
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
        
        {/* WARSTWA WIDEO DLA KAFELKA W TRAKCIE DRAG & DROP */}
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <TaskCard task={activeTask} onEdit={() => {}} isOverlay />
          ) : null}
        </DragOverlay>
        
      </DndContext>

      {isFormOpen && <TaskForm onClose={() => setIsFormOpen(false)} taskToEdit={taskToEdit} />}
    </div>
  );
};