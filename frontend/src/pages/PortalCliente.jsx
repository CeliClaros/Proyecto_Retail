import { useState, useEffect } from "react"
import api from "../services/api"
import { LogOut, RefreshCw, Clock, MapPin, XCircle, CheckCircle } from "lucide-react"

function getMapsUrl(lat, lng) {
  return "https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lng
}

export default function PortalCliente({ onLogout }) {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(false)
  const nombre = localStorage.getItem("nombre")

  useEffect(() => { cargarReservas() }, [])

  const cargarReservas = async () => {
    setLoading(true)
    try {
      const r = await api.get("/reservas/")
      setReservas(r.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const cancelarReserva = async (id) => {
    try {
      await api.patch("/reservas/" + id + "/cancelar")
      cargarReservas()
    } catch (e) {
      console.error(e)
    }
  }

  const estadoColor = {
    PENDIENTE:  "bg-yellow-100 text-yellow-800",
    CONFIRMADA: "bg-blue-100 text-blue-800",
    EN_ESPERA:  "bg-purple-100 text-purple-800",
    EN_CURSO:   "bg-orange-100 text-orange-800",
    ATENDIDA:   "bg-green-100 text-green-800",
    CANCELADA:  "bg-red-100 text-red-800",
  }

  const estadoIcono = {
    PENDIENTE:  "🕐",
    CONFIRMADA: "✅",
    EN_ESPERA:  "👥",
    EN_CURSO:   "🔄",
    ATENDIDA:   "🎉",
    CANCELADA:  "❌",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-blue-800">RetailQueue Pro</h1>
          <p className="text-gray-500 text-sm">Hola, {nombre}!</p>
        </div>
        <div className="flex gap-3">
          <button onClick={cargarReservas} className="flex items-center gap-2 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-50">
            <RefreshCw size={16} /> Actualizar
          </button>
          <button onClick={onLogout} className="flex items-center gap-2 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100">
            <LogOut size={16} /> Salir
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Mis Reservas</h2>
        {loading && <div className="text-center py-12 text-gray-400">Cargando...</div>}
        {reservas.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-2xl shadow">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-gray-500">No tenés reservas todavía</p>
          </div>
        )}
        <div className="space-y-4">
          {reservas.map(r => (
            <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    {estadoIcono[r.estado]} Reserva #{r.id}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {new Date(r.fecha_hora_reserva).toLocaleString("es-AR")}
                  </p>
                </div>
                <span className={"px-3 py-1 rounded-full text-sm font-medium " + (estadoColor[r.estado] || "")}>
                  {r.estado}
                </span>
              </div>
              {["PENDIENTE","CONFIRMADA","EN_ESPERA"].includes(r.estado) && (
                <div className="bg-blue-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <Clock size={16} />
                    <span className="font-medium">Tiempo de espera estimado</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-800">{r.tiempo_espera_estimado_min} min</p>
                  <p className="text-blue-600 text-sm mt-1">Posicion en fila: #{r.posicion_en_cola}</p>
                </div>
              )}
              {r.estado === "ATENDIDA" && (
                <div className="bg-green-50 rounded-xl p-4 mb-4 flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={24} />
                  <div>
                    <p className="font-medium text-green-700">Atencion completada</p>
                    <p className="text-green-600 text-sm">Duracion: {r.duracion_real_min} minutos</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-2">
                {r.ubicacion_lat && r.ubicacion_lng && (
                  <a href={getMapsUrl(r.ubicacion_lat, r.ubicacion_lng)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                    <MapPin size={14} /> Ver ruta
                  </a>
                )}
                {["PENDIENTE","CONFIRMADA","EN_ESPERA"].includes(r.estado) && (
                  <button onClick={() => cancelarReserva(r.id)}
                    className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                    <XCircle size={14} /> Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
