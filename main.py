from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.empleados.rutas import rutas_empleados
from src.servicios.rutas import rutas_servicios
from src.queue_atencion.rutas import rutas_atencion
from src.notificaciones.envio import rutas_notificaciones
from src.asignaciones.rutas import rutas_asignaciones
from src.auth.rutas import rutas_auth
from src.config.base_datos import crear_tablas
from src.config.scheduler import iniciar_scheduler

crear_tablas()
iniciar_scheduler()

app = FastAPI(
    title="Sistema Gestión de Atención - Retail",
    description="Sistema de gestión de reservas, pronóstico y flujo de atención al público",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rutas_auth,           prefix="/api/auth",           tags=["Autenticación"])
app.include_router(rutas_empleados,      prefix="/api/empleados",      tags=["Empleados"])
app.include_router(rutas_servicios,      prefix="/api/tipo-eventos",   tags=["Tipo de Eventos"])
app.include_router(rutas_atencion,       prefix="/api/reservas",       tags=["Reservas"])
app.include_router(rutas_asignaciones,   prefix="/api/asignaciones",   tags=["Asignaciones"])
app.include_router(rutas_notificaciones, prefix="/api/notificaciones", tags=["Notificaciones"])

@app.get("/", tags=["Sistema"])
def raiz():
    return {
        "mensaje": "SISTEMA ACTIVO",
        "nombre": "Gestión de Reservas Retail",
        "estado": "OK",
        "version": "1.0.0"
    }

@app.post("/api/admin/cerrar-reservas-vencidas", tags=["Admin"])
def cerrar_vencidas_manual():
    from src.config.scheduler import cerrar_reservas_vencidas
    cerrar_reservas_vencidas()
    return {"mensaje": "Proceso de cierre ejecutado"}
