import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask } from "../api/tasks";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "../store/useAuthStore";
import { X } from "lucide-react";

const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"], "Priority must be Low, Medium, or High"),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
    onClose: () => void;
}

export const TaskForm = ({ onClose }: TaskFormProps) => {
    const projectId = useAuthStore(state => state.projectId);
    const queryClient = useQueryClient();

    const { register, handleSubmit, formState: { errors } } = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: { priority: "MEDIUM" },
    });

    const createMutation = useMutation({
        mutationFn: (data: TaskFormValues) => createTask({...data, projectId}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            onClose();
        }
    })

    const onSubmit = (data: TaskFormValues) => {
        createMutation.mutate(data);
    }

    return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">New Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              {...register('title')}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="What needs to be done?"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              rows={3}
              placeholder="Additional information..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              {...register('priority')}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div className="mt-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? "Saving..." : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

