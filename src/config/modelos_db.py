from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text, Numeric, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from src.config.base_datos import Base

class EstadoReservaEnum(str, enum.Enum):
    PENDIENTE  = "PENDIENTE"
    CONFIRMADA = "CONFIRMADA"
    EN_ESPERA  = "EN_ESPERA"
    EN_CURSO   = "EN_CURSO"
    ATENDIDA   = "ATENDIDA"
    CANCELADA  = "CANCELADA"

class CanalNotifEnum(str, enum.Enum):
    WHATSAPP = "whatsapp"
    EMAIL    = "email"
    SMS      = "sms"

class Usuario(Base):
    __tablename__ = "usuarios"
    id          = Column(Integer, primary_key=True, index=True)
    nombre      = Column(String(100), nullable=False)
    apellido    = Column(String(100), nullable=False)
    email       = Column(String(150), unique=True, nullable=False)
    telefono    = Column(String(20), nullable=True)
    activo      = Column(Boolean, default=True)
    fecha_alta  = Column(DateTime, default=datetime.utcnow)
    reservas    = relationship("Reserva", back_populates="usuario")

class Empleado(Base):
    __tablename__ = "empleados"
    id           = Column(Integer, primary_key=True, index=True)
    legajo       = Column(String(20), unique=True, nullable=False)
    nombre       = Column(String(100), nullable=False)
    apellido     = Column(String(100), nullable=False)
    email        = Column(String(150), unique=True, nullable=False)
    telefono     = Column(String(20), nullable=True)
    activo       = Column(Boolean, default=True)
    fecha_alta   = Column(DateTime, default=datetime.utcnow)
    asignaciones = relationship("AsignacionDiaria", back_populates="empleado")
    reservas     = relationship("Reserva", back_populates="empleado_asignado")
    historial    = relationship("HistorialAtencion", back_populates="empleado")
    performance  = relationship("PerformanceEmpleado", back_populates="empleado")

class TipoEvento(Base):
    __tablename__ = "tipo_eventos"
    id               = Column(Integer, primary_key=True, index=True)
    nombre           = Column(String(150), nullable=False)
    descripcion      = Column(Text, nullable=True)
    tiempo_base_min  = Column(Integer, nullable=False)
    requisitos       = Column(Text, nullable=True)
    activo           = Column(Boolean, default=True)
    fecha_alta       = Column(DateTime, default=datetime.utcnow)
    asignaciones     = relationship("AsignacionDiaria", back_populates="tipo_evento")
    reservas         = relationship("Reserva", back_populates="tipo_evento")
    historial        = relationship("HistorialAtencion", back_populates="tipo_evento")
    performance      = relationship("PerformanceEmpleado", back_populates="tipo_evento")

class AsignacionDiaria(Base):
    __tablename__ = "asignaciones_diarias"
    id             = Column(Integer, primary_key=True, index=True)
    id_empleado    = Column(Integer, ForeignKey("empleados.id"), nullable=False)
    id_tipo_evento = Column(Integer, ForeignKey("tipo_eventos.id"), nullable=False)
    fecha          = Column(DateTime, nullable=False)
    hora_inicio    = Column(String(5), nullable=False)
    hora_fin       = Column(String(5), nullable=False)
    activo         = Column(Boolean, default=True)
    empleado       = relationship("Empleado", back_populates="asignaciones")
    tipo_evento    = relationship("TipoEvento", back_populates="asignaciones")
    reservas       = relationship("Reserva", back_populates="asignacion")

class Reserva(Base):
    __tablename__ = "reservas"
    id                         = Column(Integer, primary_key=True, index=True)
    id_usuario                 = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    id_tipo_evento             = Column(Integer, ForeignKey("tipo_eventos.id"), nullable=False)
    id_empleado_asignado       = Column(Integer, ForeignKey("empleados.id"), nullable=True)
    id_asignacion              = Column(Integer, ForeignKey("asignaciones_diarias.id"), nullable=True)
    fecha_hora_reserva         = Column(DateTime, nullable=False)
    estado                     = Column(SAEnum(EstadoReservaEnum), default=EstadoReservaEnum.PENDIENTE)
    tiempo_espera_estimado_min = Column(Integer, default=0)
    posicion_en_cola           = Column(Integer, default=0)
    fecha_hora_checkin         = Column(DateTime, nullable=True)
    fecha_hora_checkout        = Column(DateTime, nullable=True)
    duracion_real_min          = Column(Integer, nullable=True)
    canal_notif                = Column(SAEnum(CanalNotifEnum), default=CanalNotifEnum.WHATSAPP)
    notificacion_enviada       = Column(Boolean, default=False)
    ubicacion_lat              = Column(Numeric(10, 8), nullable=True)
    ubicacion_lng              = Column(Numeric(11, 8), nullable=True)
    fecha_alta                 = Column(DateTime, default=datetime.utcnow)
    usuario                    = relationship("Usuario", back_populates="reservas")
    tipo_evento                = relationship("TipoEvento", back_populates="reservas")
    empleado_asignado          = relationship("Empleado", back_populates="reservas")
    asignacion                 = relationship("AsignacionDiaria", back_populates="reservas")
    historial                  = relationship("HistorialAtencion", back_populates="reserva")

class HistorialAtencion(Base):
    __tablename__ = "historial_atenciones"
    id                = Column(Integer, primary_key=True, index=True)
    id_reserva        = Column(Integer, ForeignKey("reservas.id"), nullable=False)
    id_empleado       = Column(Integer, ForeignKey("empleados.id"), nullable=False)
    id_tipo_evento    = Column(Integer, ForeignKey("tipo_eventos.id"), nullable=False)
    duracion_real_min = Column(Integer, nullable=False)
    fecha             = Column(DateTime, default=datetime.utcnow)
    notas             = Column(Text, nullable=True)
    reserva           = relationship("Reserva", back_populates="historial")
    empleado          = relationship("Empleado", back_populates="historial")
    tipo_evento       = relationship("TipoEvento", back_populates="historial")

class PerformanceEmpleado(Base):
    __tablename__ = "performance_empleados"
    id                    = Column(Integer, primary_key=True, index=True)
    id_empleado           = Column(Integer, ForeignKey("empleados.id"), nullable=False)
    id_tipo_evento        = Column(Integer, ForeignKey("tipo_eventos.id"), nullable=False)
    promedio_duracion_min = Column(Float, nullable=False, default=0.0)
    total_atenciones      = Column(Integer, default=0)
    ultima_actualizacion  = Column(DateTime, default=datetime.utcnow)
    empleado              = relationship("Empleado", back_populates="performance")
    tipo_evento           = relationship("TipoEvento", back_populates="performance")
