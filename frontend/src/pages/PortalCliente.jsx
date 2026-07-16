import { useState, useEffect } from "react"
import api from "../services/api"
import { LogOut, RefreshCw, Clock, MapPin, XCircle, CheckCircle, ArrowDown, Plus, X } from "lucide-react"

function getMapsUrl(lat, lng) {
  return "https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lng
}

export default function PortalCliente({ onLogout }) {
  const [reservas, setReservas]       = useState([])
  const [tipoEventos, setTipoEventos] = useState([])
  const [loading, setLoading]         = useState(false)
  const [pagina, setPagina]           = useState(1)
  const [mensaje, setMensaje]         = useState("")
  const [mostrarForm, setMostrarForm] = useState(false)
  const [loadingReserva, setLoadingReserva] = useState(false)
  const [idTipoEvento, setIdTipoEvento]     = useState("")
  const [errorForm, setErrorForm]           = useState("")

  const nombre    = localStorage.getItem("nombre")
  const idUsuario = localStorage.getItem("id")
  const POR_PAGINA = 5

  useEffect(() => {
    cargarReservas()
    cargarTipoEventos()
  }, [])

  const cargarReservas = async () => {
    setLoading(true)
    try {
      const r = await api.get("/reservas/mis-reservas/" + idUsuario)
      setReservas(r.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const cargarTipoEventos = async () => {
    try {
      const r = await api.get("/tipo-eventos/")
      setTipoEventos(r.data)
      if (r.data.length > 0) setIdTipoEvento(r.data[0].id)
    } catch (e) {
      console.error(e)
    }
  }

  const anotarseEnFila = async () => {
    if (!idTipoEvento) {
      setErrorForm("Seleccioná un tipo de trámite")
      return
    }
    setLoadingReserva(true)
    setErrorForm("")
    try {
      const r = await api.post("/reservas/", {
        id_usuario:      parseInt(idUsuario),
        id_tipo_evento:  parseInt(idTipoEvento),
        canal_notif:     "whatsapp",
        ubicacion_lat:   -34.6,
        ubicacion_lng:   -58.4,
      })
      const pos = r.data.posicion_en_cola || 1
      const eta = r.data.tiempo_espera_estimado_min || 0
      setMensaje(`✅ ¡Te anotaste en la fila! Estás en la posición #${pos}. Tu tiempo de espera estimado es de ${eta} minutos. Te avisamos por WhatsApp cuando tengas que salir.`)
      setMostrarForm(false)
      cargarReservas()
    } catch (e) {
      const msg = e.response?.data?.detail
      if (typeof msg === "string") setErrorForm("⚠️ " + msg)
      else setErrorForm("No se pudo crear la reserva. Intentá de nuevo.")
    } finally {
      setLoadingReserva(false)
    }
  }

  const cancelarReserva = async (id) => {
    try {
      await api.patch("/reservas/" + id + "/cancelar")
      setMensaje("✅ Reserva cancelada")
      cargarReservas()
    } catch (e) {
      setMensaje("❌ Error al cancelar")
    }
  }

  const moverAlFinal = async (id) => {
    try {
      await api.patch("/reservas/" + id + "/mover-al-final")
      setMensaje("✅ Te movimos al final de la cola. Tu tiempo de espera fue actualizado.")
      cargarReservas()
    } catch (e) {
      setMensaje("❌ Error al mover la reserva")
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

  const totalPaginas   = Math.ceil(reservas.length / POR_PAGINA)
  const reservasPagina = reservas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const tipoSeleccionado = tipoEventos.find(t => t.id === parseInt(idTipoEvento))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-blue-800">RetailQueue Pro</h1>
          <p className="text-gray-500 text-sm">Hola, {nombre}!</p>
        </div>
        <div className="flex gap-3">
          <button onClick={cargarReservas}
            className="flex items-center gap-2 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-50">
            <RefreshCw size={16} /> Actualizar
          </button>
          <button onClick={onLogout}
            className="flex items-center gap-2 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100">
            <LogOut size={16} /> Salir
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {/* Título + botón anotarse */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Mis Reservas</h2>
            <p className="text-sm text-gray-500">{reservas.length} total</p>
          </div>
          <button onClick={() => { setMostrarForm(!mostrarForm); setErrorForm("") }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition">
            {mostrarForm ? <><X size={16}/> Cancelar</> : <><Plus size={16}/> Reservar turno</>}
          </button>
        </div>

        {/* Mensaje feedback */}
        {mensaje && (
          <div className="mb-4 p-4 bg-white rounded-xl shadow border-l-4 border-blue-500 text-sm">
            {mensaje}
          </div>
        )}

        {/* Formulario anotarse en la fila */}
        {mostrarForm && (
          <div className="bg-white rounded-2xl shadow-md border border-blue-100 p-6 mb-6">
            <h3 className="font-semibold text-gray-800 text-lg mb-1">Reservar turno</h3>
            <p className="text-sm text-gray-500 mb-4">Te anotás ahora y el sistema te avisa cuándo salir para llegar justo a tu turno.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué trámite necesitás?</label>
                <select value={idTipoEvento} onChange={e => setIdTipoEvento(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {tipoEventos.map(te => (
                    <option key={te.id} value={te.id}>{te.nombre}</option>
                  ))}
                </select>

                {tipoSeleccionado && (
                  <div className="mt-3 p-4 bg-blue-50 rounded-xl text-sm">
                    <div className="flex items-center gap-2 text-blue-700 mb-1">
                      <Clock size={14} />
                      <span className="font-medium">Duración estimada: {tipoSeleccionado.tiempo_base_min} minutos</span>
                    </div>
                    {tipoSeleccionado.requisitos && (
                      <p className="text-blue-600">📋 Requisitos: <strong>{tipoSeleccionado.requisitos}</strong></p>
                    )}
                    {tipoSeleccionado.descripcion && (
                      <p className="text-blue-500 mt-1 text-xs">{tipoSeleccionado.descripcion}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
                ⏰ Horario de atención: <strong>Lunes a Viernes de 9:00 a 21:00hs</strong>
              </div>

              {errorForm && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {errorForm}
                </div>
              )}

              <button onClick={anotarseEnFila} disabled={loadingReserva}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
                {loadingReserva ? "Reservando..." : <><Plus size={18}/> Reservar ahora</>}
              </button>
            </div>
          </div>
        )}

        {loading && <div className="text-center py-12 text-gray-400">Cargando...</div>}

        {reservas.length === 0 && !loading && !mostrarForm && (
          <div className="text-center py-12 bg-white rounded-2xl shadow">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-gray-500 mb-4">No tenés reservas todavía</p>
            <button onClick={() => setMostrarForm(true)}
              className="flex items-center gap-2 mx-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-medium transition">
              <Plus size={16}/> Reservar turno
            </button>
          </div>
        )}

        {/* Lista de reservas */}
        <div className="space-y-4">
          {reservasPagina.map(r => (
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
                  <p className="text-blue-600 text-sm mt-1">Posición en fila: #{r.posicion_en_cola}</p>
                </div>
              )}

              {r.estado === "ATENDIDA" && (
                <div className="bg-green-50 rounded-xl p-4 mb-4 flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={24} />
                  <div>
                    <p className="font-medium text-green-700">Atención completada</p>
                    <p className="text-green-600 text-sm">Duración: {r.duracion_real_min} minutos</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-2 flex-wrap">
                {r.ubicacion_lat && r.ubicacion_lng && ["PENDIENTE","CONFIRMADA","EN_ESPERA","EN_CURSO"].includes(r.estado) && (
                  <a href={getMapsUrl(r.ubicacion_lat, r.ubicacion_lng)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                    <MapPin size={14} /> Ver ruta al local
                  </a>
                )}
                {["PENDIENTE","CONFIRMADA","EN_ESPERA"].includes(r.estado) && (
                  <>
                    <button onClick={() => moverAlFinal(r.id)}
                      className="flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-2 rounded-lg text-sm">
                      <ArrowDown size={14} /> No llego, moverme al final
                    </button>
                    <button onClick={() => cancelarReserva(r.id)}
                      className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                      <XCircle size={14} /> Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex justify-center items-center gap-3 mt-6">
            <button onClick={() => setPagina(p => Math.max(1, p-1))} disabled={pagina === 1}
              className="px-4 py-2 bg-white rounded-lg shadow text-sm disabled:opacity-40 hover:bg-gray-50">
              ← Anterior
            </button>
            <span className="text-sm text-gray-600">Página {pagina} de {totalPaginas}</span>
            <button onClick={() => setPagina(p => Math.min(totalPaginas, p+1))} disabled={pagina === totalPaginas}
              className="px-4 py-2 bg-white rounded-lg shadow text-sm disabled:opacity-40 hover:bg-gray-50">
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
