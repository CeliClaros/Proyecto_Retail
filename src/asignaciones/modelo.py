from datetime import date, datetime

from pydantic import BaseModel


class AsignacionCrear(BaseModel):
    id_empleado:    int
    id_tipo_evento: int
    fecha:          date
    hora_inicio:    str
    hora_fin:       str

class AsignacionRespuesta(BaseModel):
    id:             int
    id_empleado:    int
    id_tipo_evento: int
    fecha:          datetime
    hora_inicio:    str
    hora_fin:       str
    activo:         bool

    class Config:
        from_attributes = True

class AsignacionTransferir(BaseModel):
    id_empleado_nuevo: int
    hora_inicio:       str | None = None
    hora_fin:          str | None = None
