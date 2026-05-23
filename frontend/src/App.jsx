import { useState, useEffect } from "react"
import Login from "./pages/Login"
import PanelAdmin from "./pages/PanelAdmin"
import PanelOperador from "./pages/PanelOperador"
import PortalCliente from "./pages/PortalCliente"

export default function App() {
  const [rol, setRol] = useState(null)

  useEffect(() => {
    const rolGuardado = localStorage.getItem("rol")
    const token = localStorage.getItem("token")
    if (rolGuardado && token) setRol(rolGuardado)
  }, [])

  const handleLogin = (rolUsuario) => setRol(rolUsuario)

  const handleLogout = () => {
    localStorage.clear()
    setRol(null)
  }

  if (!rol) return <Login onLogin={handleLogin} />
  if (rol === "admin")    return <PanelAdmin    onLogout={handleLogout} />
  if (rol === "operador") return <PanelOperador onLogout={handleLogout} />
  if (rol === "cliente")  return <PortalCliente onLogout={handleLogout} />
  return <Login onLogin={handleLogin} />
}
