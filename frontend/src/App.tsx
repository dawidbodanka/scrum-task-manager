import { Board } from './components/Board';
import { ProjectList } from './components/ProjectList';
import { AuthScreen } from './components/AuthScreen';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const { token, projectId } = useAuthStore();

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