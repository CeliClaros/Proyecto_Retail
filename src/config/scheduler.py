from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from src.config.base_datos import SessionLocal
from src.config.modelos_db import EstadoReservaEnum, LogSistema, Reserva


def cerrar_reservas_vencidas():
    db: Session = SessionLocal()
    try:
        ahora = datetime.utcnow()
        estados_activos = [
            EstadoReservaEnum.PENDIENTE,
            EstadoReservaEnum.CONFIRMADA,
            EstadoReservaEnum.EN_ESPERA,
            EstadoReservaEnum.EN_CURSO,
        ]
        reservas_vencidas = db.query(Reserva).filter(
            Reserva.estado.in_(estados_activos),
            Reserva.fecha_hora_reserva < ahora
        ).all()

        count = 0
        for reserva in reservas_vencidas:
            reserva.estado = EstadoReservaEnum.CANCELADA
            log = LogSistema(
                accion              = "CIERRE_AUTOMATICO",
                id_reserva          = reserva.id,
                descripcion         = f"Reserva cerrada automáticamente por vencimiento. Estado anterior: {reserva.estado.value}",
                usuario_responsable = "SISTEMA"
            )
            db.add(log)
            count += 1

        db.commit()
        print(f"[SCHEDULER] {count} reservas cerradas automáticamente")
    except Exception as e:
        print(f"[SCHEDULER] Error: {e}")
        db.rollback()
    finally:
        db.close()

def iniciar_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        func=lambda: avisar_usuarios_proximos(next(get_db())),
        trigger="interval",
        minutes=5,
        id="avisar_proximos",
        name="Avisar usuarios próximos a ser atendidos",
        replace_existing=True
    )
    scheduler.add_job(
        cerrar_reservas_vencidas,
        trigger="cron",
        hour=23,
        minute=59,
        id="cierre_diario"
    )
    scheduler.start()
    print("[SCHEDULER] Iniciado - cierre diario a las 23:59")
    return scheduler

def avisar_usuarios_proximos(db_session):
    """
    Cada 5 minutos: avisa por WhatsApp a los usuarios cuyo ETA
    es menor o igual al tiempo de viaje estimado (25 min mock).
    Solo avisa a reservas PENDIENTE/CONFIRMADA/EN_ESPERA de hoy.
    """
    from datetime import date
    from src.config.modelos_db import Reserva, EstadoReservaEnum, Usuario, TipoEvento
    from src.notificaciones.envio import enviar_whatsapp
    hoy = date.today()
    reservas = db_session.query(Reserva).filter(
        Reserva.estado.in_([
            EstadoReservaEnum.PENDIENTE,
            EstadoReservaEnum.CONFIRMADA,
            EstadoReservaEnum.EN_ESPERA
        ]),
        Reserva.fecha_hora_reserva >= datetime.combine(hoy, datetime.min.time()),
        Reserva.fecha_hora_reserva <  datetime.combine(hoy, datetime.max.time()),
    ).all()
    for reserva in reservas:
        try:
            usuario = db_session.query(Usuario).filter(Usuario.id == reserva.id_usuario).first()
            tipo    = db_session.query(TipoEvento).filter(TipoEvento.id == reserva.id_tipo_evento).first()
            if not usuario or not usuario.telefono:
                continue
            eta = reserva.tiempo_espera_estimado_min or 0
            tiempo_viaje = 25  # mock — en producción usar Google Maps API
            if eta <= tiempo_viaje + 5:
                nombre_tramite = tipo.nombre if tipo else "tu trámite"
                mensaje = (
                    f"⏰ Hola {usuario.nombre}! Es hora de salir.\n\n"
                    f"Tu turno para {nombre_tramite} está próximo.\n"
                    f"Posición en fila: #{reserva.posicion_en_cola}\n"
                    f"Tiempo de espera estimado: {eta} minutos\n"
                    f"Tiempo de viaje al local: ~{tiempo_viaje} minutos\n\n"
                    f"📍 Ruta al local: https://www.google.com/maps/dir/?api=1&destination={reserva.ubicacion_lat},{reserva.ubicacion_lng}\n\n"
                    f"¡Te esperamos!"
                )
                enviar_whatsapp(usuario.telefono, mensaje)
                print(f"[SCHEDULER] Aviso enviado a {usuario.nombre} — ETA: {eta} min")
        except Exception as e:
            print(f"[SCHEDULER] Error al avisar usuario {reserva.id_usuario}: {e}")
