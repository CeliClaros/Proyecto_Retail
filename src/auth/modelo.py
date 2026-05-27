from pydantic import BaseModel
from typing import Optional
from enum import Enum

class RolUsuario(str, Enum):
    CLIENTE    = "CLIENTE"
    OPERADOR   = "OPERADOR"
    ADMIN      = "ADMIN"
    SUPERVISOR = "SUPERVISOR"

class UsuarioCrear(BaseModel):
    nombre:   str
    apellido: str
    email:    str
    telefono: Optional[str] = None
    password: str
    rol:      RolUsuario = RolUsuario.CLIENTE

class UsuarioRespuesta(BaseModel):
    id:       int
    nombre:   str
    apellido: str
    email:    str
    telefono: Optional[str] = None
    rol:      str
    activo:   bool

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email:    str
    password: str

class TokenRespuesta(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    rol:          str
    nombre:       str
