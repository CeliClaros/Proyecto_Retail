import { useState, useEffect } from "react"
import api from "../services/api"
import { LogOut, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"

const COLORES = {
  PENDIENTE:  "#EAB308",
  CONFIRMADA: "#3B82F6",
  EN_ESPERA:  "#A855F7",
  EN_CURSO:   "#F97316",
  ATENDIDA:   "#22C55E",
  CANCELADA:  "#EF4444",
}

export default function DashboardSupervisor({ onLogout }) {
  const [reservas, setReservas]       = useState([])
  const [todasReservas, setTodas]     = useState([])
  const [tipoEventos, setTipoEventos] = useState([])
  const [periodo, setPeriodo]         = useState("semana")
  const [expandido, setExpandido]     = useState(null)
  const [loading, setLoading]         = useState(false)
  const nombre = localStorage.getItem("nombre")

  useEffect(() => { cargarDatos() }, [])
  useEffect(() => { setReservas(filtrarPorPeriodo(todasReservas)) }, [periodo, todasReservas])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [r, t] = await Promise.all([
        api.get("/reservas/"),
        api.get("/tipo-eventos/"),
      ])
      setTodas(r.data)
      setReservas(filtrarPorPeriodo(r.data))
      setTipoEventos(t.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtrarPorPeriodo = (data) => {
    if (!data || data.length === 0) return []
    const ahora = new Date()
    return data.filter(r => {
      const fecha = new Date(r.fecha_hora_reserva)
      if (periodo === "hoy") {
        return fecha.toDateString() === ahora.toDateString()
      } else if (periodo === "semana") {
        const hace7 = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)
        return fecha >= hace7
      } else {
        const hace30 = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000)
        return fecha >= hace30
      }
    })
  }

  const reservasPorEvento = tipoEventos.map(te => {
    const res = reservas.filter(r => r.id_tipo_evento === te.id)
    return {
      ...te,
      reservas:   res,
      pendientes: res.filter(r => r.estado === "PENDIENTE").length,
      en_curso:   res.filter(r => r.estado === "EN_CURSO").length,
      atendidas:  res.filter(r => r.estado === "ATENDIDA").length,
      canceladas: res.filter(r => r.estado === "CANCELADA").length,
      total:      res.length,
    }
  }).filter(te => te.total > 0)

  const donutData = Object.entries(
    reservas.reduce((acc, r) => {
      acc[r.estado] = (acc[r.estado] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  const barData = tipoEventos.map(te => ({
    name:       te.nombre.substring(0, 12),
    Atendidas:  reservas.filter(r => r.id_tipo_evento === te.id && r.estado === "ATENDIDA").length,
    Pendientes: reservas.filter(r => r.id_tipo_evento === te.id && r.estado === "PENDIENTE").length,
  })).filter(d => d.Atendidas > 0 || d.Pendientes > 0)

  const totalAtendidas = reservas.filter(r => r.estado === "ATENDIDA").length
  const totalReservas  = reservas.length
  const pctAtendidas   = totalReservas > 0 ? Math.round((totalAtendidas / totalReservas) * 100) : 0
  const semaforoColor  = pctAtendidas >= 80 ? "text-green-600" : pctAtendidas >= 50 ? "text-yellow-500" : "text-red-500"
  const semaforoBg     = pctAtendidas >= 80 ? "bg-green-50 border-green-200" : pctAtendidas >= 50 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-indigo-800 text-white px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">RetailQueue Pro</h1>
          <p className="text-indigo-300 text-sm">Dashboard Supervisor — {nombre}</p>
        </div>
        <div className="flex items-center gap-4">
          {["hoy","semana","mes"].map(p => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={"px-4 py-2 rounded-lg capitalize transition " + (periodo === p ? "bg-white text-indigo-800 font-semibold" : "hover:bg-indigo-700")}>
              {p}
            </button>
          ))}
          <button onClick={cargarDatos} className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-600 px-4 py-2 rounded-lg">
            <RefreshCw size={16} />
          </button>
          <button onClick={onLogout} className="flex items-center gap-2 bg-indigo-900 hover:bg-indigo-700 px-4 py-2 rounded-lg">
            <LogOut size={16} /> Salir
          </button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {loading && <p className="text-gray-400">Cargando...</p>}

        <div className="text-sm text-gray-500 bg-white rounded-lg px-4 py-2 inline-block shadow">
          Mostrando: <strong>{reservas.length}</strong> reservas del período — Total en sistema: <strong>{todasReservas.length}</strong>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Reservas", value: totalReservas, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
            { label: "Atendidas",      value: totalAtendidas, color: "text-green-600", bg: "bg-green-50 border-green-200" },
            { label: "En Curso",       value: reservas.filter(r => r.estado === "EN_CURSO").length, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
            { label: "% Completadas",  value: pctAtendidas + "%", color: semaforoColor, bg: semaforoBg },
          ].map(k => (
            <div key={k.label} className={"rounded-xl p-6 border " + k.bg}>
              <p className={"text-3xl font-bold " + k.color}>{k.value}</p>
              <p className="text-gray-500 text-sm mt-1">{k.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Estado de Reservas</h3>
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value"
                    label={({name, value}) => name + ": " + value}>
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={COLORES[entry.name] || "#94A3B8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400 py-16">Sin datos para este período</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Atenciones por Tipo de Trámite</h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" tick={{fontSize: 11}} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Atendidas"  fill="#22C55E" />
                  <Bar dataKey="Pendientes" fill="#EAB308" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400 py-16">Sin datos para este período</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-4 text-lg">Detalle por Tipo de Trámite</h3>
          {reservasPorEvento.length === 0 && (
            <p className="text-gray-400 bg-white rounded-xl p-6 text-center">Sin datos para este período</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            {reservasPorEvento.map(te => (
              <div key={te.id} className="bg-white rounded-xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800">{te.nombre}</h4>
                  <span className="text-sm text-gray-500">{te.total} reservas</span>
                </div>
                <div className="px-6 py-4 grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "Pendientes", value: te.pendientes, color: "text-yellow-600 bg-yellow-50" },
                    { label: "En Curso",   value: te.en_curso,   color: "text-orange-600 bg-orange-50" },
                    { label: "Atendidas",  value: te.atendidas,  color: "text-green-600 bg-green-50" },
                    { label: "Canceladas", value: te.canceladas, color: "text-red-600 bg-red-50" },
                  ].map(s => (
                    <div key={s.label} className={"rounded-lg p-2 " + s.color}>
                      <p className="text-xl font-bold">{s.value}</p>
                      <p className="text-xs">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="px-6 pb-4">
                  <button onClick={() => setExpandido(expandido === te.id ? null : te.id)}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    {expandido === te.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {expandido === te.id ? "Ocultar detalle" : "Ver detalle"}
                  </button>
                  {expandido === te.id && (
                    <table className="w-full text-xs mt-3">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="pb-2">#</th>
                          <th className="pb-2">Fecha</th>
                          <th className="pb-2">Estado</th>
                          <th className="pb-2">ETA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {te.reservas.slice(0, 8).map(r => (
                          <tr key={r.id} className="border-b last:border-0">
                            <td className="py-1">#{r.id}</td>
                            <td className="py-1">{new Date(r.fecha_hora_reserva).toLocaleString("es-AR")}</td>
                            <td className="py-1">
                              <span style={{backgroundColor: COLORES[r.estado] + "30", color: COLORES[r.estado]}}
                                className="px-2 py-0.5 rounded-full text-xs font-medium">
                                {r.estado}
                              </span>
                            </td>
                            <td className="py-1">{r.tiempo_espera_estimado_min}min</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
