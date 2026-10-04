import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

import AppLayout from './layouts/AppLayout'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Register from './pages/Register'
import Campeonatos from './pages/Campeonatos'
import CampeonatoDetalhe from './pages/CampeonatoDetalhe'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/campeonatos" element={<Campeonatos />} />
        <Route path="/campeonatos/:id" element={<CampeonatoDetalhe />} />
      </Route>
    </Routes>
  )
}

export default App
