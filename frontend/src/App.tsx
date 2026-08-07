// Main application component

import { Board } from './components/Board';
import { ProjectList } from './components/ProjectList';
import { AuthScreen } from './components/AuthScreen';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/useAuthStore';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from './api/axios';
import axios from 'axios';

function App() {
  const { token, projectId } = useAuthStore();
  const [isServerReady, setIsServerReady] = useState(false);

  // Wake up the server on initial load
useEffect(() => {
    const wakeUpServer = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/api/health`);
        if (response.status === 200) {
          setIsServerReady(true);
        } else {
          setTimeout(wakeUpServer, 3000);
        }
      } catch (error) {
        setTimeout(wakeUpServer, 3000);
      }
    };

    wakeUpServer();
  }, []);

// Loading screen while waiting for the server to wake up
  if (!isServerReady) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 font-sans text-center">
        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-emerald-500 mb-6"></div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-widest text-slate-100 mb-4">
          WAKING UP SERVER...
        </h1>
        <p className="text-slate-400 max-w-md text-sm sm:text-base leading-relaxed">
          Because this project is hosted on a free tier, the backend goes to sleep after inactivity. 
          It might take around <strong className="text-emerald-400">50 seconds</strong> to spin back up. 
          Thanks for your patience!
        </p>
      </div>
    );
  }

  return (
    <>
      <Toaster position="bottom-right" richColors theme="system" />
      
      {!token ? (
        <AuthScreen />
      ) : (
        projectId ? <Board /> : <ProjectList />
      )}
    </>
  );
}

export default App;