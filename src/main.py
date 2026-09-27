from contextlib import asynccontextmanager
from fastapi import FastAPI

from src.empleados.rutas import rutas_empleados
from src.notificaciones.envio import *
from src.queue_atencion.rutas import rutas_atencion
from src.servicios.rutas import rutas_servicios
from src.config.scheduler import iniciar_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = iniciar_scheduler()
    yield
    scheduler.shutdown()

app = FastAPI(
    title="Sistema Gestión de Atención - Retail",
    description="Sistema de gestión de reservas, pronóstico y flujo de atención al público",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(rutas_empleados, prefix="/api/empleados", tags=["Gestión de Empleados"])
app.include_router(rutas_servicios, prefix="/api/servicios", tags=["Gestión de Servicios"])
app.include_router(rutas_atencion, prefix="/api/reservas", tags=["Gestión de Reservas"])

@app.get("/", summary="Estado del sistema")
def raiz():
    return {
        "mensaje": "✅ SISTEMA ACTIVO",
        "nombre": "Gestión de Reservas Retail",
        "estado": "OK",
        "version": "1.0.0"
    }
