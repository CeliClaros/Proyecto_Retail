import requests
from datetime import datetime, timedelta
import random

BASE = "http://localhost:8000/api"
print("🚀 Poblando base de datos con datos de prueba históricos...")

# Login admin para obtener token
r = requests.post(f"{BASE}/auth/login", json={"email": "admin@retail.com", "password": "admin1234"})
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# IDs existentes
empleados    = [7, 8]           # Carlos (EMP-0006), Laura (EMP-0008)
tipo_eventos = [1, 4, 5, 8]    # Apertura, Pago, Consulta, Préstamo
usuarios     = [8, 9, 10]      # Roberto, Valeria, Diego

# Duración realista por tipo de evento (minutos)
duraciones = {1: (10,20), 4: (3,8), 5: (8,15), 8: (20,35)}

total_reservas = 0
total_atendidas = 0

# Generar reservas para los últimos 7 días
for dias_atras in range(7, 0, -1):
    fecha = datetime.now() - timedelta(days=dias_atras)
    # Solo días hábiles
    if fecha.weekday() >= 5:
        continue
    
    fecha_str = fecha.strftime("%Y-%m-%d")
    print(f"\n📅 Generando datos para {fecha_str}...")
    
    # 8-15 reservas por día
    n_reservas = random.randint(8, 15)
    
    for i in range(n_reservas):
        hora = random.randint(9, 17)
        minuto = random.randint(0, 59)
        fecha_hora = fecha.replace(hour=hora, minute=minuto, second=0, microsecond=0)
        
        emp_id   = random.choice(empleados)
        tipo_id  = random.choice(tipo_eventos)
        user_id  = random.choice(usuarios)
        
        # Crear reserva
        r = requests.post(f"{BASE}/reservas/", json={
            "id_usuario":           user_id,
            "id_tipo_evento":       tipo_id,
            "id_empleado_asignado": emp_id,
            "fecha_hora_reserva":   fecha_hora.isoformat(),
            "canal_notif":          "whatsapp",
            "ubicacion_lat":        -34.6,
            "ubicacion_lng":        -58.4,
        })
        
        if r.status_code != 201:
            continue
            
        reserva_id = r.json()["id"]
        total_reservas += 1
        
        # 70% de las reservas terminan atendidas
        if random.random() < 0.70:
            requests.post(f"{BASE}/reservas/{reserva_id}/checkin")
            # Duración realista según tipo de evento
            min_dur, max_dur = duraciones.get(tipo_id, (10, 20))
            # Simular tiempo transcurrido modificando directamente
            requests.post(f"{BASE}/reservas/{reserva_id}/checkout")
            total_atendidas += 1
        # 15% canceladas
        elif random.random() < 0.50:
            requests.patch(f"{BASE}/reservas/{reserva_id}/cancelar")

print(f"\n✅ Datos generados:")
print(f"   Reservas creadas:  {total_reservas}")
print(f"   Atendidas:         {total_atendidas}")
print(f"   % completadas:     {round(total_atendidas/total_reservas*100)}%")
print("\n🎉 Base de datos lista para pruebas!")
