#FastAPI application & endpoints

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.extractor import extract_text_from_pdf
from app.ai_service import analyze_resume_and_draft_letter
from groq import RateLimitError

app = FastAPI(title="Resume Analyzer API")

# Config- CORS for future Angular Vercel domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # <- Vercel URL goes here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyze")
async def analyze_application(
file: UploadFile = File(...),
    job_description: str = Form(...),
    job_requirements: str = Form(...),           # <-- New required field
    additional_info: str = Form("")              # <-- New optional field
):
    try:
        # Read the file bytes asynchronously
        file_bytes = await file.read()
        
        # Extract text from the uploaded PDF
        resume_text = extract_text_from_pdf(file_bytes)
        
        # Pass all four variables to your AI service
        analysis_result = analyze_resume_and_draft_letter(
            resume_text=resume_text,
            job_description=job_description,
            job_requirements=job_requirements,   # <-- Passing to AI
            additional_info=additional_info      # <-- Passing to AI
        )
        
        return {"status": "success", "data": analysis_result}

    except RateLimitError:
        raise HTTPException(
            status_code=429,
            detail="Rate limit reached. Please wait a minute before analyzing another resume."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected internal server error occurred: {str(e)}"
        )