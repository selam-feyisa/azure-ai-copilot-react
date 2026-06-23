from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
import io
import os
import PyPDF2
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_version="2024-02-01"
)


class PDFQuestion(BaseModel):
    pdf_text: str
    question: str


@router.post("/extract")
async def extract_pdf(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return {
            "success": True,
            "text": text.strip(),
            "word_count": len(text.split()),
            "pages": len(reader.pages)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/ask")
async def ask_pdf(request: PDFQuestion):
    try:
        response = client.chat.completions.create(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o"),
            messages=[
                {
                    "role": "system",
                    "content": "You are a document analysis AI. Answer questions based ONLY on the document provided."
                },
                {
                    "role": "user",
                    "content": f"Document:\n{request.pdf_text[:8000]}\n\nQuestion: {request.question}"
                }
            ],
            max_tokens=800
        )
        return {
            "success": True,
            "answer": response.choices[0].message.content
        }
    except Exception as e:
        return {"success": False, "error": str(e)}