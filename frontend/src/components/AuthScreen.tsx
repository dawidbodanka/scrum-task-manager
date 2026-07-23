import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { loginUser, registerUser } from '../api/auth';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const login = useAuthStore(state => state.login);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const authMutation = useMutation({
    mutationFn: (data: typeof formData) => isLogin ? loginUser(data) : registerUser(data),
    onSuccess: (data) => {
      login(data.token, data.user);
      toast.success(isLogin ? "Logged in successfully!" : "Account created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Authentication failed");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    authMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
          {isLogin ? 'Enter your details to access your workspaces' : 'Sign up to start managing your projects'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" 
                placeholder="John Doe" 
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" 
              placeholder="you@example.com" 
            />
          </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input 
              type="password" 
              required
              minLength={8} // Szybka walidacja HTML
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" 
              placeholder="••••••••" 
            />
            {/* Wyświetlamy zasady tylko podczas rejestracji */}
            {!isLogin && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                Must be at least 8 characters, include an uppercase letter, a lowercase letter, and a number.
              </p>
            )}
        </div>

          <button 
            type="submit" 
            disabled={authMutation.isPending}
            className="w-full bg-blue-600 text-white font-medium p-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
          >
            {authMutation.isPending ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};