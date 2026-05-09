from src.servicios.modelo import Servicio
from src.servicios.rutas import base_datos_servicios, crear_servicio, listar_servicios

def test_crear_servicio():
    servicio_prueba = Servicio(
        nombre="Atención al Cliente",
        descripcion="Consulta y reclamos",
        tiempo_estimado_base=15,
        requisitos="DNI"
    )

    resultado = crear_servicio(servicio_prueba)
    assert resultado.nombre == "Atención al Cliente"
    assert resultado.id == 1
    assert len(base_datos_servicios) == 1

def test_listar_servicios():
    lista = listar_servicios()
    assert isinstance(lista, list)
