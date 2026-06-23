from fastapi import APIRouter
from pydantic import BaseModel
import os
import base64
import requests
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

ENDPOINT = os.getenv("AZURE_IMAGE_ENDPOINT", "").rstrip("/")
API_KEY = os.getenv("AZURE_IMAGE_KEY")
DEPLOYMENT = os.getenv("AZURE_IMAGE_DEPLOYMENT", "gpt-image-1.5")


class ImageRequest(BaseModel):
    prompt: str
    style: str = "Photorealistic"


@router.post("/generate")
async def generate_image(request: ImageRequest):
    try:
        url = f"{ENDPOINT}/openai/deployments/{DEPLOYMENT}/images/generations?api-version=2025-04-01-preview"
        headers = {
            "Content-Type": "application/json",
            "api-key": API_KEY
        }
        payload = {
            "prompt": f"{request.prompt}, {request.style} style, high quality",
            "size": "1024x1024",
            "quality": "medium",
            "output_format": "png",
            "n": 1
        }

        response = requests.post(url, headers=headers, json=payload, timeout=90)

        if response.status_code == 200:
            data = response.json()
            image_base64 = data["data"][0]["b64_json"]
            os.makedirs("assets/outputs", exist_ok=True)
            output_path = "assets/outputs/generated.png"
            with open(output_path, "wb") as f:
                f.write(base64.b64decode(image_base64))
            return {
                "success": True,
                "image_base64": image_base64,
                "path": "/outputs/generated.png"
            }
        else:
            return {"success": False, "error": f"{response.status_code}: {response.text}"}
    except Exception as e:
        return {"success": False, "error": str(e)}