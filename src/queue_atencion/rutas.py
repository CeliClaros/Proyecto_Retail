from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List
from src.config.base_datos import get_db
from src.config.modelos_db import Reserva, EstadoReservaEnum, HistorialAtencion, Usuario, TipoEvento
from src.notificaciones.envio import enviar_confirmacion_con_ruta
from src.queue_atencion.modelo import ReservaCrear, ReservaRespuesta
from src.queue_atencion.logica import (
    calcular_tiempo_espera,
    calcular_posicion_en_cola,
    actualizar_performance
)

rutas_atencion = APIRouter()

@rutas_atencion.get("/hoy", response_model=List[ReservaRespuesta])
def reservas_de_hoy(id_tipo_evento: int = None, db: Session = Depends(get_db)):
    hoy = date.today()
    query = db.query(Reserva).filter(
        Reserva.fecha_hora_reserva >= datetime.combine(hoy, datetime.min.time()),
        Reserva.fecha_hora_reserva <  datetime.combine(hoy, datetime.max.time())
    )
    if id_tipo_evento:
        query = query.filter(Reserva.id_tipo_evento == id_tipo_evento)
    return query.order_by(Reserva.id.asc()).all()

@rutas_atencion.get("/por-fecha", response_model=List[ReservaRespuesta])
def reservas_por_fecha(fecha: str, db: Session = Depends(get_db)):
    try:
        dia = datetime.strptime(fecha, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Usar YYYY-MM-DD")
    return db.query(Reserva).filter(
        Reserva.fecha_hora_reserva >= datetime.combine(dia, datetime.min.time()),
        Reserva.fecha_hora_reserva <  datetime.combine(dia, datetime.max.time())
    ).order_by(Reserva.posicion_en_cola).all()

@rutas_atencion.get("/", response_model=List[ReservaRespuesta])
def listar_reservas(db: Session = Depends(get_db)):
    return db.query(Reserva).all()

@rutas_atencion.post("/", response_model=ReservaRespuesta, status_code=201)
def crear_reserva(reserva: ReservaCrear, db: Session = Depends(get_db)):
    import os
    from zoneinfo import ZoneInfo
    ahora_ba = datetime.now(ZoneInfo("America/Argentina/Buenos_Aires"))
    hora_local = ahora_ba.hour
    dia_semana = ahora_ba.weekday()  # 0=lunes, 6=domingo
    horario_inicio = int(os.getenv("HORARIO_INICIO", 9))
    horario_fin    = int(os.getenv("HORARIO_FIN", 23))
    if dia_semana >= 5:
        raise HTTPException(status_code=400, detail="El servicio no está disponible los fines de semana")
    if hora_local < horario_inicio or hora_local >= horario_fin:
        raise HTTPException(status_code=400, detail=f"El servicio está disponible de lunes a viernes de {horario_inicio}:00 a {horario_fin}:00hs")
    datos = reserva.model_dump()
    # Fecha = ahora (FIFO puro)
    datos["fecha_hora_reserva"] = ahora
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

    # Notificación WhatsApp — best effort (no interrumpe si falla)
    try:
        usuario = db.query(Usuario).filter(Usuario.id == db_reserva.id_usuario).first()
        tipo    = db.query(TipoEvento).filter(TipoEvento.id == db_reserva.id_tipo_evento).first()
        if usuario and usuario.telefono and tipo:
            enviar_confirmacion_con_ruta(
                telefono         = usuario.telefono,
                nombre           = usuario.nombre,
                servicio         = tipo.nombre,
                tiempo_espera_min= db_reserva.tiempo_espera_estimado_min,
                posicion_cola    = db_reserva.posicion_en_cola or 1,
                usuario_lat      = float(db_reserva.ubicacion_lat or -34.6),
                usuario_lng      = float(db_reserva.ubicacion_lng or -58.4),
                local_lat        = float(db_reserva.ubicacion_lat or -34.6),
                local_lng        = float(db_reserva.ubicacion_lng or -58.4),
            )
    except Exception as e:
        print(f"[WHATSAPP] No se pudo enviar notificacion: {e}")

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
    reserva.estado             = EstadoReservaEnum.EN_CURSO
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
    historial = HistorialAtencion(
        id_reserva        = reserva.id,
        id_empleado       = reserva.id_empleado_asignado,
        id_tipo_evento    = reserva.id_tipo_evento,
        duracion_real_min = duracion
    )
    db.add(historial)
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

@rutas_atencion.patch("/{reserva_id}/mover-al-final")
def mover_al_final(reserva_id: int, db: Session = Depends(get_db)):
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    if reserva.estado not in [EstadoReservaEnum.PENDIENTE, EstadoReservaEnum.CONFIRMADA, EstadoReservaEnum.EN_ESPERA]:
        raise HTTPException(status_code=400, detail="Solo se pueden mover reservas activas")
    ultima_pos = db.query(Reserva).filter(
        Reserva.id_empleado_asignado == reserva.id_empleado_asignado,
        Reserva.estado.in_([EstadoReservaEnum.PENDIENTE, EstadoReservaEnum.CONFIRMADA, EstadoReservaEnum.EN_ESPERA])
    ).count()
    reserva.posicion_en_cola = ultima_pos + 1
    reserva.tiempo_espera_estimado_min = ultima_pos * 15
    db.commit()
    return {
        "mensaje": "Reserva movida al final de la cola",
        "nueva_posicion": reserva.posicion_en_cola,
        "nuevo_eta_min": reserva.tiempo_espera_estimado_min
    }

@rutas_atencion.get("/mis-reservas/{id_usuario}", response_model=List[ReservaRespuesta])
def mis_reservas(id_usuario: int, db: Session = Depends(get_db)):
    return db.query(Reserva).filter(
        Reserva.id_usuario == id_usuario
    ).order_by(Reserva.fecha_hora_reserva.desc()).all()
