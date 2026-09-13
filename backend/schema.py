from pydantic import BaseModel, Field
from typing import List, Optional

class CandidateInfo(BaseModel):
    full_name: Optional[str] = ""
    title: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""
    linkedin: Optional[str] = ""

class CompanyInfo(BaseModel):
    company_name: Optional[str] = ""
    hiring_manager: Optional[str] = ""
    location: Optional[str] = ""

class ResumeAnalysis(BaseModel):
    matching_score: int
    matched_skills: List[str]
    lacking_skills: List[str]
    cover_letter: str
    candidate_info: Optional[CandidateInfo] = Field(default_factory=CandidateInfo)
    company_info: Optional[CompanyInfo] = Field(default_factory=CompanyInfo)