import { useState } from "react"
import api from "../services/api"

export default function Login({ onLogin }) {
  const [modo, setModo]         = useState("login") // "login" | "registro"
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [nombre, setNombre]     = useState("")
  const [apellido, setApellido] = useState("")
  const [telefono, setTelefono] = useState("")
  const [error, setError]       = useState("")
  const [exito, setExito]       = useState("")
  const [loading, setLoading]   = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await api.post("/auth/login", { email, password })
      const { access_token, rol, nombre: nom, id } = res.data
      localStorage.setItem("token", access_token)
      localStorage.setItem("rol", rol)
      localStorage.setItem("nombre", nom)
      localStorage.setItem("id", id)
      localStorage.setItem("email", email)
      onLogin(rol)
    } catch (e) {
      setError("Email o contraseña incorrectos")
    } finally {
      setLoading(false)
    }
  }

  const handleRegistro = async () => {
    if (!nombre || !apellido || !email || !password) {
      setError("Completá todos los campos obligatorios")
      return
    }
    setLoading(true)
    setError("")
    setExito("")
    try {
      await api.post("/auth/registro", {
        nombre,
        apellido,
        email,
        password,
        telefono: telefono || null,
        rol: "CLIENTE"
      })
      setExito("✅ Cuenta creada. Ya podés ingresar con tu email y contraseña.")
      setModo("login")
      setNombre("")
      setApellido("")
      setTelefono("")
    } catch (e) {
      const msg = e.response?.data?.detail
      if (typeof msg === "string") setError(msg)
      else setError("Error al crear la cuenta. El email puede estar en uso.")
    } finally {
      setLoading(false)
    }
  }

  const limpiar = (nuevoModo) => {
    setError("")
    setExito("")
    setEmail("")
    setPassword("")
    setNombre("")
    setApellido("")
    setTelefono("")
    setModo(nuevoModo)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-800">RetailQueue Pro</h1>
          <p className="text-gray-500 mt-2">Sistema de Gestión de Atención</p>
        </div>

        {/* Tabs login / registro */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            onClick={() => limpiar("login")}
            className={"flex-1 py-2 rounded-md text-sm font-medium transition " +
              (modo === "login" ? "bg-white shadow text-blue-700" : "text-gray-500 hover:text-gray-700")}>
            Ingresar
          </button>
          <button
            onClick={() => limpiar("registro")}
            className={"flex-1 py-2 rounded-md text-sm font-medium transition " +
              (modo === "registro" ? "bg-white shadow text-blue-700" : "text-gray-500 hover:text-gray-700")}>
            Crear cuenta
          </button>
        </div>

        {exito && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {exito}
          </div>
        )}

        {/* ── FORMULARIO LOGIN ── */}
        {modo === "login" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tu@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleLogin} disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </div>
        )}

        {/* ── FORMULARIO REGISTRO ── */}
        {modo === "registro" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Juan" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                <input type="text" value={apellido} onChange={e => setApellido(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="García" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tu@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (WhatsApp)</label>
              <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5491112345678" />
              <p className="text-xs text-gray-400 mt-1">Con código de país, sin + ni espacios. Necesario para recibir notificaciones.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleRegistro} disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
            <p className="text-xs text-gray-400 text-center">* Campos obligatorios</p>
          </div>
        )}

        {/* Usuarios de prueba — solo en login */}
        {modo === "login" && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-500">
            <p className="font-medium mb-1 text-gray-600">Usuarios de prueba:</p>
            <p>👤 Admin: admin@retail.com / admin1234</p>
            <p>👥 Supervisor: supervisor@retail.com / super1234</p>
            <p>🔧 Operador: carlos.op@retail.com / op1234</p>
            <p>🙋 Cliente: roberto@cliente.com / cli1234</p>
          </div>
        )}
      </div>
    </div>
  )
}
