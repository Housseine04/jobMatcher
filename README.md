# [JobMatcher](https://job-matcher-houss.vercel.app/)

JobMatcher is a full-stack recruitment application designed to analyze a candidate's resume against specific job descriptions and requirements. Utilizing advanced Large Language Models (LLMs), it provides real-time matching analytics, identifies skill gaps, and autonomously drafts highly tailored cover letters.

![Angular](https://img.shields.io/badge/Angular-v22-dd1b16?style=for-the-badge&logo=angular)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwindcss)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python)
![Groq](https://img.shields.io/badge/AI-Groq_Llama_4-f3f4f6?style=for-the-badge)

## Features

* **Intelligent PDF Extraction:** Securely parses uploaded PDF resumes for text extraction and embeds a native viewer in the UI.
* **Context-Aware Analysis:** Evaluates candidates based on their CV, the general job description, specific technical requirements, and any additional user-provided context.
* **Quantitative Scoring:** Generates a 0-100% matching score using Meta's `llama-4-scout-17b` model via the ultra-fast Groq API.
* **Skill Gap Identification:** Automatically categorizes "Strong Matches" and "Missing Requirements" for quick visual assessment.
* **Automated Cover Letters:** Drafts a professional, context-rich cover letter designed to bridge the gap between the user's experience and the employer's needs.
* **Graceful Degradation:** Built-in rate limit handling (HTTP 429) ensuring the frontend UI remains stable during high API traffic.

