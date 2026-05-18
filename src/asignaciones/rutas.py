from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from src.config.base_datos import get_db
from src.config.modelos_db import AsignacionDiaria, Empleado, TipoEvento
from src.asignaciones.modelo import AsignacionCrear, AsignacionRespuesta, AsignacionTransferir
from src.asignaciones.logica import obtener_asignacion_activa, obtener_ranking_empleados, sugerir_rotacion

rutas_asignaciones = APIRouter()

@rutas_asignaciones.get("/", response_model=List[AsignacionRespuesta])
def listar_asignaciones(db: Session = Depends(get_db)):
    return db.query(AsignacionDiaria).filter(AsignacionDiaria.activo == True).all()

@rutas_asignaciones.post("/", response_model=AsignacionRespuesta, status_code=201)
def crear_asignacion(datos: AsignacionCrear, db: Session = Depends(get_db)):
    empleado = db.query(Empleado).filter(Empleado.id == datos.id_empleado).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    tipo = db.query(TipoEvento).filter(TipoEvento.id == datos.id_tipo_evento).first()
    if not tipo:
        raise HTTPException(status_code=404, detail="Tipo de evento no encontrado")
    asignacion = AsignacionDiaria(
        id_empleado    = datos.id_empleado,
        id_tipo_evento = datos.id_tipo_evento,
        fecha          = datetime.combine(datos.fecha, datetime.min.time()),
        hora_inicio    = datos.hora_inicio,
        hora_fin       = datos.hora_fin,
        activo         = True
    )
    db.add(asignacion)
    db.commit()
    db.refresh(asignacion)
    return asignacion

@rutas_asignaciones.get("/activa", summary="Ver quién atiende ahora un trámite")
def asignacion_activa(id_tipo_evento: int, db: Session = Depends(get_db)):
    asig = obtener_asignacion_activa(db, id_tipo_evento)
    if not asig:
        return {"mensaje": "No hay empleado asignado para este trámite ahora"}
    empleado = db.query(Empleado).filter(Empleado.id == asig.id_empleado).first()
    return {
        "id_asignacion": asig.id,
        "empleado":      f"{empleado.nombre} {empleado.apellido}",
        "legajo":        empleado.legajo,
        "hora_inicio":   asig.hora_inicio,
        "hora_fin":      asig.hora_fin,
    }

@rutas_asignaciones.delete("/{asignacion_id}", summary="Dar de baja una asignación")
def baja_asignacion(asignacion_id: int, db: Session = Depends(get_db)):
    asig = db.query(AsignacionDiaria).filter(AsignacionDiaria.id == asignacion_id).first()
    if not asig:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    asig.activo = False
    db.commit()
    return {"mensaje": "Asignación desactivada correctamente"}

@rutas_asignaciones.post("/{asignacion_id}/transferir", summary="Transferir asignación a otro empleado")
def transferir_asignacion(asignacion_id: int, datos: AsignacionTransferir, db: Session = Depends(get_db)):
    asig = db.query(AsignacionDiaria).filter(AsignacionDiaria.id == asignacion_id).first()
    if not asig:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    empleado_nuevo = db.query(Empleado).filter(Empleado.id == datos.id_empleado_nuevo).first()
    if not empleado_nuevo:
        raise HTTPException(status_code=404, detail="Empleado nuevo no encontrado")
    asig.activo = False
    db.commit()
    nueva = AsignacionDiaria(
        id_empleado    = datos.id_empleado_nuevo,
        id_tipo_evento = asig.id_tipo_evento,
        fecha          = asig.fecha,
        hora_inicio    = datos.hora_inicio or asig.hora_inicio,
        hora_fin       = datos.hora_fin    or asig.hora_fin,
        activo         = True
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"mensaje": f"Asignación transferida a {empleado_nuevo.nombre} {empleado_nuevo.apellido}", "nueva_asignacion_id": nueva.id}

@rutas_asignaciones.get("/ranking/{id_tipo_evento}", summary="Ranking de empleados por tipo de trámite")
def ranking_empleados(id_tipo_evento: int, db: Session = Depends(get_db)):
    return obtener_ranking_empleados(db, id_tipo_evento)

@rutas_asignaciones.get("/sugerir-rotacion/{asignacion_id}", summary="Sugerir rotación de empleado")
def sugerir(asignacion_id: int, db: Session = Depends(get_db)):
    asig = db.query(AsignacionDiaria).filter(AsignacionDiaria.id == asignacion_id).first()
    if not asig:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return sugerir_rotacion(db, asig.id_tipo_evento, asig.id_empleado)
