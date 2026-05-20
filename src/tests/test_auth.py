from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_registro_usuario():
    response = client.post("/api/auth/registro", json={
        "nombre":   "Test",
        "apellido": "Usuario",
        "email":    "test.auth@retail.com",
        "password": "test1234",
        "rol":      "cliente"
    })
    assert response.status_code in [201, 400]

def test_login_correcto():
    response = client.post("/api/auth/login", json={
        "email":    "admin@retail.com",
        "password": "admin1234"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["rol"] == "admin"

def test_login_incorrecto():
    response = client.post("/api/auth/login", json={
        "email":    "admin@retail.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
