// ============================================================================
// COLUMN COMPONENT
// ============================================================================
// Represents a single column on the Kanban board (e.g., "To Do", "Done").
// Acts as a "Droppable" zone for the @dnd-kit drag-and-drop context.

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
  // Register this component as a valid drop target in the DndContext
  // 'isOver' provides boolean feedback when a draggable item hovers over this column
  const { setNodeRef, isOver } = useDroppable({ id: id });

  return (
    // Flex-1 ensures columns share available width equally, with min/max constraints
    // Dynamic ring styling provides visual feedback during drag operations
    <div 
      className={`bg-gray-100 dark:bg-gray-800 rounded-xl p-4 flex-1 min-w-65 max-w-100 min-h-full max-h-full flex flex-col gap-4 transition-colors ${
        isOver ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''
      }`}
    >
      
      {/* Column Header: Title and Task Counter */}
      <h2 className="font-semibold text-gray-700 dark:text-gray-200 flex justify-between items-center shrink-0">
        {title}
        <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
          {tasks.length}
        </span>
      </h2>
      
      {/* Droppable Area: The ref connects this DOM node to dnd-kit */}
      <div 
        ref={setNodeRef} 
        className="flex flex-col gap-3 flex-1 overflow-y-auto min-h-37.5 pr-1 pb-2"
      >
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onEdit={onEdit} />
        ))}
      </div>
      
    </div>
  );
};