import { useState, useEffect } from "react"
import api from "../services/api"
import { Users, Calendar, BarChart3, LogOut, Plus, RefreshCw } from "lucide-react"

export default function PanelAdmin({ onLogout }) {
  const [seccion, setSeccion] = useState("dashboard")
  const [empleados, setEmpleados] = useState([])
  const [tipoEventos, setTipoEventos] = useState([])
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(false)
  const nombre = localStorage.getItem("nombre")

  useEffect(() => { cargarDatos() }, [seccion])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      if (seccion === "dashboard" || seccion === "reservas") {
        const r = await api.get("/reservas/")
        setReservas(r.data)
      }
      if (seccion === "empleados") {
        const e = await api.get("/empleados/")
        setEmpleados(e.data)
      }
      if (seccion === "eventos") {
        const t = await api.get("/tipo-eventos/")
        setTipoEventos(t.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    pendientes: reservas.filter(r => r.estado === "PENDIENTE").length,
    en_curso:   reservas.filter(r => r.estado === "EN_CURSO").length,
    atendidas:  reservas.filter(r => r.estado === "ATENDIDA").length,
    canceladas: reservas.filter(r => r.estado === "CANCELADA").length,
  }

  const estadoColor = {
    PENDIENTE:  "bg-yellow-100 text-yellow-800",
    CONFIRMADA: "bg-blue-100 text-blue-800",
    EN_ESPERA:  "bg-purple-100 text-purple-800",
    EN_CURSO:   "bg-orange-100 text-orange-800",
    ATENDIDA:   "bg-green-100 text-green-800",
    CANCELADA:  "bg-red-100 text-red-800",
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 text-white flex flex-col">
        <div className="p-6 border-b border-blue-700">
          <h1 className="text-xl font-bold">RetailQueue Pro</h1>
          <p className="text-blue-300 text-sm mt-1">Panel Administrador</p>
          <p className="text-blue-200 text-sm mt-2">👤 {nombre}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: "dashboard", icon: BarChart3, label: "Dashboard" },
            { id: "reservas",  icon: Calendar,  label: "Reservas" },
            { id: "empleados", icon: Users,      label: "Empleados" },
            { id: "eventos",   icon: Plus,       label: "Tipo Eventos" },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setSeccion(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-left ${
                seccion === item.id ? "bg-blue-600" : "hover:bg-blue-800"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-6 py-4 hover:bg-blue-800 transition border-t border-blue-700"
        >
          <LogOut size={18} /> Cerrar sesión
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 capitalize">{seccion}</h2>
          <button onClick={cargarDatos} className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <RefreshCw size={16} /> Actualizar
          </button>
        </div>

        {loading && <p className="text-gray-500">Cargando...</p>}

        {/* DASHBOARD */}
        {seccion === "dashboard" && (
          <div>
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: "Pendientes", value: stats.pendientes, color: "bg-yellow-500" },
                { label: "En Curso",   value: stats.en_curso,   color: "bg-orange-500" },
                { label: "Atendidas",  value: stats.atendidas,  color: "bg-green-500" },
                { label: "Canceladas", value: stats.canceladas, color: "bg-red-500" },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-xl p-6 shadow">
                  <div className={`w-3 h-3 rounded-full ${stat.color} mb-3`} />
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Últimas reservas</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">ID</th>
                    <th className="pb-2">Usuario</th>
                    <th className="pb-2">Fecha</th>
                    <th className="pb-2">Estado</th>
                    <th className="pb-2">ETA (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.slice(0, 10).map(r => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2">#{r.id}</td>
                      <td className="py-2">Usuario {r.id_usuario}</td>
                      <td className="py-2">{new Date(r.fecha_hora_reserva).toLocaleString("es-AR")}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoColor[r.estado]}`}>
                          {r.estado}
                        </span>
                      </td>
                      <td className="py-2">{r.tiempo_espera_estimado_min} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EMPLEADOS */}
        {seccion === "empleados" && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3">Legajo</th>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {empleados.map(e => (
                  <tr key={e.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-blue-600">{e.legajo}</td>
                    <td className="px-6 py-3 font-medium">{e.nombre} {e.apellido}</td>
                    <td className="px-6 py-3 text-gray-500">{e.email}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${e.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {e.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TIPO EVENTOS */}
        {seccion === "eventos" && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Descripción</th>
                  <th className="px-6 py-3">Tiempo base</th>
                  <th className="px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {tipoEventos.map(t => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">{t.nombre}</td>
                    <td className="px-6 py-3 text-gray-500">{t.descripcion}</td>
                    <td className="px-6 py-3">{t.tiempo_base_min} min</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${t.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {t.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* RESERVAS */}
        {seccion === "reservas" && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Usuario</th>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">ETA</th>
                  <th className="px-6 py-3">Posición</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-3">#{r.id}</td>
                    <td className="px-6 py-3">Usuario {r.id_usuario}</td>
                    <td className="px-6 py-3">{new Date(r.fecha_hora_reserva).toLocaleString("es-AR")}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoColor[r.estado]}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td className="px-6 py-3">{r.tiempo_espera_estimado_min} min</td>
                    <td className="px-6 py-3">#{r.posicion_en_cola}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
