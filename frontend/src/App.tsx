import { Toaster } from 'sonner'
import './App.css'
import { Board } from './components/Board'
import { ProjectList } from './components/ProjectList'
import { useAuthStore } from './store/useAuthStore';

function App() {
  const projectId = useAuthStore((state) => state.projectId);
  return (
    <div className="min-h-screen">
      <Toaster position="bottom-right" richColors theme="system" />
      {projectId? <Board /> : <ProjectList />}
    </div>
  )
}

export default App
