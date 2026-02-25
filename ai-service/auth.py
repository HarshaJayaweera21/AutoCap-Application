import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional
from typing import Optional

security = HTTPBearer(auto_error=False)

# Assuming Supabase JWT secret
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "your-supabase-jwt-secret-here")
JWT_ALGORITHM = "HS256"

async def get_current_user_optional(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[int]:
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], options={"verify_aud": False})
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return int(user_id)
    except JWTError:
        return None
    except ValueError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = await get_current_user_optional(credentials)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    # Requires an admin claim in the JWT, or a specific user table check
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], options={"verify_aud": False})
        user_id = payload.get("sub")
        # Ensure user is admin (example condition)
        is_admin = payload.get("is_admin", False) or payload.get("role") == "admin"
        if not user_id or not is_admin:
            raise HTTPException(status_code=403, detail="Not enough privileges")
        return int(user_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
