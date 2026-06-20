from pydantic import BaseModel
from typing import List

class ResumeAnalysis(BaseModel):
    matching_score: int
    matched_skills: List[str]
    lacking_skills: List[str]
    cover_letter: str