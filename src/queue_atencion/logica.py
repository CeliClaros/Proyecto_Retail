from .modelo import Reserva, EstadoReserva
from typing import List

def calcular_tiempo_espera(reservas_pendientes: List[Reserva], rendimiento_empleado: float) -> int:
    total = 0
    for res in reservas_pendientes:
        total += int(rendimiento_empleado)
    return total
