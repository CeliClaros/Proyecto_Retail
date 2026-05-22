from fastapi import APIRouter
from twilio.rest import Client
from src.notificaciones.maps import calcular_tiempo_viaje, calcular_cuando_avisar
import os

rutas_notificaciones = APIRouter()

def get_twilio_client():
    return Client(
        os.getenv("TWILIO_ACCOUNT_SID"),
        os.getenv("TWILIO_AUTH_TOKEN")
    )

def enviar_whatsapp(telefono: str, mensaje: str) -> bool:
    try:
        client = get_twilio_client()
        client.messages.create(
            from_=os.getenv("TWILIO_WHATSAPP_FROM"),
            body=mensaje,
            to=f"whatsapp:{telefono}"
        )
        print(f"[WHATSAPP] Enviado a {telefono}")
        return True
    except Exception as e:
        print(f"[WHATSAPP] Error: {e}")
        return False

def enviar_confirmacion_con_ruta(
    telefono: str,
    nombre: str,
    servicio: str,
    tiempo_espera_min: int,
    posicion_cola: int,
    usuario_lat: float,
    usuario_lng: float,
    local_lat: float,
    local_lng: float
) -> bool:
    """
    Notificación completa al confirmar reserva:
    - Tiempo de espera en cola
    - Ruta al local
    - Cuándo salir de casa
    """
    viaje = calcular_tiempo_viaje(usuario_lat, usuario_lng, local_lat, local_lng)
    
    if viaje["ok"]:
        aviso = calcular_cuando_avisar(tiempo_espera_min, viaje["duracion_min"])
        mensaje = (
            f"Hola {nombre}! Tu reserva esta confirmada.\n\n"
            f"Servicio: {servicio}\n"
            f"Posicion en fila: #{posicion_cola}\n"
            f"Tiempo de espera estimado: {tiempo_espera_min} minutos\n\n"
            f"Ruta al local ({viaje['distancia_texto']} - {viaje['duracion_texto']}):\n"
            f"{viaje['maps_url']}\n\n"
            f"Consejo: {aviso['mensaje']}"
        )
    else:
        mensaje = (
            f"Hola {nombre}! Tu reserva esta confirmada.\n"
            f"Servicio: {servicio}\n"
            f"Posicion en fila: #{posicion_cola}\n"
            f"Tiempo de espera estimado: {tiempo_espera_min} minutos.\n"
            f"Te avisaremos cuando sea tu turno!"
        )
    return enviar_whatsapp(telefono, mensaje)

def enviar_aviso_turno_proximo(
    telefono: str,
    nombre: str,
    tiempo_espera_min: int,
    usuario_lat: float,
    usuario_lng: float,
    local_lat: float,
    local_lng: float
) -> bool:
    """
    Aviso inteligente: calcula si el usuario debe salir ahora
    según su ubicación actual y el tiempo de espera restante.
    """
    viaje = calcular_tiempo_viaje(usuario_lat, usuario_lng, local_lat, local_lng)
    
    if viaje["ok"]:
        aviso = calcular_cuando_avisar(tiempo_espera_min, viaje["duracion_min"])
        mensaje = (
            f"Hola {nombre}! Actualizacion de tu turno.\n\n"
            f"Tiempo de espera restante: {tiempo_espera_min} minutos\n"
            f"Tiempo de viaje al local: {viaje['duracion_texto']}\n\n"
            f"{aviso['mensaje']}\n\n"
            f"Ruta al local:\n{viaje['maps_url']}"
        )
    else:
        mensaje = (
            f"Hola {nombre}! Tu turno se acerca.\n"
            f"Tiempo restante estimado: {tiempo_espera_min} minutos.\n"
            f"Por favor dirigite al local."
        )
    return enviar_whatsapp(telefono, mensaje)

@rutas_notificaciones.post("/test")
def test_notificacion():
    return {"mensaje": "Servicio de notificaciones activo"}

@rutas_notificaciones.post("/enviar-test-whatsapp")
def test_whatsapp_real(telefono: str, nombre: str):
    resultado = enviar_whatsapp(
        telefono,
        f"Hola {nombre}! Mensaje de prueba del sistema RetailQueue. Todo funciona!"
    )
    return {"enviado": resultado, "telefono": telefono}

@rutas_notificaciones.post("/test-ruta-completa")
def test_ruta_completa(
    telefono: str,
    nombre: str,
    usuario_lat: float,
    usuario_lng: float,
    local_lat: float,
    local_lng: float,
    tiempo_espera_min: int = 20
):
    """
    Prueba completa: calcula ruta y envía WhatsApp con toda la info.
    """
    resultado = enviar_confirmacion_con_ruta(
        telefono=telefono,
        nombre=nombre,
        servicio="Prueba de servicio",
        tiempo_espera_min=tiempo_espera_min,
        posicion_cola=3,
        usuario_lat=usuario_lat,
        usuario_lng=usuario_lng,
        local_lat=local_lat,
        local_lng=local_lng
    )
    return {"enviado": resultado}
