from datetime import datetime

from pydantic import BaseModel


class EmpleadoCrear(BaseModel):
    nombre:   str
    apellido: str
    email:    str
    telefono: str | None = None
    activo:   bool = True

class EmpleadoRespuesta(BaseModel):
    id:         int
    legajo:     str
    nombre:     str
    apellido:   str
    email:      str
    telefono:   str | None = None
    activo:     bool
    fecha_alta: datetime

    class Config:
        from_attributes = True
