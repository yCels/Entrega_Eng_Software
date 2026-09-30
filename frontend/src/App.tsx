import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Register from './pages/Register'
import Campeonatos from './pages/Campeonatos'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />
      <Route
        path="/campeonatos"
        element={
          <ProtectedRoute>
            <Campeonatos />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
