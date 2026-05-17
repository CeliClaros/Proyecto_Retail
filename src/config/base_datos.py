import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://usuario:clave@localhost:5432/retail_db"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def crear_tablas():
    from src.config.modelos_db import (
        Usuario, Empleado, TipoEvento,
        AsignacionDiaria, Reserva,
        HistorialAtencion, PerformanceEmpleado
    )
    Base.metadata.create_all(bind=engine)
