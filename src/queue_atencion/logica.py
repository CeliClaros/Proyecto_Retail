from sqlalchemy.orm import Session
from src.config.modelos_db import Reserva, PerformanceEmpleado, EstadoReservaEnum

def calcular_tiempo_espera(
    db: Session,
    id_empleado: int,
    id_tipo_evento: int
) -> int:
    """
    Calcula el tiempo de espera estimado basado en
    el historial de performance del empleado para ese tipo de evento.
    Si no hay historial, usa el tiempo base del tipo de evento.
    """
    performance = db.query(PerformanceEmpleado).filter(
        PerformanceEmpleado.id_empleado    == id_empleado,
        PerformanceEmpleado.id_tipo_evento == id_tipo_evento
    ).first()

    if performance and performance.total_atenciones > 0:
        return int(performance.promedio_duracion_min)

    # Sin historial: usar tiempo base del tipo de evento
    from src.config.modelos_db import TipoEvento
    tipo = db.query(TipoEvento).filter(TipoEvento.id == id_tipo_evento).first()
    return tipo.tiempo_base_min if tipo else 15


def calcular_posicion_en_cola(
    db: Session,
    id_empleado: int,
    fecha_hora_reserva
) -> int:
    """
    Calcula la posición en la cola contando reservas
    activas anteriores para ese empleado.
    """
    estados_activos = [
        EstadoReservaEnum.PENDIENTE,
        EstadoReservaEnum.CONFIRMADA,
        EstadoReservaEnum.EN_ESPERA,
        EstadoReservaEnum.EN_CURSO
    ]
    cantidad = db.query(Reserva).filter(
        Reserva.id_empleado_asignado == id_empleado,
        Reserva.fecha_hora_reserva   <  fecha_hora_reserva,
        Reserva.estado.in_(estados_activos)
    ).count()
    return cantidad + 1


def actualizar_performance(
    db: Session,
    id_empleado: int,
    id_tipo_evento: int,
    duracion_real_min: int
):
    """
    Actualiza el promedio de duración del empleado
    para ese tipo de evento usando media móvil.
    Se llama automáticamente al hacer checkout.
    """
    from datetime import datetime

    performance = db.query(PerformanceEmpleado).filter(
        PerformanceEmpleado.id_empleado    == id_empleado,
        PerformanceEmpleado.id_tipo_evento == id_tipo_evento
    ).first()

    if performance:
        total = performance.total_atenciones
        nuevo_promedio = (
            (performance.promedio_duracion_min * total) + duracion_real_min
        ) / (total + 1)
        performance.promedio_duracion_min = round(nuevo_promedio, 2)
        performance.total_atenciones      = total + 1
        performance.ultima_actualizacion  = datetime.utcnow()
    else:
        performance = PerformanceEmpleado(
            id_empleado           = id_empleado,
            id_tipo_evento        = id_tipo_evento,
            promedio_duracion_min = float(duracion_real_min),
            total_atenciones      = 1
        )
        db.add(performance)

    db.commit()
