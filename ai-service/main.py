from dotenv import load_dotenv

# Load environment variables (like HF_TOKEN) before any services are initialized
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from services.caption_service import caption_service
import requests
import os

app = FastAPI()

class ImageDto(BaseModel):
    id: int
    storageUrl: str  # Supabase public URL for the image

class JobRequest(BaseModel):
    jobId: int
    userId: int
    datasetName: str
    datasetDescription: Optional[str] = ""
    modelVariant: str
    temperature: float = 1.0
    maxLength: int = 50
    minLength: int = 5
    numBeams: int = 4
    repetitionPenalty: float = 1.0
    topP: float = 0.9
    images: List[ImageDto]

@app.get("/")
def read_root():
    return {"message": "FastAPI is working!"}

@app.get("/hello/{name}")
def say_hello(name: str):
    return {"message": f"Hello, {name}!"}

@app.post("/api/captions/generate")
async def generate_caption_api(
    file: UploadFile = File(...),
    modelVariant: str = Form("caption_model"),
    temperature: float = Form(1.0),
    maxLength: int = Form(50),
    minLength: int = Form(5),
    numBeams: int = Form(4),
    repetitionPenalty: float = Form(1.0),
    topP: float = Form(0.9)
):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")
    
    contents = await file.read()
    
    try:
        kwargs = {
            "temperature": temperature,
            "max_length": maxLength,
            "min_length": minLength,
            "num_beams": numBeams,
            "repetition_penalty": repetitionPenalty,
            "top_p": topP
        }
        caption, similarity_score = caption_service.get_caption(contents, modelVariant, **kwargs)
        return {"caption": caption, "similarityScore": similarity_score}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def process_job_background(job_request: JobRequest):
    results = []
    error_message = None
    
    try:
        for image in job_request.images:
            print(f"Downloading image from Supabase Storage: {image.storageUrl}")

            # Download the image from Supabase Storage
            response = requests.get(image.storageUrl, timeout=30)
            if response.status_code != 200:
                print(f"Failed to download image {image.id} from {image.storageUrl} "
                      f"(HTTP {response.status_code})")
                continue

            kwargs = {
                "temperature": job_request.temperature,
                "max_length": job_request.maxLength,
                "min_length": job_request.minLength,
                "num_beams": job_request.numBeams,
                "repetition_penalty": job_request.repetitionPenalty,
                "top_p": job_request.topP
            }
            contents = response.content
            caption_text, similarity_score = caption_service.get_caption(contents, job_request.modelVariant, **kwargs)
            
            # Match FastApiCallbackDto.CaptionResultDto
            results.append({
                "imageId": image.id,
                "captionText": caption_text,
                "similarityScore": similarity_score,
                "bleu1": None,
                "bleu2": None,
                "bleu3": None,
                "bleu4": None,
                "meteor": None,
                "cider": None,
                "modelName": job_request.modelVariant,
                "modelVersion": "1.0"
            })
    except Exception as e:
        error_message = str(e)
        print(f"Error processing job {job_request.jobId}: {e}")
        
    # POST callback to Spring Boot
    callback_url = f"http://127.0.0.1:8080/api/jobs/{job_request.jobId}/callback"
    
    payload = {
        "jobId": job_request.jobId,
        "status": "FAILED" if error_message else "SUCCESS",
        "results": results,
        "errorMessage": error_message
    }
    
    try:
        print(f"Sending callback to {callback_url}")
        response = requests.post(callback_url, json=payload)
        response.raise_for_status()
        print(f"Callback successful for job {job_request.jobId}")
    except Exception as e:
        print(f"Failed to send callback for job {job_request.jobId}: {e}")

@app.post("/api/jobs/process")
async def process_job_api(job_request: JobRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(process_job_background, job_request)
    return {"message": f"Job {job_request.jobId} accepted for processing."}
