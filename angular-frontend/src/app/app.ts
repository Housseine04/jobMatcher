import { Component, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ResumeService, AnalysisResponse } from './services/resume';
import { NgClass } from '@angular/common';

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

  // Results Data
  analysisResult = signal<AnalysisResponse['data'] | null>(null);

  // Handle File Selection
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile.set(file);
      const objectUrl = URL.createObjectURL(file);
      this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl));
    } else {
      alert('Please upload a valid PDF file.');
    }
  }

  // Trigger the Analysis
  analyze() {
    const file = this.selectedFile();
    if (!file || !this.jobDescription() || !this.jobRequirements()) {
      alert('Please provide the PDF, Job Description, and Requirements.');
      return;
    }

    this.uiState.set('LOADING');

    this.resumeService.analyzeResume(
      file,
      this.jobDescription(),
      this.jobRequirements(),
      this.additionalInfo()
    ).subscribe({
      next: (response) => {
        this.analysisResult.set(response.data);
        this.uiState.set('RESULTS');
      },
      error: (err) => {
        console.error(err);
        alert('An error occurred during analysis. Check the console.');
        this.uiState.set('INPUT');
      }
    });
  }

  // Reset to start over
  reset() {
    this.uiState.set('INPUT');
    //this.selectedFile.set(null);
    //this.pdfUrl.set(null);
    this.analysisResult.set(null);
  }
}