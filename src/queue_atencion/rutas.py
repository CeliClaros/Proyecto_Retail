from fastapi import APIRouter, HTTPException, status
from .modelo import Reserva, EstadoReserva
from typing import List

rutas_atencion = APIRouter()
base_datos_reservas = []

@rutas_atencion.get("/", response_model=List[Reserva], summary="Listar todas las reservas")
def listar_reservas():
    return base_datos_reservas

@rutas_atencion.post("/", response_model=Reserva, status_code=status.HTTP_201_CREATED, summary="Crear nueva reserva")
def crear_reserva(reserva: Reserva):
    nuevo_id = len(base_datos_reservas) + 1
    reserva.id = nuevo_id
    base_datos_reservas.append(reserva)
    return reserva

@rutas_atencion.get("/{reserva_id}", response_model=Reserva, summary="Obtener reserva por ID")
def obtener_reserva(reserva_id: int):
    for res in base_datos_reservas:
        if res.id == reserva_id:
            return res
    raise HTTPException(status_code=404, detail="Reserva no encontrada")
