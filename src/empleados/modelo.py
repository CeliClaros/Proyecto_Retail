from pydantic import BaseModel
from typing import Optional
from datetime import time

class Empleado(BaseModel):
    id: Optional[int] = None
    nombre: str
    apellido: str
    servicios_habilitados: list[int]
    horario_inicio: time
    horario_fin: time
    activo: bool = True
    rendimiento_promedio: float = 0.0
