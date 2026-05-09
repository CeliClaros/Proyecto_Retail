from src.queue_atencion.modelo import Reserva, EstadoReserva
from src.queue_atencion.rutas import base_datos_reservas, crear_reserva
from src.queue_atencion.logica import calcular_tiempo_espera

def test_crear_reserva():
    reserva_prueba = Reserva(
        id_usuario=1,
        id_servicio=1,
        fecha_hora="2026-05-09T10:30:00"
    )

    resultado = crear_reserva(reserva_prueba)
    assert resultado.estado == EstadoReserva.PENDIENTE
    assert resultado.id == 1

def test_calculo_tiempo():
    # Probamos la lógica de cálculo
    reservas_pendientes = [Reserva(id_usuario=1, id_servicio=1, fecha_hora="2026-05-09T10:00:00")]
    tiempo = calcular_tiempo_espera(reservas_pendientes, 12.5)
    assert tiempo == 12
