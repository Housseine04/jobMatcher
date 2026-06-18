import os
import json
from groq import Groq,RateLimitError
from dotenv import load_dotenv
from app.schema import ResumeAnalysis

#Load .env variables
load_dotenv()

#Init the Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def analyze_resume_and_draft_letter(resume_text: str, job_description: str) -> dict:
    system_prompt = """
    You are an expert technical recruiter and career coach.
    Analyze the provided Resume against the Job Description.
    You MUST respond in valid JSON matching this exact structure:
    {
      "matching_score": integer between 0 and 100,
      "matched_skills": [array of strings],
      "lacking_skills": [array of strings],
      "cover_letter": "string containing a professional cover letter"
    }
    """
    
    user_prompt = f"Resume:\n{resume_text}\n\nJob Description:\n{job_description}"
    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}, #force Groq to return JSON
            temperature=0.2, #deterministic and analytical
        )
    except RateLimitError:
        raise

    #parsing response string
    result_json = json.loads(response.choices[0].message.content)
    
    #validation through pydantic schema
    validated_data = ResumeAnalysis(**result_json)
    
    return validated_data.model_dump()