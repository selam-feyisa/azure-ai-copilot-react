from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
import os
import requests
from dotenv import load_dotenv
from openai import AzureOpenAI

load_dotenv()

router = APIRouter()

ENDPOINT = os.getenv("AZURE_WHISPER_ENDPOINT", "").rstrip("/")
API_KEY = os.getenv("AZURE_WHISPER_KEY")
DEPLOYMENT = os.getenv("AZURE_WHISPER_DEPLOYMENT", "whisper")
TRANSLATOR_KEY = os.getenv("AZURE_TRANSLATOR_KEY")
TRANSLATOR_ENDPOINT = os.getenv("AZURE_TRANSLATOR_ENDPOINT", "").rstrip("/")
TRANSLATOR_REGION = os.getenv("AZURE_TRANSLATOR_REGION")

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_version="2024-02-01"
)


class TranscriptAnalysisRequest(BaseModel):
    text: str
    task: str = "summary"


def detect_language(text: str) -> str:
    try:
        url = f"{TRANSLATOR_ENDPOINT}/detect"
        params = {"api-version": "3.0"}
        headers = {
            "Ocp-Apim-Subscription-Key": TRANSLATOR_KEY,
            "Ocp-Apim-Subscription-Region": TRANSLATOR_REGION,
            "Content-Type": "application/json"
        }
        response = requests.post(url, params=params, headers=headers, json=[{"text": text}], timeout=20)
        return response.json()[0]["language"]
    except Exception:
        return "auto"


def translate_text(text: str, to_language: str = "en") -> str:
    try:
        url = f"{TRANSLATOR_ENDPOINT}/translate"
        params = {"api-version": "3.0", "to": to_language}
        headers = {
            "Ocp-Apim-Subscription-Key": TRANSLATOR_KEY,
            "Ocp-Apim-Subscription-Region": TRANSLATOR_REGION,
            "Content-Type": "application/json"
        }
        response = requests.post(url, params=params, headers=headers, json=[{"text": text}], timeout=30)
        response.raise_for_status()
        return response.json()[0]["translations"][0]["text"]
    except Exception:
        return ""


@router.post("/audio")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form(""),
    translate_to_english: bool = Form(False)
):
    try:
        file_bytes = await file.read()
        size_mb = len(file_bytes) / (1024 * 1024)

        if size_mb > 24:
            return {
                "success": False,
                "error": f"File too large ({size_mb:.1f}MB). Max 24MB."
            }

        url = f"{ENDPOINT}/openai/deployments/{DEPLOYMENT}/audio/transcriptions?api-version=2024-02-01"
        headers = {"api-key": API_KEY}

        ext = file.filename.lower().split(".")[-1]
        mime_map = {
            "mp3": "audio/mpeg", "mp4": "video/mp4",
            "wav": "audio/wav", "m4a": "audio/mp4",
            "mov": "video/quicktime", "webm": "audio/webm"
        }
        mime_type = mime_map.get(ext, "audio/mpeg")

        files = {"file": (file.filename, file_bytes, mime_type)}
        data = {"response_format": "json"}
        if language and language != "auto":
            data["language"] = language

        response = requests.post(
            url, headers=headers,
            files=files, data=data, timeout=120
        )

        if response.status_code == 200:
            text = response.json().get("text", "")
            detected_language = detect_language(text) if text else "auto"
            translated_text = translate_text(text, "en") if translate_to_english and text else ""
            return {
                "success": True,
                "text": text,
                "detected_language": detected_language,
                "translated_text": translated_text
            }
        else:
            return {"success": False, "error": f"{response.status_code}: {response.text}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/analyze")
async def analyze_transcript(request: TranscriptAnalysisRequest):
    try:
        task_prompts = {
            "summary": "Summarize this transcript clearly with main topic, important points, and conclusion.",
            "actions": "Extract action items, decisions, names, dates, and follow-up tasks from this transcript.",
            "translate_en": "Translate this transcript to natural English. Preserve names and technical terms.",
            "translate_am": "Translate this transcript to natural Amharic. Preserve names and technical terms.",
        }
        prompt = task_prompts.get(request.task, task_prompts["summary"])

        response = client.chat.completions.create(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o"),
            messages=[
                {"role": "system", "content": "You are a precise transcript analyst. Keep the output structured and useful."},
                {"role": "user", "content": f"{prompt}\n\nTranscript:\n{request.text}"}
            ],
            temperature=0.2,
            max_tokens=900
        )

        return {"success": True, "analysis": response.choices[0].message.content}
    except Exception as e:
        return {"success": False, "error": str(e)}
