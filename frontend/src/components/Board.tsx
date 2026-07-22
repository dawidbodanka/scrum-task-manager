import { useState } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { fetchTasks, updateTaskStatus } from '../api/tasks';
import type { TaskStatus } from '../types';
import { Column } from './Column';
import { TaskForm } from './TaskForm';
import { Plus } from 'lucide-react';

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'REVIEW', title: 'Review' },
  { id: 'DONE', title: 'Done' }
];

export const Board = () => {
  const projectId = useAuthStore((state) => state.projectId);
  const queryClient = useQueryClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => fetchTasks(projectId),
  });

  const updateMutation = useMutation({
    mutationFn: updateTaskStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks?.find(t => t.id === taskId);
    
    if (task && task.status !== newStatus) {
      updateMutation.mutate({ taskId, status: newStatus });
    }
  };

  if (isLoading) return <div className="p-8 text-xl">Loading table...</div>;
  if (error) return <div className="p-8 text-xl text-red-500">Connection error.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Sprint Board</h1>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Add Task
        </button>
      </div>
      
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 flex-1 overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <Column 
              key={column.id} 
              id={column.id} 
              title={column.title} 
              tasks={tasks?.filter(t => t.status === column.id) || []} 
            />
          ))}
        </div>
      </DndContext>

      {isFormOpen && <TaskForm onClose={() => setIsFormOpen(false)} />}
    </div>
  );
};