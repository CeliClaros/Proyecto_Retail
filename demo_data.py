import requests
from datetime import datetime, timedelta
import random

BASE = "http://localhost:8000/api"

print("🚀 Cargando datos demo...")

# Tipo de eventos
eventos = [
    {"nombre": "Apertura de cuenta", "descripcion": "Apertura cuenta bancaria", "tiempo_base_min": 15, "requisitos": "DNI", "activo": True},
    {"nombre": "Pago de factura", "descripcion": "Pago servicios", "tiempo_base_min": 5, "requisitos": "Factura", "activo": True},
    {"nombre": "Prestamo personal", "descripcion": "Solicitud prestamo", "tiempo_base_min": 25, "requisitos": "Recibo sueldo", "activo": True},
]
evento_ids = []
for e in eventos:
    r = requests.post(f"{BASE}/tipo-eventos/", json=e)
    if r.status_code == 201:
        evento_ids.append(r.json()["id"])
        print(f"  ✅ Tipo evento: {e['nombre']}")

# Empleados operadores
operadores = [
    {"nombre": "Carlos", "apellido": "Benitez", "email": "carlos.op@retail.com", "password": "op1234", "rol": "OPERADOR"},
    {"nombre": "Laura", "apellido": "Soria", "email": "laura.op@retail.com", "password": "op1234", "rol": "OPERADOR"},
]
for o in operadores:
    r = requests.post(f"{BASE}/auth/registro", json=o)
    if r.status_code == 201:
        print(f"  ✅ Operador: {o['nombre']}")

# Empleados en tabla empleados
emp_data = [
    {"nombre": "Carlos", "apellido": "Benitez", "email": "carlos.emp@retail.com", "activo": True},
    {"nombre": "Laura", "apellido": "Soria", "email": "laura.emp@retail.com", "activo": True},
]
emp_ids = []
for e in emp_data:
    r = requests.post(f"{BASE}/empleados/", json=e)
    if r.status_code == 201:
        emp_ids.append(r.json()["id"])
        print(f"  ✅ Empleado: {e['nombre']} - {r.json()['legajo']}")

# Clientes
clientes = [
    {"nombre": "Roberto", "apellido": "Fernandez", "email": "roberto@cliente.com", "password": "cli1234", "rol": "CLIENTE"},
    {"nombre": "Valeria", "apellido": "Torres", "email": "valeria@cliente.com", "password": "cli1234", "rol": "CLIENTE"},
    {"nombre": "Diego", "apellido": "Ruiz", "email": "diego@cliente.com", "password": "cli1234", "rol": "CLIENTE"},
]
user_ids = []
for c in clientes:
    r = requests.post(f"{BASE}/auth/registro", json=c)
    if r.status_code == 201:
        user_ids.append(r.json()["id"])
        print(f"  ✅ Cliente: {c['nombre']}")

# Reservas con distintos estados
estados_demo = ["PENDIENTE", "PENDIENTE", "CONFIRMADA", "EN_ESPERA", "ATENDIDA", "ATENDIDA", "CANCELADA"]
if user_ids and emp_ids and evento_ids:
    for i, estado in enumerate(estados_demo):
        fecha = (datetime.now() + timedelta(hours=i-2)).isoformat()
        r = requests.post(f"{BASE}/reservas/", json={
            "id_usuario":           random.choice(user_ids),
            "id_tipo_evento":       random.choice(evento_ids),
            "id_empleado_asignado": random.choice(emp_ids),
            "fecha_hora_reserva":   fecha,
            "canal_notif":          "whatsapp"
        })
        if r.status_code == 201:
            reserva_id = r.json()["id"]
            print(f"  ✅ Reserva #{reserva_id}")
            if estado in ["ATENDIDA"]:
                requests.post(f"{BASE}/reservas/{reserva_id}/checkin")
                requests.post(f"{BASE}/reservas/{reserva_id}/checkout")
            elif estado == "CANCELADA":
                requests.patch(f"{BASE}/reservas/{reserva_id}/cancelar")

print("\n✅ Demo lista!")
print("\nUsuarios para la demo:")
print("  Admin:      admin@retail.com / admin1234")
print("  Supervisor: supervisor@retail.com / super1234")
print("  Operador:   carlos.op@retail.com / op1234")
print("  Cliente:    roberto@cliente.com / cli1234")
