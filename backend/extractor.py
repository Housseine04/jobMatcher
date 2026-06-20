#PyMuPDF/Tesseract logic

import fitz
import pytesseract
from PIL import Image
import io

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Attempts to extract text using PyMuPDF
    Falls back to Tesseract OCR if the PDF is an image (like a scan or whatever)
    """
    extracted_text = ""
    
    # Load the PDF
    pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
    
    #Step 1 >> Fast-Pass: Try PyMuPDF Digital Extraction
    for page_num in range(len(pdf_document)):
        page = pdf_document.load_page(page_num)
        extracted_text += page.get_text()
        
    # Check if we got meaningful text (more than 50 chars)
    if len(extracted_text.strip()) > 50:
        return extracted_text.strip()
        
    #Step 2 >> Fallback : OCR Extraction for scanned PDF
    extracted_text = ""
    for page_num in range(len(pdf_document)):
        page = pdf_document.load_page(page_num)
        
        # Render page to an image (pixmap)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) # 2x zoom for better OCR
        img = Image.open(io.BytesIO(pix.tobytes("png")))
        
        # tesseract run
        text = pytesseract.image_to_string(img)
        extracted_text += text + "\n"
        
    return extracted_text.strip()