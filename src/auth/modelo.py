from enum import Enum

from pydantic import BaseModel


class RolUsuario(str, Enum):
    CLIENTE    = "CLIENTE"
    OPERADOR   = "OPERADOR"
    ADMIN      = "ADMIN"
    SUPERVISOR = "SUPERVISOR"

class UsuarioCrear(BaseModel):
    nombre:   str
    apellido: str
    email:    str
    telefono: str | None = None
    password: str
    rol:      RolUsuario = RolUsuario.CLIENTE

class UsuarioRespuesta(BaseModel):
    id:       int
    nombre:   str
    apellido: str
    email:    str
    telefono: str | None = None
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
