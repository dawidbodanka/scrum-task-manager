import { Toaster } from 'sonner'
import './App.css'
import { Board } from './components/Board'

function App() {
  return (
    <div className="min-h-screen">
      <Toaster position="bottom-right" richColors theme="system" />
      <Board />
    </div>
  )
}

export default App
