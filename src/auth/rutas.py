from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.config.base_datos import get_db
from src.config.modelos_db import Usuario, RolEnum
from src.auth.modelo import UsuarioCrear, UsuarioRespuesta, LoginRequest, TokenRespuesta
from src.auth.seguridad import hashear_password, verificar_password, crear_token
from typing import List

rutas_auth = APIRouter()

@rutas_auth.post("/registro", response_model=UsuarioRespuesta, status_code=201)
def registrar_usuario(datos: UsuarioCrear, db: Session = Depends(get_db)):
    existe = db.query(Usuario).filter(Usuario.email == datos.email).first()
    if existe:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    usuario = Usuario(
        nombre   = datos.nombre,
        apellido = datos.apellido,
        email    = datos.email,
        telefono = datos.telefono,
        password = hashear_password(datos.password),
        rol      = datos.rol
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario

@rutas_auth.post("/login", response_model=TokenRespuesta)
def login(datos: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == datos.email).first()
    if not usuario or not verificar_password(datos.password, usuario.password):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    token = crear_token({"sub": usuario.email, "rol": usuario.rol, "id": usuario.id})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "rol":          usuario.rol,
        "nombre":       usuario.nombre
    }

@rutas_auth.get("/usuarios", response_model=List[UsuarioRespuesta])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).filter(Usuario.activo == True).all()
