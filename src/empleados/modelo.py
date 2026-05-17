from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EmpleadoCrear(BaseModel):
    nombre:   str
    apellido: str
    email:    str
    telefono: Optional[str] = None
    activo:   bool = True

class EmpleadoRespuesta(BaseModel):
    id:         int
    legajo:     str
    nombre:     str
    apellido:   str
    email:      str
    telefono:   Optional[str] = None
    activo:     bool
    fecha_alta: datetime

    class Config:
        from_attributes = True
