from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.empleados.rutas import rutas_empleados
from src.servicios.rutas import rutas_servicios
from src.queue_atencion.rutas import rutas_atencion
from src.notificaciones.envio import rutas_notificaciones
from src.config.base_datos import crear_tablas

crear_tablas()

app = FastAPI(
    title="Sistema Gestión de Atención - Retail",
    description="Sistema de gestión de reservas, pronóstico y flujo de atención al público",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rutas_empleados,      prefix="/api/empleados",      tags=["Empleados"])
app.include_router(rutas_servicios,      prefix="/api/tipo-eventos",   tags=["Tipo de Eventos"])
app.include_router(rutas_atencion,       prefix="/api/reservas",       tags=["Reservas"])
app.include_router(rutas_notificaciones, prefix="/api/notificaciones", tags=["Notificaciones"])

@app.get("/", tags=["Sistema"])
def raiz():
    return {
        "mensaje": "SISTEMA ACTIVO",
        "nombre": "Gestión de Reservas Retail",
        "estado": "OK",
        "version": "1.0.0"
    }
