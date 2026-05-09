from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class EstadoReserva(str, Enum):
    PENDIENTE = "Pendiente"
    CONFIRMADA = "Confirmada"
    EN_ESPERA = "En Espera"
    EN_CURSO = "En Curso"
    ATENDIDA = "Atendida"
    CANCELADA = "Cancelada"

class Reserva(BaseModel):
    id: Optional[int] = None
    id_usuario: int
    id_servicio: int
    id_empleado_asignado: Optional[int] = None
    fecha_hora: datetime
    estado: EstadoReserva = EstadoReserva.PENDIENTE
    tiempo_espera_estimado: int = 0
