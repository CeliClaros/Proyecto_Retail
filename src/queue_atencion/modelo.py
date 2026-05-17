from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class EstadoReserva(str, Enum):
    PENDIENTE  = "PENDIENTE"
    CONFIRMADA = "CONFIRMADA"
    EN_ESPERA  = "EN_ESPERA"
    EN_CURSO   = "EN_CURSO"
    ATENDIDA   = "ATENDIDA"
    CANCELADA  = "CANCELADA"

class ReservaCrear(BaseModel):
    id_usuario:            int
    id_tipo_evento:        int
    id_empleado_asignado:  Optional[int] = None
    fecha_hora_reserva:    datetime
    canal_notif:           Optional[str] = "whatsapp"
    ubicacion_lat:         Optional[float] = None
    ubicacion_lng:         Optional[float] = None

class ReservaRespuesta(BaseModel):
    id:                         int
    id_usuario:                 int
    id_tipo_evento:             int
    id_empleado_asignado:       Optional[int] = None
    fecha_hora_reserva:         datetime
    estado:                     EstadoReserva
    tiempo_espera_estimado_min: int
    posicion_en_cola:           int
    fecha_hora_checkin:         Optional[datetime] = None
    fecha_hora_checkout:        Optional[datetime] = None
    duracion_real_min:          Optional[int] = None
    canal_notif:                Optional[str] = None
    fecha_alta:                 datetime

    class Config:
        from_attributes = True
