// ============================================================================
// PROJECT LIST COMPONENT (WORKSPACE DASHBOARD)
// ============================================================================
// This component serves as the user's dashboard after logging in.
// It displays available projects, allows creating new ones, and handles global
// application state like Theme (Dark/Light mode) and User Logout.

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProjects, createProject, deleteProject } from '../api/projects';
import { useAuthStore } from '../store/useAuthStore';
import { Folder, Plus, Moon, Sun, Loader2, LogOut, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const ProjectList = () => {
  const { setProjectId, logout, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [newProjectName, setNewProjectName] = useState('');
  
  // --------------------------------------------------------------------------
  // THEME MANAGEMENT
  // --------------------------------------------------------------------------
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // --------------------------------------------------------------------------
  // DATA FETCHING & MUTATIONS
  // --------------------------------------------------------------------------
  
  // Fetch all projects the authenticated user has access to
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  // Create Project Mutation
  const createMutation = useMutation({
    mutationFn: (name: string) => createProject({ name, description: 'Workspace' }),
    onSuccess: () => {
      // Invalidate the cache to force a re-fetch of the projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setNewProjectName('');
      toast.success('Project created successfully!');
    },
    onError: () => {
      toast.error('Failed to create project.');
    }
  });

  // Delete Project Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      // Invalidate the cache to remove the deleted project from the UI
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully!');
    },
    onError: () => {
      // Fallback error, primarily catches unauthorized deletion attempts (RBAC)
      toast.error('Failed to delete project. Make sure you are an admin.');
    }
  });

  // --------------------------------------------------------------------------
  // EVENT HANDLERS
  // --------------------------------------------------------------------------

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    createMutation.mutate(newProjectName);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    // Prevent the click event from bubbling up to the project card (which would open the board)
    e.stopPropagation(); 
    if (confirm("Are you sure you want to delete this project and all its tasks?")) {
      deleteMutation.mutate(id);
    }
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 transition-colors font-sans p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">My Workspaces</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Welcome back, <span className="font-semibold text-gray-800 dark:text-gray-200">{user?.name}</span>. Select a project.
            </p>
          </div>
          
          {/* Global Controls: Theme & Logout */}
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2.5 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <button 
              onClick={logout}
              className="flex items-center gap-2 p-2.5 px-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
            >
              <LogOut size={20} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* PROJECTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* CREATE NEW PROJECT CARD */}
          <form 
            onSubmit={handleCreate}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col justify-center items-center text-center gap-4 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
          >
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <input 
              type="text" 
              placeholder="New project name..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full text-center bg-transparent border-b border-gray-200 dark:border-gray-700 pb-1 text-gray-800 dark:text-white outline-none focus:border-blue-500"
            />
            <button 
              type="submit"
              disabled={createMutation.isPending || !newProjectName.trim()}
              className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </form>

          {/* PROJECT CARDS LIST */}
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-gray-500">
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : (
            projects?.map((project) => (
              <button
                key={project.id}
                onClick={() => setProjectId(project.id)}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 flex flex-col text-left transition-all hover:-translate-y-1 group relative"
              >
                <div className="flex justify-between items-start w-full mb-4">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-400 transition-colors">
                    <Folder size={20} />
                  </div>
                  
                  {/* Delete Project Button - Appears on hover */}
                  <div 
                    onClick={(e) => handleDelete(e, project.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete project"
                  >
                    <Trash2 size={18} />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">{project.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-auto pt-2">
                  Open board &rarr;
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};