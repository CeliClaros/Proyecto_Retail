import { useState, useEffect } from "react"
import api from "../services/api"
import { Users, Calendar, BarChart3, LogOut, Plus, RefreshCw, Link, X, Edit2, Trash2 } from "lucide-react"

export default function PanelAdmin({ onLogout }) {
  const [seccion, setSeccion]           = useState("dashboard")
  const [empleados, setEmpleados]       = useState([])
  const [tipoEventos, setTipoEventos]   = useState([])
  const [reservas, setReservas]         = useState([])
  const [asignaciones, setAsignaciones] = useState([])
  const [loading, setLoading]           = useState(false)
  const [mensaje, setMensaje]           = useState("")
  const [sortReservas, setSortReservas]         = useState({ campo: "id", dir: "desc" })
  const [filtroEstado, setFiltroEstado]         = useState("")
  const [sortDashboard, setSortDashboard]       = useState({ campo: "id", dir: "desc" })
  const [filtroPeriodo, setFiltroPeriodo]       = useState("todas")

  // Form asignaciones
  const [formEmp, setFormEmp]       = useState("")
  const [formTipo, setFormTipo]     = useState("")
  const [formInicio, setFormInicio] = useState("08:00")
  const [formFin, setFormFin]       = useState("17:00")
  const [loadingForm, setLoadingForm] = useState(false)

  // Form empleados
  const [mostrarFormEmp, setMostrarFormEmp] = useState(false)
  const [empNombre, setEmpNombre]     = useState("")
  const [empApellido, setEmpApellido] = useState("")
  const [empEmail, setEmpEmail]       = useState("")
  const [empTelefono, setEmpTelefono] = useState("")
  const [loadingEmp, setLoadingEmp]   = useState(false)
  const [empEditando, setEmpEditando] = useState(null) // empleado siendo editado

  // Form tipo eventos
  const [mostrarFormEvento, setMostrarFormEvento] = useState(false)
  const [eventoNombre, setEventoNombre]     = useState("")
  const [eventoDesc, setEventoDesc]         = useState("")
  const [eventoTiempo, setEventoTiempo]     = useState(15)
  const [eventoReq, setEventoReq]           = useState("")
  const [loadingEvento, setLoadingEvento]   = useState(false)

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
      if (seccion === "asignaciones") {
        const [e, t, a] = await Promise.all([
          api.get("/empleados/"),
          api.get("/tipo-eventos/"),
          api.get("/asignaciones/"),
        ])
        setEmpleados(e.data)
        setTipoEventos(t.data)
        setAsignaciones(a.data)
        if (e.data.length > 0) setFormEmp(e.data[0].id)
        if (t.data.length > 0) setFormTipo(t.data[0].id)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // ── CRUD Empleados ──────────────────────────────────────
  const crearEmpleado = async () => {
    if (!empNombre || !empApellido || !empEmail) {
      setMensaje("❌ Completá nombre, apellido y email")
      return
    }
    setLoadingEmp(true)
    try {
      await api.post("/empleados/", {
        nombre: empNombre, apellido: empApellido,
        email: empEmail, telefono: empTelefono || null, activo: true
      })
      setMensaje(`✅ Empleado ${empNombre} ${empApellido} creado correctamente`)
      setMostrarFormEmp(false)
      setEmpNombre(""); setEmpApellido(""); setEmpEmail(""); setEmpTelefono("")
      cargarDatos()
    } catch (e) {
      const msg = e.response?.data?.detail
      setMensaje("❌ " + (typeof msg === "string" ? msg : "Error al crear empleado"))
    } finally {
      setLoadingEmp(false)
    }
  }

  const abrirEdicionEmp = (emp) => {
    setEmpEditando(emp)
    setEmpNombre(emp.nombre)
    setEmpApellido(emp.apellido)
    setEmpEmail(emp.email)
    setEmpTelefono(emp.telefono || "")
    setMostrarFormEmp(true)
  }

  const validarTelefono = (tel) => {
    if (!tel) return true // opcional
    return /^\d{10,15}$/.test(tel)
  }

  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validarNombre = (val) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(val.trim())

  const guardarEmpleado = async () => {
    if (!empNombre || !empApellido || !empEmail) {
      setMensaje("❌ Completá nombre, apellido y email")
      return
    }
    if (!validarNombre(empNombre)) {
      setMensaje("❌ El nombre solo puede contener letras")
      return
    }
    if (!validarNombre(empApellido)) {
      setMensaje("❌ El apellido solo puede contener letras")
      return
    }
    if (!validarEmail(empEmail)) {
      setMensaje("❌ El email no tiene un formato válido (debe incluir @ y dominio)")
      return
    }
    if (empTelefono && !validarTelefono(empTelefono)) {
      setMensaje("❌ El teléfono debe tener solo números (10 a 15 dígitos), sin espacios ni guiones")
      return
    }
    setLoadingEmp(true)
    try {
      if (empEditando) {
        await api.put(`/empleados/${empEditando.id}`, {
          nombre: empNombre, apellido: empApellido,
          email: empEmail, telefono: empTelefono || null, activo: true
        })
        setMensaje(`✅ Empleado ${empNombre} ${empApellido} actualizado`)
      } else {
        await api.post("/empleados/", {
          nombre: empNombre, apellido: empApellido,
          email: empEmail, telefono: empTelefono || null, activo: true
        })
        setMensaje(`✅ Empleado ${empNombre} ${empApellido} creado`)
      }
      setMostrarFormEmp(false)
      setEmpEditando(null)
      setEmpNombre(""); setEmpApellido(""); setEmpEmail(""); setEmpTelefono("")
      cargarDatos()
    } catch (e) {
      const msg = e.response?.data?.detail
      setMensaje("❌ " + (typeof msg === "string" ? msg : "Error al guardar empleado"))
    } finally {
      setLoadingEmp(false)
    }
  }

  const darBajaEmpleado = async (id, nombre) => {
    if (!confirm(`¿Dar de baja a ${nombre}?`)) return
    try {
      await api.delete(`/empleados/${id}`)
      setMensaje(`✅ ${nombre} dado de baja`)
      cargarDatos()
    } catch (e) {
      setMensaje("❌ Error al dar de baja")
    }
  }

  // ── CRUD Tipo Eventos ───────────────────────────────────
  const crearEvento = async () => {
    if (!eventoNombre || !eventoTiempo) {
      setMensaje("❌ Completá nombre y tiempo base")
      return
    }
    setLoadingEvento(true)
    try {
      await api.post("/tipo-eventos/", {
        nombre: eventoNombre, descripcion: eventoDesc,
        tiempo_base_min: parseInt(eventoTiempo),
        requisitos: eventoReq || null, activo: true
      })
      setMensaje(`✅ Tipo de evento "${eventoNombre}" creado correctamente`)
      setMostrarFormEvento(false)
      setEventoNombre(""); setEventoDesc(""); setEventoTiempo(15); setEventoReq("")
      cargarDatos()
    } catch (e) {
      const msg = e.response?.data?.detail
      setMensaje("❌ " + (typeof msg === "string" ? msg : "Error al crear tipo de evento"))
    } finally {
      setLoadingEvento(false)
    }
  }

  const darBajaEvento = async (id, nombre) => {
    if (!confirm(`¿Dar de baja "${nombre}"?`)) return
    try {
      await api.delete(`/tipo-eventos/${id}`)
      setMensaje(`✅ "${nombre}" dado de baja`)
      cargarDatos()
    } catch (e) {
      setMensaje("❌ Error al dar de baja")
    }
  }

  // ── CRUD Asignaciones ───────────────────────────────────
  const crearAsignacion = async () => {
    if (!formEmp || !formTipo) return
    setLoadingForm(true)
    setMensaje("")
    try {
      const hoy = new Date().toISOString().split("T")[0]
      await api.post("/asignaciones/", {
        id_empleado: parseInt(formEmp), id_tipo_evento: parseInt(formTipo),
        fecha: hoy, hora_inicio: formInicio, hora_fin: formFin,
      })
      const emp  = empleados.find(e => e.id === parseInt(formEmp))
      const tipo = tipoEventos.find(t => t.id === parseInt(formTipo))
      setMensaje(`✅ ${emp?.nombre} ${emp?.apellido} asignado a "${tipo?.nombre}" hoy de ${formInicio} a ${formFin}`)
      cargarDatos()
    } catch (e) {
      const msg = e.response?.data?.detail
      setMensaje("❌ " + (typeof msg === "string" ? msg : "Error al crear asignación"))
    } finally {
      setLoadingForm(false)
    }
  }

  const darBajaAsignacion = async (id) => {
    try {
      await api.delete("/asignaciones/" + id)
      setMensaje("✅ Asignación dada de baja")
      cargarDatos()
    } catch (e) {
      setMensaje("❌ Error al dar de baja")
    }
  }

  const cerrarVencidas = async () => {
    try {
      const r = await api.post("/admin/cerrar-reservas-vencidas")
      setMensaje(`✅ ${r.data.mensaje || "Reservas vencidas cerradas correctamente"}`)
      cargarDatos()
    } catch (e) {
      setMensaje("❌ Error al cerrar reservas vencidas")
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

  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"

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
            { id: "dashboard",    icon: BarChart3, label: "Dashboard" },
            { id: "reservas",     icon: Calendar,  label: "Reservas" },
            { id: "empleados",    icon: Users,     label: "Empleados" },
            { id: "eventos",      icon: Plus,      label: "Tipo Eventos" },
            { id: "asignaciones", icon: Link,      label: "Asignaciones" },
          ].map(item => (
            <button key={item.id} onClick={() => { setSeccion(item.id); setMensaje("") }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-left ${
                seccion === item.id ? "bg-blue-600" : "hover:bg-blue-800"}`}>
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <button onClick={onLogout}
          className="flex items-center gap-3 px-6 py-4 hover:bg-blue-800 transition border-t border-blue-700">
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

        {mensaje && (
          <div className="mb-4 p-4 bg-white rounded-xl shadow border-l-4 border-blue-500 text-sm flex justify-between">
            <span>{mensaje}</span>
            <button onClick={() => setMensaje("")}><X size={14} className="text-gray-400" /></button>
          </div>
        )}

        {/* DASHBOARD */}
        {seccion === "dashboard" && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={cerrarVencidas}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                🔒 Cerrar reservas vencidas
              </button>
            </div>
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">Reservas</h3>
                <div className="flex items-center gap-2">
                  {["hoy","semana","mes","todas"].map(p => (
                    <button key={p} onClick={() => setFiltroPeriodo(p)}
                      className={"px-3 py-1 rounded-lg text-xs font-medium capitalize transition " +
                        (filtroPeriodo === p ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              {(() => {
                const ahora = new Date()
                const reservasPeriodo = reservas.filter(r => {
                  const fecha = new Date(r.fecha_hora_reserva)
                  if (filtroPeriodo === "hoy") return fecha.toDateString() === ahora.toDateString()
                  if (filtroPeriodo === "semana") return fecha >= new Date(ahora.getTime() - 7*24*60*60*1000)
                  if (filtroPeriodo === "mes") return fecha >= new Date(ahora.getTime() - 30*24*60*60*1000)
                  return true
                })
                const toggleSort = (campo) => setSortDashboard(s =>
                  s.campo === campo ? { campo, dir: s.dir === "asc" ? "desc" : "asc" } : { campo, dir: "asc" })
                const flecha = (campo) => sortDashboard.campo === campo
                  ? (sortDashboard.dir === "asc" ? " ↑" : " ↓") : " ↕"
                const reservasOrdenadas = [...reservasPeriodo].sort((a, b) => {
                  const dir = sortDashboard.dir === "asc" ? 1 : -1
                  if (sortDashboard.campo === "id") return (a.id - b.id) * dir
                  if (sortDashboard.campo === "fecha") return (new Date(a.fecha_hora_reserva) - new Date(b.fecha_hora_reserva)) * dir
                  if (sortDashboard.campo === "estado") return a.estado.localeCompare(b.estado) * dir
                  if (sortDashboard.campo === "eta") return (a.tiempo_espera_estimado_min - b.tiempo_espera_estimado_min) * dir
                  return 0
                })
                return (
                  <>
                    <p className="text-xs text-gray-400 mb-3">{reservasOrdenadas.length} reservas</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          {[
                            { label: "ID",     campo: "id" },
                            { label: "Usuario", campo: null },
                            { label: "Fecha",  campo: "fecha" },
                            { label: "Estado", campo: "estado" },
                            { label: "ETA",    campo: "eta" },
                          ].map(col => (
                            <th key={col.label}
                              className={"pb-2 " + (col.campo ? "cursor-pointer hover:text-blue-600 select-none" : "")}
                              onClick={() => col.campo && toggleSort(col.campo)}>
                              {col.label}{col.campo && flecha(col.campo)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reservasOrdenadas.slice(0, 15).map(r => (
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
                        {reservasOrdenadas.length === 0 && (
                          <tr><td colSpan={5} className="py-8 text-center text-gray-400">Sin reservas para este período</td></tr>
                        )}
                      </tbody>
                    </table>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* EMPLEADOS */}
        {seccion === "empleados" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setMostrarFormEmp(!mostrarFormEmp)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                {mostrarFormEmp ? <><X size={14}/> Cancelar</> : <><Plus size={14}/> Nuevo empleado</>}
              </button>
            </div>

            {mostrarFormEmp && (
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-semibold text-gray-800 mb-4">{empEditando ? `Editar: ${empEditando.nombre} ${empEditando.apellido}` : "Nuevo empleado"}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                    <input className={inputClass} value={empNombre} onChange={e => setEmpNombre(e.target.value)} placeholder="Juan" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Apellido *</label>
                    <input className={inputClass} value={empApellido} onChange={e => setEmpApellido(e.target.value)} placeholder="García" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                    <input className={inputClass} type="email" value={empEmail} onChange={e => setEmpEmail(e.target.value)} placeholder="juan@empresa.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono <span className="text-gray-400">(solo números, sin espacios)</span></label>
                    <input className={inputClass} value={empTelefono}
                      onChange={e => setEmpTelefono(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="5491112345678" maxLength={15} inputMode="numeric" />
                  </div>
                </div>
                <button onClick={guardarEmpleado} disabled={loadingEmp}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                  {loadingEmp ? "Guardando..." : (empEditando ? "Guardar cambios" : "Crear empleado")}
                </button>
              </div>
            )}

            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500">
                    <th className="px-6 py-3">Legajo</th>
                    <th className="px-6 py-3">Nombre</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Teléfono</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {empleados.map(e => (
                    <tr key={e.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-blue-600">{e.legajo}</td>
                      <td className="px-6 py-3 font-medium">{e.nombre} {e.apellido}</td>
                      <td className="px-6 py-3 text-gray-500">{e.email}</td>
                      <td className="px-6 py-3 text-gray-500">{e.telefono || "—"}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${e.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {e.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => abrirEdicionEmp(e)}
                            className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs font-medium">
                            <Edit2 size={12}/> Editar
                          </button>
                          {e.activo && (
                            <button onClick={() => darBajaEmpleado(e.id, `${e.nombre} ${e.apellido}`)}
                              className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-medium">
                              <Trash2 size={12}/> Dar de baja
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TIPO EVENTOS */}
        {seccion === "eventos" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setMostrarFormEvento(!mostrarFormEvento)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                {mostrarFormEvento ? <><X size={14}/> Cancelar</> : <><Plus size={14}/> Nuevo tipo de evento</>}
              </button>
            </div>

            {mostrarFormEvento && (
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Nuevo tipo de evento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                    <input className={inputClass} value={eventoNombre} onChange={e => setEventoNombre(e.target.value)} placeholder="Ej: Apertura de cuenta" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                    <input className={inputClass} value={eventoDesc} onChange={e => setEventoDesc(e.target.value)} placeholder="Descripción del trámite" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tiempo base (minutos) *</label>
                    <input className={inputClass} type="number" min="1" value={eventoTiempo} onChange={e => setEventoTiempo(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Requisitos</label>
                    <input className={inputClass} value={eventoReq} onChange={e => setEventoReq(e.target.value)} placeholder="Ej: DNI, factura" />
                  </div>
                </div>
                <button onClick={crearEvento} disabled={loadingEvento}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                  {loadingEvento ? "Creando..." : "Crear tipo de evento"}
                </button>
              </div>
            )}

            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500">
                    <th className="px-6 py-3">Nombre</th>
                    <th className="px-6 py-3">Descripción</th>
                    <th className="px-6 py-3">Tiempo base</th>
                    <th className="px-6 py-3">Requisitos</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {tipoEventos.map(t => (
                    <tr key={t.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium">{t.nombre}</td>
                      <td className="px-6 py-3 text-gray-500">{t.descripcion || "—"}</td>
                      <td className="px-6 py-3">{t.tiempo_base_min} min</td>
                      <td className="px-6 py-3 text-gray-500">{t.requisitos || "—"}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${t.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {t.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {t.activo && (
                          <button onClick={() => darBajaEvento(t.id, t.nombre)}
                            className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-medium">
                            <Trash2 size={12}/> Dar de baja
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RESERVAS */}
        {seccion === "reservas" && (() => {
          const toggleSort = (campo) => {
            setSortReservas(s => s.campo === campo
              ? { campo, dir: s.dir === "asc" ? "desc" : "asc" }
              : { campo, dir: "asc" })
          }
          const flecha = (campo) => sortReservas.campo === campo
            ? (sortReservas.dir === "asc" ? " ↑" : " ↓") : " ↕"

          const reservasFiltradas = reservas
            .filter(r => filtroEstado ? r.estado === filtroEstado : true)
            .sort((a, b) => {
              const dir = sortReservas.dir === "asc" ? 1 : -1
              if (sortReservas.campo === "id") return (a.id - b.id) * dir
              if (sortReservas.campo === "fecha") return (new Date(a.fecha_hora_reserva) - new Date(b.fecha_hora_reserva)) * dir
              if (sortReservas.campo === "estado") return a.estado.localeCompare(b.estado) * dir
              if (sortReservas.campo === "eta") return (a.tiempo_espera_estimado_min - b.tiempo_espera_estimado_min) * dir
              if (sortReservas.campo === "posicion") return (a.posicion_en_cola - b.posicion_en_cola) * dir
              return 0
            })

          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-white rounded-xl shadow px-6 py-3">
                <span className="text-sm text-gray-500 font-medium">Filtrar por estado:</span>
                <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Todos</option>
                  {["PENDIENTE","CONFIRMADA","EN_ESPERA","EN_CURSO","ATENDIDA","CANCELADA"].map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-400">{reservasFiltradas.length} reservas</span>
              </div>

              <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-500">
                      {[
                        { label: "ID",       campo: "id" },
                        { label: "Usuario",  campo: null },
                        { label: "Fecha",    campo: "fecha" },
                        { label: "Estado",   campo: "estado" },
                        { label: "ETA",      campo: "eta" },
                        { label: "Posición", campo: "posicion" },
                      ].map(col => (
                        <th key={col.label}
                          className={"px-6 py-3 " + (col.campo ? "cursor-pointer hover:text-blue-600 select-none" : "")}
                          onClick={() => col.campo && toggleSort(col.campo)}>
                          {col.label}{col.campo && flecha(col.campo)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reservasFiltradas.map(r => (
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
                    {reservasFiltradas.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Sin reservas para este filtro</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}

        {/* ASIGNACIONES */}
        {seccion === "asignaciones" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-800 text-lg mb-4">Nueva asignación para hoy</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Empleado</label>
                  <select value={formEmp} onChange={e => setFormEmp(e.target.value)} className={inputClass}>
                    {empleados.filter(e => e.activo).map(e => (
                      <option key={e.id} value={e.id}>{e.nombre} {e.apellido} — {e.legajo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de trámite</label>
                  <select value={formTipo} onChange={e => setFormTipo(e.target.value)} className={inputClass}>
                    {tipoEventos.filter(t => t.activo).map(t => (
                      <option key={t.id} value={t.id}>{t.nombre} ({t.tiempo_base_min} min)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hora inicio</label>
                  <input type="time" value={formInicio} onChange={e => setFormInicio(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hora fin</label>
                  <input type="time" value={formFin} onChange={e => setFormFin(e.target.value)} className={inputClass} />
                </div>
              </div>
              <button onClick={crearAsignacion} disabled={loadingForm}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 text-sm">
                {loadingForm ? "Asignando..." : "Crear asignación"}
              </button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-gray-700">Asignaciones activas</h3>
              </div>
              {asignaciones.length === 0 ? (
                <p className="p-8 text-center text-gray-400">No hay asignaciones activas</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-500">
                      <th className="px-6 py-3">Empleado</th>
                      <th className="px-6 py-3">Tipo de trámite</th>
                      <th className="px-6 py-3">Horario</th>
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asignaciones.map(a => {
                      const emp  = empleados.find(e => e.id === parseInt(a.id_empleado))
                      const tipo = tipoEventos.find(t => t.id === a.id_tipo_evento)
                      return (
                        <tr key={a.id} className="border-t hover:bg-gray-50">
                          <td className="px-6 py-3 font-medium">
                            {emp ? `${emp.nombre} ${emp.apellido}` : `Empleado #${a.id_empleado}`}
                            <span className="ml-2 text-xs text-gray-400">{emp?.legajo}</span>
                          </td>
                          <td className="px-6 py-3">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                              {tipo ? tipo.nombre : `Evento #${a.id_tipo_evento}`}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-gray-500">{a.hora_inicio} — {a.hora_fin}</td>
                          <td className="px-6 py-3 text-gray-500">{new Date(a.fecha).toLocaleDateString("es-AR")}</td>
                          <td className="px-6 py-3">
                            <button onClick={() => darBajaAsignacion(a.id)}
                              className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-medium">
                              <Trash2 size={12}/> Dar de baja
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
