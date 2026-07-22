import { useDroppable } from '@dnd-kit/core';
import type { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

export const Column = ({ id, title, tasks }: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div className={`bg-gray-100 rounded-xl p-4 min-w-[300px] w-[300px] flex flex-col gap-4 flex-shrink-0 transition-colors ${isOver ? 'bg-blue-50' : ''}`}>
      <h2 className="font-semibold text-gray-700 flex justify-between items-center">
        {title}
        <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
          {tasks.length}
        </span>
      </h2>
      
      {/* Droppable area for tasks */}
      <div ref={setNodeRef} className="flex flex-col gap-3 flex-1 min-h-[150px]">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};