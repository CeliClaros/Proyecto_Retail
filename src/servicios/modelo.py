from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TipoEventoCrear(BaseModel):
    nombre:          str
    descripcion:     Optional[str] = None
    tiempo_base_min: int
    requisitos:      Optional[str] = None
    activo:          bool = True

class TipoEventoRespuesta(BaseModel):
    id:              int
    nombre:          str
    descripcion:     Optional[str] = None
    tiempo_base_min: int
    requisitos:      Optional[str] = None
    activo:          bool
    fecha_alta:      datetime

    class Config:
        from_attributes = True
