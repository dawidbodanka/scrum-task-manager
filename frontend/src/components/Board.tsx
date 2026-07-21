import { useQuery } from "@tanstack/react-query";
import { fetchTasks } from "../api/tasks";
import { useAuthStore } from "../store/useAuthStore";

export const Board = () => {
    const projectId = useAuthStore((state) => state.projectId);

    const { data: tasks, isLoading, error } = useQuery({
        queryKey: ['tasks', projectId],
        queryFn: () => fetchTasks(projectId),
    });

    if (isLoading) {
        return <div className="p-8 text-xl">Loading board...</div>;
    }

    if(error) {
        return <div className="p-8 text-xl text-red-500">Error loading board: {error instanceof Error ? error.message : 'Unknown error'}</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Sprint Board</h1>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold mb-4">Tasks</h2>
                <pre className="bg-gray-50 p-4 rounded overflow-auto">
                    {JSON.stringify(tasks, null, 2)}
                </pre>
            </div>
        </div>
    )
}   