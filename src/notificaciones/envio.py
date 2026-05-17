from fastapi import APIRouter
import os

rutas_notificaciones = APIRouter()

def enviar_whatsapp(telefono: str, mensaje: str) -> bool:
    try:
        from twilio.rest import Client
        client = Client(
            os.getenv("TWILIO_ACCOUNT_SID"),
            os.getenv("TWILIO_AUTH_TOKEN")
        )
        client.messages.create(
            from_=os.getenv("TWILIO_WHATSAPP_FROM"),
            body=mensaje,
            to=f"whatsapp:{telefono}"
        )
        return True
    except Exception as e:
        print(f"[WHATSAPP] Error: {e}")
        return False

def enviar_confirmacion_reserva(telefono: str, nombre: str, fecha: str, servicio: str, tiempo_espera: int):
    mensaje = (
        f"Hola {nombre}! Tu reserva fue confirmada.\n"
        f"Servicio: {servicio}\n"
        f"Fecha: {fecha}\n"
        f"Tiempo de espera estimado: {tiempo_espera} minutos.\n"
        f"Te avisaremos cuando sea tu turno!"
    )
    return enviar_whatsapp(telefono, mensaje)

def enviar_turno_proximo(telefono: str, nombre: str, minutos_restantes: int):
    mensaje = (
        f"Hola {nombre}! Tu turno esta proximo.\n"
        f"Tiempo estimado: {minutos_restantes} minutos.\n"
        f"Por favor dirigite al local."
    )
    return enviar_whatsapp(telefono, mensaje)

def enviar_ruta(telefono: str, nombre: str, lat: float, lng: float):
    maps_url = f"https://www.google.com/maps/dir/?api=1&destination={lat},{lng}"
    mensaje = (
        f"Hola {nombre}! Aqui esta la ruta al local:\n"
        f"{maps_url}\n"
        f"Te esperamos!"
    )
    return enviar_whatsapp(telefono, mensaje)

@rutas_notificaciones.post("/test")
def test_notificacion():
    return {"mensaje": "Servicio de notificaciones activo"}
