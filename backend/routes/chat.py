from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import os
from openai import AzureOpenAI
from dotenv import load_dotenv
import requests

load_dotenv()

router = APIRouter()

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_version="2024-02-01"
)

TRANSLATOR_KEY = os.getenv("AZURE_TRANSLATOR_KEY")
TRANSLATOR_ENDPOINT = os.getenv("AZURE_TRANSLATOR_ENDPOINT")
TRANSLATOR_REGION = os.getenv("AZURE_TRANSLATOR_REGION")


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    user_input: str


def detect_language(text: str) -> str:
    try:
        url = f"{TRANSLATOR_ENDPOINT}detect"
        params = {"api-version": "3.0"}
        headers = {
            "Ocp-Apim-Subscription-Key": TRANSLATOR_KEY,
            "Ocp-Apim-Subscription-Region": TRANSLATOR_REGION,
            "Content-Type": "application/json"
        }
        response = requests.post(url, params=params, headers=headers, json=[{"text": text}])
        return response.json()[0]["language"]
    except:
        return "en"


@router.post("/send")
async def send_message(request: ChatRequest):
    try:
        detected_lang = detect_language(request.user_input)

        lang_labels = {
            "am": "Amharic", "ar": "Arabic",
            "fr": "French", "es": "Spanish", "en": "English"
        }
        lang_label = lang_labels.get(detected_lang, detected_lang)

        messages = [m.dict() for m in request.messages]
        messages.append({
            "role": "user",
            "content": f"[Language: {lang_label}] {request.user_input}"
        })

        response = client.chat.completions.create(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o"),
            messages=messages,
            temperature=0.7,
            max_tokens=800
        )

        ai_response = response.choices[0].message.content

        return {
            "response": ai_response,
            "detected_language": detected_lang,
            "lang_label": lang_label
        }
    except Exception as e:
        return {"error": str(e)}