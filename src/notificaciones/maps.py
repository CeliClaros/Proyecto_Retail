import os
import requests

def calcular_tiempo_viaje(
    origen_lat: float,
    origen_lng: float,
    destino_lat: float,
    destino_lng: float
) -> dict:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin":      f"{origen_lat},{origen_lng}",
        "destination": f"{destino_lat},{destino_lng}",
        "mode":        "driving",
        "key":         api_key,
        "language":    "es"
    }
    try:
        response = requests.get(url, params=params)
        data = response.json()
        if data["status"] == "OK":
            leg = data["routes"][0]["legs"][0]
            duracion_min = round(leg["duration"]["value"] / 60)
            distancia_km = round(leg["distance"]["value"] / 1000, 1)
            return {
                "ok":              True,
                "duracion_min":    duracion_min,
                "distancia_km":    distancia_km,
                "duracion_texto":  leg["duration"]["text"],
                "distancia_texto": leg["distance"]["text"],
                "maps_url": f"https://www.google.com/maps/dir/?api=1&origin={origen_lat},{origen_lng}&destination={destino_lat},{destino_lng}"
            }
        else:
            # MOCK: API no disponible, devuelve datos simulados
            return _mock_viaje(origen_lat, origen_lng, destino_lat, destino_lng)
    except Exception as e:
        return _mock_viaje(origen_lat, origen_lng, destino_lat, destino_lng)


def _mock_viaje(origen_lat, origen_lng, destino_lat, destino_lng) -> dict:
    """
    Datos simulados cuando Google Maps API no está disponible.
    El link de Maps igual funciona y lleva al usuario a la ruta real.
    """
    return {
        "ok":              True,
        "duracion_min":    25,
        "distancia_km":    12.5,
        "duracion_texto":  "25 minutos (estimado)",
        "distancia_texto": "12.5 km (estimado)",
        "maps_url": f"https://www.google.com/maps/dir/?api=1&origin={origen_lat},{origen_lng}&destination={destino_lat},{destino_lng}"
    }


def calcular_cuando_avisar(
    tiempo_espera_cola_min: int,
    tiempo_viaje_min: int,
    margen_min: int = 5
) -> dict:
    tiempo_total_viaje = tiempo_viaje_min + margen_min
    if tiempo_espera_cola_min <= tiempo_total_viaje:
        return {
            "avisar_ahora":      True,
            "mensaje":           f"Sali ahora! Tu turno es en {tiempo_espera_cola_min} min y el viaje tarda {tiempo_viaje_min} min.",
            "minutos_para_salir": 0
        }
    else:
        minutos_para_avisar = tiempo_espera_cola_min - tiempo_total_viaje
        return {
            "avisar_ahora":      False,
            "mensaje":           f"Te avisamos en {minutos_para_avisar} min para que salgas a tiempo.",
            "minutos_para_salir": minutos_para_avisar
        }
