from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_listar_tipo_eventos():
    response = client.get("/api/tipo-eventos/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_crear_tipo_evento():
    response = client.post("/api/tipo-eventos/", json={
        "nombre":          "Apertura de cuenta",
        "descripcion":     "Trámite para abrir cuenta bancaria",
        "tiempo_base_min": 15,
        "requisitos":      "DNI y comprobante de domicilio",
        "activo":          True
    })
    assert response.status_code == 201
    assert response.json()["nombre"] == "Apertura de cuenta"

def test_tipo_evento_no_existe():
    response = client.get("/api/tipo-eventos/9999")
    assert response.status_code == 404
