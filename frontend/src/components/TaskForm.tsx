import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTask, fetchUsers, updateTaskDetails } from '../api/tasks';
import { useAuthStore } from '../store/useAuthStore';
import { X } from 'lucide-react';
import type { Task } from '../types';
import { toast } from 'sonner';

const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  assigneeId: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onClose: () => void;
  taskToEdit?: Task | null;
}

export const TaskForm = ({ onClose, taskToEdit }: TaskFormProps) => {
  const projectId = useAuthStore(state => state.projectId);
  const queryClient = useQueryClient();
  const isEditMode = !!taskToEdit;

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

  const { register, handleSubmit, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: taskToEdit ? {
      title: taskToEdit.title,
      description: taskToEdit.description || '',
      priority: taskToEdit.priority,
      assigneeId: taskToEdit.assigneeId || ''
    } : { priority: 'MEDIUM', assigneeId: '' }
  });

  const saveMutation = useMutation({
    mutationFn: (data: TaskFormValues) => {
      const parsedAssignee = data.assigneeId === '' ? null : data.assigneeId;
      const payload = { ...data, assigneeId: parsedAssignee };

      if (isEditMode) {
        return updateTaskDetails({ taskId: taskToEdit.id, data: payload });
      }
      return createTask({ ...payload, projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      
      if (isEditMode) {
        toast.success("Task updated successfully!");
      } else {
        toast.success("Task created successfully!");
      }
      
      onClose();
    },
    onError: () => {
      toast.error("Failed to save task.");
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {isEditMode ? "Edit Task" : "New Task"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input 
              {...register('title')} 
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="What needs to be done?" 
            />
            {errors.title && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea 
              {...register('description')} 
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" 
              rows={3} 
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select {...register('priority')} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign to</label>
              <select {...register('assigneeId')} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Unassigned</option>
                {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={saveMutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saveMutation.isPending ? "Saving..." : (isEditMode ? "Save Changes" : "Add Task")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};