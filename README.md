# [JobMatcher](https://job-matcher-houss.vercel.app/)

JobMatcher is a modern, full-stack recruitment platform designed to evaluate a candidate's resume against specific job postings and requirements. Powered by Large Language Models (LLMs) via Groq API, it provides real-time compatibility scoring, identifies skill matches and gaps, and autonomously crafts tailored, professional cover letters.

![Angular](https://img.shields.io/badge/Angular-v22-dd1b16?style=for-the-badge&logo=angular)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwindcss)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

---

## Features

* **Intelligent Resume Parsing & Embedded Preview:** Securely parses uploaded PDF resumes for text extraction and displays an embedded, side-by-side native PDF preview.
* **Context-Aware Matching:** Analyzes the candidate's CV against the job description, specific requirements, and user-provided additional context.
* **Quantitative Match Scoring:** Computes an objective 0–100% compatibility score using Groq LLM inference (`gpt-oss-120b`).
* **Visual Skill Gap Analysis:** Breaks down competencies into **Strong Matches** (green) and **Missing Requirements** (red) for instant evaluation.
* **Bilingual Cover Letter Generation (English / Français):**
  * One-click language switch on the landing page.
  * Directs the AI service to draft cover letters complying with French business etiquette (*Madame, Monsieur*, formal salutations) or English corporate conventions.
  * Fully localized bilingual UI (inputs, labels, tooltips, badges, and alerts).
* **Multi-Format Export (.txt & Formal Letterhead .pdf):**
  * **Plain Text Mode (`.txt`):** Quick copy-to-clipboard or direct download for ATS and online application forms.
  * **Structured PDF Mode (`.pdf`):** Novoresume-inspired letterhead layout with editable candidate headers, contact coordinates, recipient info (*À l'attention de :*), and dynamic dates.
* **Zero-Dependency Client-Side PDF Engine:**
  * Generates pure PDF-1.4 files directly in TypeScript without external npm PDF dependencies.
  * Supports Adobe Type 1 fonts (Helvetica, Helvetica-Bold, Helvetica-Oblique) with `WinAnsiEncoding` for French accents (`é`, `è`, `à`, `ç`, `ô`, `î`, `œ`, etc.).
  * Exact font metrics (AFM) text-wrapping preserving custom line breaks and blank lines.
  * **Balanced Vertical Centering:** Mathematically splits blank page slack 50/50 above and below the body for consistent, professional page aesthetics.
* **Optimized Single-Screen UX:**
  * Fixed-height, no-scroll viewport design that fits any screen size seamlessly.
  * Independently scrollable panels for job inputs, CV preview, cover letter editor, and analysis results.
* **Resilient Architecture:** Built-in rate limit handling (HTTP 429) and CORS configuration ensuring stability under heavy usage.

---

## Tech Stack

* **Frontend:** Angular 19+ (Standalone Components, Signals, Reactive Forms), Tailwind CSS.
* **Backend:** FastAPI (Python 3.10+), Pydantic v2.
* **LLM Engine:** Groq API (`openai/gpt-oss-120b`).
* **PDF Processing:** `pypdf` (resume text extraction) & custom pure TypeScript PDF-1.4 writer (cover letter generation).

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

> Create a `.env` file in the `backend/` directory with your Groq API key:
> ```env
> GROQ_API_KEY=your_groq_api_key_here
> ```

### 2. Frontend Setup

```bash
cd angular-frontend
npm install
npm start  # Runs on http://localhost:4200
```
