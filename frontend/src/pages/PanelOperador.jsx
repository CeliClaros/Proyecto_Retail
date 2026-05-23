import { useState, useEffect } from "react"
import api from "../services/api"
import { LogOut, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react"

export default function PanelOperador({ onLogout }) {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState("")
  const nombre = localStorage.getItem("nombre")

  useEffect(() => { cargarReservas() }, [])

  const cargarReservas = async () => {
    setLoading(true)
    try {
      const r = await api.get("/reservas/")
      const activas = r.data.filter(r =>
        ["PENDIENTE","CONFIRMADA","EN_ESPERA","EN_CURSO"].includes(r.estado)
      )
      setReservas(activas)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const hacerCheckin = async (id) => {
    try {
      await api.post(`/reservas/${id}/checkin`)
      setMensaje(`✅ Check-in registrado para reserva #${id}`)
      cargarReservas()
    } catch (e) {
      setMensaje("❌ Error al registrar check-in")
    }
  }

  const hacerCheckout = async (id) => {
    try {
      await api.post(`/reservas/${id}/checkout`)
      setMensaje(`✅ Check-out registrado para reserva #${id}`)
      cargarReservas()
    } catch (e) {
      setMensaje("❌ Error al registrar check-out")
    }
  }

  const estadoColor = {
    PENDIENTE:  "bg-yellow-100 text-yellow-800",
    CONFIRMADA: "bg-blue-100 text-blue-800",
    EN_ESPERA:  "bg-purple-100 text-purple-800",
    EN_CURSO:   "bg-orange-100 text-orange-800",
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-green-700 text-white px-8 py-4 flex justify-between items-center shadow">
        <div>
          <h1 className="text-xl font-bold">RetailQueue Pro</h1>
          <p className="text-green-200 text-sm">Panel Operador — {nombre}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={cargarReservas} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg transition">
            <RefreshCw size={16} /> Actualizar
          </button>
          <button onClick={onLogout} className="flex items-center gap-2 bg-green-800 hover:bg-green-600 px-4 py-2 rounded-lg transition">
            <LogOut size={16} /> Salir
          </button>
        </div>
      </div>

      <div className="p-8">
        {mensaje && (
          <div className="mb-4 p-4 bg-white rounded-xl shadow border-l-4 border-green-500">
            {mensaje}
          </div>
        )}

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "En espera",  value: reservas.filter(r => r.estado === "EN_ESPERA").length,  color: "text-purple-600" },
            { label: "En curso",   value: reservas.filter(r => r.estado === "EN_CURSO").length,   color: "text-orange-600" },
            { label: "Pendientes", value: reservas.filter(r => r.estado === "PENDIENTE").length,  color: "text-yellow-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-sm">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Cola de atención */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">Cola de Atención</h2>
            <span className="text-sm text-gray-500">{reservas.length} reservas activas</span>
          </div>

          {loading && <p className="p-6 text-gray-500">Cargando...</p>}

          <div className="divide-y">
            {reservas.map(r => (
              <div key={r.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                    #{r.posicion_en_cola}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Reserva #{r.id}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock size={12} />
                      ETA: {r.tiempo_espera_estimado_min} min —
                      {new Date(r.fecha_hora_reserva).toLocaleString("es-AR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColor[r.estado]}`}>
                    {r.estado}
                  </span>
                  {["PENDIENTE","CONFIRMADA","EN_ESPERA"].includes(r.estado) && (
                    <button
                      onClick={() => hacerCheckin(r.id)}
                      className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm transition"
                    >
                      <CheckCircle size={14} /> Check-in
                    </button>
                  )}
                  {r.estado === "EN_CURSO" && (
                    <button
                      onClick={() => hacerCheckout(r.id)}
                      className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition"
                    >
                      <XCircle size={14} /> Check-out
                    </button>
                  )}
                </div>
              </div>
            ))}
            {reservas.length === 0 && !loading && (
              <p className="p-8 text-center text-gray-400">No hay reservas activas en este momento</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
