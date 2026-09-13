import { Component, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ResumeService, AnalysisResponse } from './services/resume';
import { NgClass } from '@angular/common';
import { exportAsTxt, exportStructuredPdf } from './utils/document-export';

type UIState = 'INPUT' | 'LOADING' | 'RESULTS';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './app.html'
})
export class AppComponent {
  private resumeService = inject(ResumeService);
  private sanitizer = inject(DomSanitizer);

  // UI State
  uiState = signal<UIState>('INPUT');
  pdfUrl = signal<SafeResourceUrl | null>(null);

  // Form Data
  selectedFile = signal<File | null>(null);
  jobDescription = signal('');
  jobRequirements = signal('');
  additionalInfo = signal('');
  selectedLanguage = signal<'en' | 'fr'>('en');

  // Results Data
  analysisResult = signal<AnalysisResponse['data'] | null>(null);
  coverLetter = signal('');
  copied = signal(false);

  // Mode switch: Plain text (.txt) vs Formal Template (.pdf)
  exportMode = signal<'txt' | 'pdf'>('txt');

  // Template Form Fields (Auto-filled & Editable)
  candidateName = signal('');
  candidateTitle = signal('');
  candidateEmail = signal('');
  candidatePhone = signal('');
  candidateLocation = signal('');
  candidateLinkedin = signal('');

  companyName = signal('');
  companyManager = signal('');
  companyLocation = signal('');
  letterDate = signal('');

  // Toggle Language between English and French
  toggleLanguage() {
    this.selectedLanguage.update((lang) => (lang === 'en' ? 'fr' : 'en'));
  }

  // Set export mode: .txt or .pdf template
  setExportMode(mode: 'txt' | 'pdf') {
    this.exportMode.set(mode);
  }

  // Handle File Selection
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile.set(file);
      const objectUrl = URL.createObjectURL(file);
      this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl));
    } else {
      alert(this.selectedLanguage() === 'fr' ? 'Veuillez importer un fichier PDF valide.' : 'Please upload a valid PDF file.');
    }
  }

  // Clear selected file
  clearFile() {
    this.selectedFile.set(null);
    this.pdfUrl.set(null);
  }

  // Trigger the Analysis
  analyze() {
    const file = this.selectedFile();
    if (!file || !this.jobDescription() || !this.jobRequirements()) {
      alert(
        this.selectedLanguage() === 'fr'
          ? 'Veuillez fournir le CV au format PDF, la description du poste et les exigences.'
          : 'Please provide the PDF, Job Description, and Requirements.'
      );
      return;
    }

    this.uiState.set('LOADING');

    this.resumeService.analyzeResume(
      file,
      this.jobDescription(),
      this.jobRequirements(),
      this.additionalInfo(),
      this.selectedLanguage()
    ).subscribe({
      next: (response) => {
        this.analysisResult.set(response.data);
        const letter = response.data?.cover_letter || '';
        this.coverLetter.set(letter);
        this.populateTemplateCoordinates(response.data, letter);
        this.uiState.set('RESULTS');
      },
      error: (err) => {
        console.error(err);
        alert(
          this.selectedLanguage() === 'fr'
            ? 'Une erreur est survenue lors de l\'analyse. Vérifiez la console.'
            : 'An error occurred during analysis. Check the console.'
        );
        this.uiState.set('INPUT');
      }
    });
  }

  // Populate template coordinates from backend data + intelligent fallbacks
  private populateTemplateCoordinates(data: AnalysisResponse['data'] | undefined, letterText: string) {
    const cand = data?.candidate_info;
    const comp = data?.company_info;

    // Date
    const today = new Date().toLocaleDateString(
      this.selectedLanguage() === 'fr' ? 'fr-FR' : 'en-US',
      { day: 'numeric', month: 'long', year: 'numeric' }
    );
    this.letterDate.set(today);

    // Candidate details
    let name = cand?.full_name || '';
    let title = cand?.title || '';
    let email = cand?.email || '';
    let phone = cand?.phone || '';
    let location = cand?.location || '';
    let linkedin = cand?.linkedin || '';

    // Heuristic fallbacks if AI didn't catch specific fields
    if (!name) {
      // Try to extract name after closing salutation (Sincerely,\nName or Cordialement,\nName)
      const closingMatch = letterText.match(/(?:Sincerely|Cordialement|Best regards|Bien cordialement),?\s*\n+([A-Za-zÀ-ÿ\s'-]{3,40})/i);
      if (closingMatch && closingMatch[1]) {
        name = closingMatch[1].trim();
      }
    }

    if (!email) {
      const emailMatch = (this.additionalInfo() + ' ' + letterText).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) email = emailMatch[0];
    }

    // Company details
    let compName = comp?.company_name || '';
    let compManager = comp?.hiring_manager || '';
    let compLoc = comp?.location || '';

    if (!compName) {
      // Look for "at Company" or "Company: Name" in job description
      const compMatch = this.jobDescription().match(/(?:at|company:?|for)\s+([A-Z][A-Za-z0-9&.,\s]{2,30})/);
      if (compMatch && compMatch[1]) {
        compName = compMatch[1].trim().replace(/[.,]$/, '');
      }
    }

    this.candidateName.set(name);
    this.candidateTitle.set(title);
    this.candidateEmail.set(email);
    this.candidatePhone.set(phone);
    this.candidateLocation.set(location);
    this.candidateLinkedin.set(linkedin);

    this.companyName.set(compName);
    this.companyManager.set(compManager || (this.selectedLanguage() === 'fr' ? 'Équipe Recrutement' : 'Hiring Team'));
    this.companyLocation.set(compLoc);
  }

  // Copy cover letter to clipboard
  copyCoverLetter() {
    const text = this.coverLetter();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  // Save final cover letter as .txt file
  saveAsTxt() {
    const text = this.coverLetter();
    if (!text) return;
    const filename = this.selectedLanguage() === 'fr' ? 'Lettre_de_Motivation.txt' : 'Cover_Letter.txt';
    exportAsTxt(text, filename);
  }

  // Save final cover letter as professionally formatted letterhead .pdf file
  saveStructuredPdf() {
    const filename = this.selectedLanguage() === 'fr' ? 'Lettre_de_Motivation.pdf' : 'Cover_Letter.pdf';
    exportStructuredPdf({
      candidateName: this.candidateName(),
      candidateTitle: this.candidateTitle(),
      candidateEmail: this.candidateEmail(),
      candidatePhone: this.candidatePhone(),
      candidateLocation: this.candidateLocation(),
      candidateLinkedin: this.candidateLinkedin(),
      companyName: this.companyName(),
      companyManager: this.companyManager(),
      companyLocation: this.companyLocation(),
      letterDate: this.letterDate(),
      body: this.coverLetter(),
      language: this.selectedLanguage()
    }, filename);
  }

  // Reset to start over
  reset() {
    this.uiState.set('INPUT');
    this.analysisResult.set(null);
    this.coverLetter.set('');
    this.copied.set(false);
    this.exportMode.set('txt');
    this.candidateName.set('');
    this.candidateTitle.set('');
    this.candidateEmail.set('');
    this.candidatePhone.set('');
    this.candidateLocation.set('');
    this.candidateLinkedin.set('');
    this.companyName.set('');
    this.companyManager.set('');
    this.companyLocation.set('');
    this.letterDate.set('');
  }
}
