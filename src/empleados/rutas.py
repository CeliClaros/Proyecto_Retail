from fastapi import APIRouter, HTTPException
from .modelo import Empleado
from typing import List

rutas_empleados=APIRouter()
base_datos_empleados=[]

@rutas_empleados.get("/", response_model=List[Empleado])
def listar_empleados():
    return base_datos_empleados

@rutas_empleados.post("/", response_model=Empleado)
def crear_empleado(empleado: Empleado):
    nuevo_id=len(base_datos_empleados)+1
    empleado.id=nuevo_id
    base_datos_empleados.append(empleado)
    return empleado
