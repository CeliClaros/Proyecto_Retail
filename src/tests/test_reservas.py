from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_listar_reservas():
    response = client.get("/api/reservas/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_reserva_no_existe():
    response = client.get("/api/reservas/9999")
    assert response.status_code == 404
