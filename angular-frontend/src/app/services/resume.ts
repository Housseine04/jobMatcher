import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

//interface defined based on Python backend's output schema
export interface AnalysisResponse {
    status: string;
    data: {
        matching_score: number;
        matched_skills: string[];
        lacking_skills: string[];
        cover_letter: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class ResumeService {
    private http = inject(HttpClient);

    private apiUrl = 'https://jobmatcher-production-942d.up.railway.app/api/analyze'; // << Future Python backend URL goes here

    analyzeResume(
        file: File,
        jobDescription: string,
        jobRequirements: string,
        additionalInfo: string
    ): Observable<AnalysisResponse> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('job_description', jobDescription);
        formData.append('job_requirements', jobRequirements);
        formData.append('additional_info', additionalInfo);

        return this.http.post<AnalysisResponse>(this.apiUrl, formData);
    }
}