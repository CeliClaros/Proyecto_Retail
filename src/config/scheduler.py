from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from sqlalchemy.orm import Session
from src.config.base_datos import SessionLocal
from src.config.modelos_db import Reserva, EstadoReservaEnum, LogSistema

def cerrar_reservas_vencidas():
    db: Session = SessionLocal()
    try:
        ahora = datetime.utcnow()
        estados_activos = [
            EstadoReservaEnum.PENDIENTE,
            EstadoReservaEnum.CONFIRMADA,
            EstadoReservaEnum.EN_ESPERA,
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
        cerrar_reservas_vencidas,
        trigger="cron",
        hour=23,
        minute=59,
        id="cierre_diario"
    )
    scheduler.start()
    print("[SCHEDULER] Iniciado - cierre diario a las 23:59")
    return scheduler
