import { useState, useEffect } from "react"
import Login from "./pages/Login"
import PanelAdmin from "./pages/PanelAdmin"
import PanelOperador from "./pages/PanelOperador"
import PortalCliente from "./pages/PortalCliente"
import DashboardSupervisor from "./pages/DashboardSupervisor"

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

  if (!rol)                 return <Login               onLogin={handleLogin} />
  if (rol === "ADMIN")      return <PanelAdmin          onLogout={handleLogout} />
  if (rol === "OPERADOR")   return <PanelOperador       onLogout={handleLogout} />
  if (rol === "CLIENTE")    return <PortalCliente       onLogout={handleLogout} />
  if (rol === "SUPERVISOR") return <DashboardSupervisor onLogout={handleLogout} />
  return <Login onLogin={handleLogin} />
}
