from pydantic import BaseModel
from typing import Optional

class Servicio(BaseModel):
    id: Optional[int] = None
    nombre: str
    descripcion: str
    tiempo_estimado_base: int
    requisitos: str
    activo: bool = True
