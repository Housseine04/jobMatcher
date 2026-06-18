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
    job_description: str = Form(...) # Form data allows mixing text and files
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    try:
        # 1. Extract Text
        file_bytes = await file.read()
        resume_text = extract_text_from_pdf(file_bytes)
        
        if not resume_text:
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")

        # 2. Send to AI
        analysis_result = analyze_resume_and_draft_letter(resume_text, job_description)
        
        return {
            "status": "success",
            "data": analysis_result
        }
    except RateLimitError:
        raise HTTPException(
            status_code=429,
            detail="Rate limit reached. Please wait a minute before analyzing another resume."
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))