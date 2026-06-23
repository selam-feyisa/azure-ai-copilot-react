from fastapi import APIRouter, Response
from pydantic import BaseModel
from html import escape
import os
import requests
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    language: str = "en"
    voice: str | None = None


VOICE_MAP = {
    "en": "en-US-JennyNeural",
    "am": "am-ET-MekdesNeural",
    "ar": "ar-SA-ZariyahNeural",
    "fr": "fr-FR-DeniseNeural",
    "es": "es-ES-ElviraNeural",
}


@router.get("/status")
def status():
    return {"status": "Speech service ready"}


@router.post("/tts")
def text_to_speech(request: TTSRequest):
    try:
        speech_key = os.getenv("AZURE_SPEECH_KEY")
        speech_region = os.getenv("AZURE_SPEECH_REGION")

        if not speech_key or not speech_region:
            return {"success": False, "error": "Azure Speech credentials are not configured."}

        voice = request.voice or VOICE_MAP.get(request.language, VOICE_MAP["en"])
        voice_lang = "-".join(voice.split("-")[:2])
        ssml = f"""
        <speak version="1.0" xml:lang="{voice_lang}">
          <voice xml:lang="{voice_lang}" name="{voice}">
            {escape(request.text)}
          </voice>
        </speak>
        """.strip()

        response = requests.post(
            f"https://{speech_region}.tts.speech.microsoft.com/cognitiveservices/v1",
            headers={
                "Ocp-Apim-Subscription-Key": speech_key,
                "Content-Type": "application/ssml+xml",
                "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
                "User-Agent": "AzureAICopilot"
            },
            data=ssml.encode("utf-8"),
            timeout=60
        )

        if response.status_code != 200:
            return {"success": False, "error": f"{response.status_code}: {response.text}"}

        return Response(content=response.content, media_type="audio/mpeg")
    except Exception as e:
        return {"success": False, "error": str(e)}
