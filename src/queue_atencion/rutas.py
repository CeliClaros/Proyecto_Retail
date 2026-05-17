from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from src.config.base_datos import get_db
from src.config.modelos_db import Reserva, EstadoReservaEnum, HistorialAtencion
from src.queue_atencion.modelo import ReservaCrear, ReservaRespuesta
from src.queue_atencion.logica import (
    calcular_tiempo_espera,
    calcular_posicion_en_cola,
    actualizar_performance
)

rutas_atencion = APIRouter()

@rutas_atencion.get("/", response_model=List[ReservaRespuesta])
def listar_reservas(db: Session = Depends(get_db)):
    return db.query(Reserva).all()

@rutas_atencion.post("/", response_model=ReservaRespuesta, status_code=201)
def crear_reserva(reserva: ReservaCrear, db: Session = Depends(get_db)):
    datos = reserva.model_dump()

    # Calcular posición y tiempo estimado si hay empleado asignado
    if datos.get("id_empleado_asignado"):
        datos["posicion_en_cola"] = calcular_posicion_en_cola(
            db, datos["id_empleado_asignado"], datos["fecha_hora_reserva"]
        )
        datos["tiempo_espera_estimado_min"] = calcular_tiempo_espera(
            db, datos["id_empleado_asignado"], datos["id_tipo_evento"]
        ) * datos["posicion_en_cola"]

    db_reserva = Reserva(**datos)
    db.add(db_reserva)
    db.commit()
    db.refresh(db_reserva)
    return db_reserva

@rutas_atencion.get("/{reserva_id}", response_model=ReservaRespuesta)
def obtener_reserva(reserva_id: int, db: Session = Depends(get_db)):
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return reserva

@rutas_atencion.post("/{reserva_id}/checkin")
def checkin(reserva_id: int, db: Session = Depends(get_db)):
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    reserva.estado            = EstadoReservaEnum.EN_CURSO
    reserva.fecha_hora_checkin = datetime.utcnow()
    db.commit()
    return {"mensaje": "Check-in registrado", "hora": reserva.fecha_hora_checkin}

@rutas_atencion.post("/{reserva_id}/checkout")
def checkout(reserva_id: int, db: Session = Depends(get_db)):
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    if not reserva.fecha_hora_checkin:
        raise HTTPException(status_code=400, detail="No se hizo check-in todavía")

    reserva.fecha_hora_checkout = datetime.utcnow()
    duracion = int((reserva.fecha_hora_checkout - reserva.fecha_hora_checkin).total_seconds() / 60)
    reserva.duracion_real_min   = duracion
    reserva.estado              = EstadoReservaEnum.ATENDIDA

    # Guardar historial
    historial = HistorialAtencion(
        id_reserva        = reserva.id,
        id_empleado       = reserva.id_empleado_asignado,
        id_tipo_evento    = reserva.id_tipo_evento,
        duracion_real_min = duracion
    )
    db.add(historial)

    # Actualizar performance del empleado
    if reserva.id_empleado_asignado:
        actualizar_performance(
            db, reserva.id_empleado_asignado,
            reserva.id_tipo_evento, duracion
        )

    db.commit()
    return {"mensaje": "Check-out registrado", "duracion_min": duracion}

@rutas_atencion.patch("/{reserva_id}/cancelar")
def cancelar_reserva(reserva_id: int, db: Session = Depends(get_db)):
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    reserva.estado = EstadoReservaEnum.CANCELADA
    db.commit()
    return {"mensaje": "Reserva cancelada"}
