from src.empleados.modelo import Empleado
from src.empleados.rutas import base_datos_empleados, crear_empleado, listar_empleados

def test_crear_empleado():
    # Datos de prueba
    empleado_prueba = Empleado(
        nombre="María",
        apellido="Gómez",
        servicios_habilitados=[1, 2],
        horario_inicio="08:00:00",
        horario_fin="16:00:00"
    )

    # Ejecutar función
    resultado = crear_empleado(empleado_prueba)

    # Verificar que se creó bien
    assert resultado.nombre == "María"
    assert resultado.id == 1
    assert len(base_datos_empleados) == 1

def test_listar_empleados():
    # Verificar que devuelve lista
    lista = listar_empleados()
    assert isinstance(lista, list)
    assert len(lista) > 0
