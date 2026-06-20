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
    additional_info: str
) -> dict:
    
    system_prompt = """
    You are an expert technical recruiter and career coach.
    Analyze the provided Candidate Profile against the Job Opportunity.
    You MUST respond in valid JSON matching this exact structure:
    {
      "matching_score": integer between 0 and 100,
      "matched_skills": [array of strings],
      "lacking_skills": [array of strings],
      "cover_letter": "string containing a professional cover letter"
    }
    """
    
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
    """
    
    messages_payload = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=messages_payload,
            response_format={"type": "json_object"},
            temperature=0.2,
        )
    except RateLimitError:
        raise

    result_json = json.loads(response.choices[0].message.content)
    validated_data = ResumeAnalysis(**result_json)
    
    return validated_data.model_dump()
