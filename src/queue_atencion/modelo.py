from datetime import datetime
from enum import Enum

from pydantic import BaseModel


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
    id_empleado_asignado:  int | None = None
    fecha_hora_reserva:    datetime | None = None
    canal_notif:           str | None = "whatsapp"
    ubicacion_lat:         float | None = None
    ubicacion_lng:         float | None = None

class ReservaRespuesta(BaseModel):
    id:                         int
    id_usuario:                 int
    id_tipo_evento:             int
    id_empleado_asignado:       int | None = None
    fecha_hora_reserva:         datetime
    estado:                     EstadoReserva
    tiempo_espera_estimado_min: int
    posicion_en_cola:           int
    fecha_hora_checkin:         datetime | None = None
    fecha_hora_checkout:        datetime | None = None
    duracion_real_min:          int | None = None
    canal_notif:                str | None = None
    ubicacion_lat:              float | None = None
    ubicacion_lng:              float | None = None
    fecha_alta:                 datetime

    class Config:
        from_attributes = True
