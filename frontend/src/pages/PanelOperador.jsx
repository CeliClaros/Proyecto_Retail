import { useState, useEffect } from "react"
import api from "../services/api"
import { LogOut, RefreshCw, CheckCircle, XCircle, Clock, PlayCircle } from "lucide-react"

export default function PanelOperador({ onLogout }) {
  const [reservas, setReservas]         = useState([])
  const [asignacion, setAsignacion]     = useState(null)
  const [loading, setLoading]           = useState(true)
  const [loadingCola, setLoadingCola]   = useState(false)
  const [mensaje, setMensaje]           = useState("")
  const [iniciado, setIniciado]         = useState(false)
  const nombre = localStorage.getItem("nombre")
  const email  = localStorage.getItem("email")

  useEffect(() => { cargarAsignacion() }, [])

  const cargarAsignacion = async () => {
    setLoading(true)
    try {
      const r = await api.get(`/asignaciones/mi-asignacion-hoy?email=${email}`)
      setAsignacion(r.data.asignacion)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const iniciarJornada = async () => {
    setIniciado(true)
    await cargarReservas()
  }

  const cargarReservas = async () => {
    if (!asignacion) return
    setLoadingCola(true)
    try {
      const r = await api.get(`/reservas/hoy?id_tipo_evento=${asignacion.id_tipo_evento}`)
      const activas = r.data.filter(r =>
        ["PENDIENTE","CONFIRMADA","EN_ESPERA","EN_CURSO"].includes(r.estado)
      )
      setReservas(activas)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingCola(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400 text-lg">Cargando asignación...</p>
      </div>
    )
  }

  if (!asignacion) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Sin asignación para hoy</h2>
          <p className="text-gray-500 mb-6">No tenés ningún trámite asignado para hoy. Consultá con el supervisor.</p>
          <button onClick={onLogout}
            className="flex items-center gap-2 mx-auto bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition">
            <LogOut size={16} /> Salir
          </button>
        </div>
      </div>
    )
  }

  if (!iniciado) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">👋</div>
            <h2 className="text-2xl font-bold text-gray-800">¡Buen día, {nombre}!</h2>
            <p className="text-gray-500 mt-1">Tu asignación para hoy es:</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Tipo de trámite</p>
                <p className="text-2xl font-bold text-green-800 mt-1">{asignacion.nombre_evento}</p>
              </div>
              <span className="bg-green-200 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                {asignacion.legajo}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Tiempo base por atención</p>
                <p className="font-semibold text-gray-800">{asignacion.tiempo_base_min} minutos</p>
              </div>
              <div>
                <p className="text-gray-500">Horario</p>
                <p className="font-semibold text-gray-800">{asignacion.hora_inicio} — {asignacion.hora_fin}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onLogout}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-3 rounded-xl transition">
              <LogOut size={16} /> Salir
            </button>
            <button onClick={iniciarJornada}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-semibold transition">
              <PlayCircle size={20} /> Comenzar atención
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-green-700 text-white px-8 py-4 flex justify-between items-center shadow">
        <div>
          <h1 className="text-xl font-bold">RetailQueue Pro</h1>
          <p className="text-green-200 text-sm">
            Panel Operador — {nombre} &nbsp;·&nbsp;
            <span className="bg-green-600 px-2 py-0.5 rounded-full text-xs">{asignacion.nombre_evento}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={cargarReservas}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg transition">
            <RefreshCw size={16} /> Actualizar
          </button>
          <button onClick={onLogout}
            className="flex items-center gap-2 bg-green-800 hover:bg-green-600 px-4 py-2 rounded-lg transition">
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

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-gray-700">Cola de Atención</h2>
              <p className="text-xs text-gray-400 mt-0.5">Trámite: <span className="font-medium text-green-700">{asignacion.nombre_evento}</span></p>
            </div>
            <span className="text-sm text-gray-500">{reservas.length} reservas activas hoy</span>
          </div>

          {loadingCola && <p className="p-6 text-gray-500">Cargando...</p>}

          <div className="divide-y">
            {reservas.map((r, idx) => (
              <div key={r.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      Reserva #{r.id}
                      <span className="ml-2 text-xs text-gray-400 font-normal">· {asignacion.nombre_evento}</span>
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock size={12} />
                      ETA: {r.tiempo_espera_estimado_min} min —&nbsp;
                      {new Date(r.fecha_hora_reserva).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColor[r.estado]}`}>
                    {r.estado}
                  </span>
                  {["PENDIENTE","CONFIRMADA","EN_ESPERA"].includes(r.estado) && (
                    <button onClick={() => hacerCheckin(r.id)}
                      className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm transition">
                      <CheckCircle size={14} /> Check-in
                    </button>
                  )}
                  {r.estado === "EN_CURSO" && (
                    <button onClick={() => hacerCheckout(r.id)}
                      className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition">
                      <XCircle size={14} /> Check-out
                    </button>
                  )}
                </div>
              </div>
            ))}
            {reservas.length === 0 && !loadingCola && (
              <p className="p-8 text-center text-gray-400">
                No hay reservas activas para <strong>{asignacion.nombre_evento}</strong> hoy
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
