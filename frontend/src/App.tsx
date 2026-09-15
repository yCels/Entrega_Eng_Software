import { Route, Routes } from 'react-router-dom'
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
      <Route path="/campeonatos" element={<Campeonatos />} />
    </Routes>
  )
}

export default App
