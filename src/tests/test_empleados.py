import time
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_listar_empleados():
    response = client.get("/api/empleados/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_crear_empleado():
    email_unico = f"juan.test.{int(time.time())}@retail.com"
    response = client.post("/api/empleados/", json={
        "nombre":   "Juan",
        "apellido": "Pérez",
        "email":    email_unico,
        "telefono": "+5491133334444",
        "activo":   True
    })
    assert response.status_code == 201
    assert response.json()["nombre"] == "Juan"
    assert "legajo" in response.json()

def test_obtener_empleado():
    response = client.get("/api/empleados/1")
    assert response.status_code == 200

def test_empleado_no_existe():
    response = client.get("/api/empleados/9999")
    assert response.status_code == 404
