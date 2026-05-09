from fastapi import APIRouter, HTTPException
from .modelo import Servicio
from typing import List

rutas_servicios=APIRouter()
base_datos_servicios=[]

@rutas_servicios.get("/", response_model=List[Servicio])
def listar_servicios():
    return base_datos_servicios

@rutas_servicios.post("/", response_model=Servicio)
def crear_servicio(servicio: Servicio):
    nuevo_id=len(base_datos_servicios)+1
    servicio.id=nuevo_id
    base_datos_servicios.append(servicio)
    return servicio
