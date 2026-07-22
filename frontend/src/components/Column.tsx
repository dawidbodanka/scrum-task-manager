import { useDroppable } from '@dnd-kit/core';
import type { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
}

export const Column = ({ id, title, tasks, onEdit }: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: id });

  return (
    // ZMIANA: flex-1 sprawia, że kolumny zajmą całą dostępną szerokość po równo
    <div className={`bg-gray-100 dark:bg-gray-800 rounded-xl p-4 flex-1 min-w-[260px] max-w-[400px] min-h-full max-h-full flex flex-col gap-4 transition-colors ${isOver ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}`}>
      
      <h2 className="font-semibold text-gray-700 dark:text-gray-200 flex justify-between items-center flex-shrink-0">
        {title}
        <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
          {tasks.length}
        </span>
      </h2>
      
      <div ref={setNodeRef} className="flex flex-col gap-3 flex-1 overflow-y-auto min-h-[150px] pr-1 pb-2">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onEdit={onEdit} />
        ))}
      </div>
      
    </div>
  );
};