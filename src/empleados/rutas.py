from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.config.base_datos import get_db
from src.config.modelos_db import Empleado
from src.empleados.modelo import EmpleadoCrear, EmpleadoRespuesta
from typing import List

rutas_empleados = APIRouter()

def generar_legajo(db: Session) -> str:
    ultimo = db.query(Empleado).order_by(Empleado.id.desc()).first()
    numero = (ultimo.id + 1) if ultimo else 1
    return f"EMP-{numero:04d}"

@rutas_empleados.get("/", response_model=List[EmpleadoRespuesta])
def listar_empleados(db: Session = Depends(get_db)):
    return db.query(Empleado).filter(Empleado.activo == True).all()

@rutas_empleados.post("/", response_model=EmpleadoRespuesta, status_code=201)
def crear_empleado(empleado: EmpleadoCrear, db: Session = Depends(get_db)):
    datos = empleado.model_dump()
    datos["legajo"] = generar_legajo(db)
    db_empleado = Empleado(**datos)
    db.add(db_empleado)
    db.commit()
    db.refresh(db_empleado)
    return db_empleado

@rutas_empleados.get("/{empleado_id}", response_model=EmpleadoRespuesta)
def obtener_empleado(empleado_id: int, db: Session = Depends(get_db)):
    empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return empleado

@rutas_empleados.put("/{empleado_id}", response_model=EmpleadoRespuesta)
def actualizar_empleado(empleado_id: int, datos: EmpleadoCrear, db: Session = Depends(get_db)):
    empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    for key, value in datos.model_dump().items():
        setattr(empleado, key, value)
    db.commit()
    db.refresh(empleado)
    return empleado

@rutas_empleados.delete("/{empleado_id}")
def eliminar_empleado(empleado_id: int, db: Session = Depends(get_db)):
    empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    empleado.activo = False
    db.commit()
    return {"mensaje": "Empleado desactivado correctamente"}
