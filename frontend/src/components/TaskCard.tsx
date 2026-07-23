import { useDraggable } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, User as UserIcon, Edit2 } from 'lucide-react';
import type { Task } from '../types';
import { deleteTask } from '../api/tasks';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  isOverlay?: boolean;
}

const getInitials = (name: string) => {
  return name ? name.substring(0, 1).toUpperCase() : '?';
};

export const TaskCard = ({ task, onEdit, isOverlay }: TaskCardProps) => {
  const projectId = useAuthStore(state => state.projectId);
  const queryClient = useQueryClient();

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    disabled: isOverlay,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success("Task deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete task");
    }
  });

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      {...(isOverlay ? {} : listeners)}
      {...(isOverlay ? {} : attributes)}
      className={`bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 transition-all flex flex-col group
        ${isOverlay ? 'shadow-2xl scale-105 rotate-2 cursor-grabbing z-50' : 'shadow-sm hover:shadow-md cursor-grab z-10'}
        ${isDragging && !isOverlay ? 'opacity-30' : 'opacity-100'}`}
    >
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">{task.title}</h3>
        
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onPointerDown={(e) => { e.stopPropagation(); onEdit(task); }}
            className="text-gray-400 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
            title="Edit task"
          >
            <Edit2 size={16} />
          </button>
          
          <button
            onPointerDown={(e) => { e.stopPropagation(); deleteMutation.mutate(task.id); }}
            className="text-gray-400 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
          {task.description}
        </p>
      )}
      
      <div className="mt-4 flex justify-between items-center text-xs">
        <span className={`px-2 py-1 rounded-full font-medium
          ${task.priority === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
          {task.priority}
        </span>

        {task.assignee ? (
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold flex items-center justify-center border border-blue-200 dark:border-blue-800" title={task.assignee.name}>
            {getInitials(task.assignee.name)}
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 dark:bg-gray-600 dark:text-gray-300 flex items-center justify-center border border-gray-200 dark:border-gray-500" title="Unassigned">
            <UserIcon size={14} />
          </div>
        )}
      </div>
    </div>
  );
};