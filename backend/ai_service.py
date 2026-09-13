import os
import json
from dotenv import load_dotenv
from groq import Groq, RateLimitError, APIError
from backend.schema import ResumeAnalysis

load_dotenv()
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Update the function signature
def analyze_resume_and_draft_letter(
    resume_text: str,
    job_description: str,
    job_requirements: str,
    additional_info: str,
    language: str = "en"
) -> dict:
    
    system_prompt = """
    You are an expert technical recruiter and career coach.
    Analyze the provided Candidate Profile against the Job Opportunity.
    You MUST respond in valid JSON matching this exact structure:
    {
      "matching_score": integer between 0 and 100,
      "matched_skills": [array of strings],
      "lacking_skills": [array of strings],
      "cover_letter": "string containing a professional cover letter",
      "candidate_info": {
        "full_name": "candidate full name extracted from resume",
        "title": "professional title or target role",
        "email": "candidate email from resume if present",
        "phone": "candidate phone from resume if present",
        "location": "candidate location/city from resume if present",
        "linkedin": "candidate linkedin or website from resume if present"
      },
      "company_info": {
        "company_name": "name of hiring company from job description if present",
        "hiring_manager": "hiring manager or department name if present",
        "location": "company or role location from job description if present"
      }
    }
    """
    
    # Determine language instruction for cover letter
    if language and language.lower().startswith("fr"):
        language_instruction = (
            "3. The 'cover_letter' MUST be drafted entirely in French (Français) following formal French business "
            "letter standards (e.g. 'Madame, Monsieur,' and formal closing formulas)."
        )
    else:
        language_instruction = "3. The 'cover_letter' MUST be drafted in English following professional business standards."

    # Restructure the user prompt to include the new context areas
    user_prompt = f"""
    --- CANDIDATE PROFILE ---
    Extracted Resume Text:
    {resume_text}
    
    Candidate's Additional Context:
    {additional_info if additional_info else "None provided."}

    --- JOB OPPORTUNITY ---
    General Description:
    {job_description}
    
    Specific Requirements:
    {job_requirements}
    
    Instructions:
    1. Base the matching score and skills analysis heavily on the 'Specific Requirements'.
    2. Incorporate the 'Candidate's Additional Context' into the cover letter to strengthen their application.
    {language_instruction}
    4. Accurately extract the candidate's coordinates from their CV into 'candidate_info' (leave empty string if not found).
    5. Extract company name, hiring manager or department, and location from the job opportunity into 'company_info' (leave empty string if not found).
    """
    
    messages_payload = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=messages_payload,
            response_format={"type": "json_object"},
            temperature=0.2,
        )
    except RateLimitError:
        raise

    result_json = json.loads(response.choices[0].message.content)
    validated_data = ResumeAnalysis(**result_json)
    
    return validated_data.model_dump()
