from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

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
    hora_inicio:       Optional[str] = None
    hora_fin:          Optional[str] = None
