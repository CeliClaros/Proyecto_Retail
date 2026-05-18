from sqlalchemy.orm import Session
from datetime import datetime, date
from src.config.modelos_db import AsignacionDiaria, PerformanceEmpleado, Empleado

def obtener_asignacion_activa(
    db: Session,
    id_tipo_evento: int,
    fecha: date = None,
    hora: str = None
) -> AsignacionDiaria:
    """
    Devuelve la asignación activa para un tipo de evento
    en una fecha y hora dadas. Si no se pasan, usa ahora.
    """
    if not fecha:
        fecha = datetime.now().date()
    if not hora:
        hora = datetime.now().strftime("%H:%M")

    asignaciones = db.query(AsignacionDiaria).filter(
        AsignacionDiaria.id_tipo_evento == id_tipo_evento,
        AsignacionDiaria.activo == True,
        AsignacionDiaria.fecha >= datetime.combine(fecha, datetime.min.time()),
        AsignacionDiaria.fecha <  datetime.combine(fecha, datetime.max.time()),
    ).all()

    for asig in asignaciones:
        if asig.hora_inicio <= hora <= asig.hora_fin:
            return asig
    return None


def obtener_ranking_empleados(
    db: Session,
    id_tipo_evento: int
) -> list:
    """
    Devuelve el ranking de empleados para un tipo de evento
    ordenado por menor promedio de duración (más eficiente primero).
    """
    performances = db.query(PerformanceEmpleado).filter(
        PerformanceEmpleado.id_tipo_evento == id_tipo_evento,
        PerformanceEmpleado.total_atenciones > 0
    ).order_by(PerformanceEmpleado.promedio_duracion_min).all()

    ranking = []
    for i, perf in enumerate(performances):
        empleado = db.query(Empleado).filter(
            Empleado.id == perf.id_empleado
        ).first()
        ranking.append({
            "posicion":             i + 1,
            "id_empleado":          perf.id_empleado,
            "nombre":               f"{empleado.nombre} {empleado.apellido}",
            "legajo":               empleado.legajo,
            "promedio_min":         perf.promedio_duracion_min,
            "total_atenciones":     perf.total_atenciones,
        })
    return ranking


def sugerir_rotacion(
    db: Session,
    id_tipo_evento: int,
    id_empleado_actual: int
) -> dict:
    """
    Sugiere el mejor empleado disponible para rotar
    basándose en el ranking de performance.
    """
    ranking = obtener_ranking_empleados(db, id_tipo_evento)
    if not ranking:
        return {"sugerencia": "Sin datos suficientes para sugerir rotación"}

    mejor = ranking[0]
    if mejor["id_empleado"] == id_empleado_actual:
        if len(ranking) > 1:
            mejor = ranking[1]
        else:
            return {"sugerencia": "El empleado actual es el mejor para este trámite"}

    return {
        "sugerencia":       f"Rotar a {mejor['nombre']} (Legajo: {mejor['legajo']})",
        "id_empleado":      mejor["id_empleado"],
        "promedio_min":     mejor["promedio_min"],
        "total_atenciones": mejor["total_atenciones"],
    }
