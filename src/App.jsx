import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import SplashScreen from './components/SplashScreen'
import LoginPage from './components/LoginPage'
import ChatLayout from './components/chat/ChatLayout'
import InstallPrompt from './components/InstallPrompt'

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

function App() {
  if (!isStandalone()) {
    return <InstallPrompt />
  }

  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatLayout />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
