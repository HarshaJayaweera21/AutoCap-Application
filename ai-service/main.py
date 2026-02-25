from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import feedback, admin_feedback

app = FastAPI(title="AutoCap AI Service with Feedback Module")

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(feedback.router)
app.include_router(admin_feedback.router)

@app.get("/")
def read_root():
    return {"message": "FastAPI is working!"}

@app.get("/hello/{name}")
def say_hello(name: str):
    return {"message": f"Hello, {name}!"}

