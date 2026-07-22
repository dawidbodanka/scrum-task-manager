import { useDraggable } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import type { Task } from '../types';
import { deleteTask } from '../api/tasks';
import { useAuthStore } from '../store/useAuthStore';

interface TaskCardProps {
  task: Task;
}

export const TaskCard = ({ task }: TaskCardProps) => {
  const projectId = useAuthStore(state => state.projectId);
  const queryClient = useQueryClient();

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Mutacja do usuwania zadania
  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      // Odświeżamy tablicę po usunięciu
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    }
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-grab hover:shadow-md transition-shadow active:opacity-80 z-10 group"
    >
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-medium text-gray-900">{task.title}</h3>
        
        {/* Przycisk usuwania (pojawia się przy najechaniu myszką) */}
        <button
            onPointerDown={(e) => {
                e.stopPropagation(); // Blokuje rozpoczęcie przeciągania
                deleteMutation.mutate(task.id); // Od razu odpala usuwanie!
            }}
            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Usuń zadanie"
            >
            <Trash2 size={16} />
        </button>
      </div>
      
      {task.description && (
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {task.description}
        </p>
      )}
      
      <div className="mt-3 flex justify-between items-center text-xs">
        <span className={`px-2 py-1 rounded-full font-medium
          ${task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
            task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'}`}>
          {task.priority}
        </span>
      </div>
    </div>
  );
};