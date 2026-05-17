from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.config.base_datos import get_db
from src.config.modelos_db import TipoEvento
from src.servicios.modelo import TipoEventoCrear, TipoEventoRespuesta
from typing import List

rutas_servicios = APIRouter()

@rutas_servicios.get("/", response_model=List[TipoEventoRespuesta])
def listar_tipo_eventos(db: Session = Depends(get_db)):
    return db.query(TipoEvento).filter(TipoEvento.activo == True).all()

@rutas_servicios.post("/", response_model=TipoEventoRespuesta, status_code=201)
def crear_tipo_evento(evento: TipoEventoCrear, db: Session = Depends(get_db)):
    db_evento = TipoEvento(**evento.model_dump())
    db.add(db_evento)
    db.commit()
    db.refresh(db_evento)
    return db_evento

@rutas_servicios.get("/{evento_id}", response_model=TipoEventoRespuesta)
def obtener_tipo_evento(evento_id: int, db: Session = Depends(get_db)):
    evento = db.query(TipoEvento).filter(TipoEvento.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Tipo de evento no encontrado")
    return evento

@rutas_servicios.put("/{evento_id}", response_model=TipoEventoRespuesta)
def actualizar_tipo_evento(evento_id: int, datos: TipoEventoCrear, db: Session = Depends(get_db)):
    evento = db.query(TipoEvento).filter(TipoEvento.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Tipo de evento no encontrado")
    for key, value in datos.model_dump().items():
        setattr(evento, key, value)
    db.commit()
    db.refresh(evento)
    return evento

@rutas_servicios.delete("/{evento_id}")
def eliminar_tipo_evento(evento_id: int, db: Session = Depends(get_db)):
    evento = db.query(TipoEvento).filter(TipoEvento.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Tipo de evento no encontrado")
    evento.activo = False
    db.commit()
    return {"mensaje": "Tipo de evento desactivado correctamente"}
