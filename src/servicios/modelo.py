from datetime import datetime

from pydantic import BaseModel


class TipoEventoCrear(BaseModel):
    nombre:          str
    descripcion:     str | None = None
    tiempo_base_min: int
    requisitos:      str | None = None
    activo:          bool = True

class TipoEventoRespuesta(BaseModel):
    id:              int
    nombre:          str
    descripcion:     str | None = None
    tiempo_base_min: int
    requisitos:      str | None = None
    activo:          bool
    fecha_alta:      datetime

    class Config:
        from_attributes = True
