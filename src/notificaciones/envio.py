def enviar_aviso_reserva(medio: str, destinatario: str, mensaje: str):
    # Lógica base para correo o WhatsApp
    print(f"[{medio.upper()}] Enviado a {destinatario}: {mensaje}")
    return True
