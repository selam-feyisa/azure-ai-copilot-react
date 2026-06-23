from fastapi import APIRouter, UploadFile, File, Form
import os, base64, requests
from PIL import Image
import io
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

ENDPOINT = os.getenv("AZURE_IMAGE_ENDPOINT", "").rstrip("/")
API_KEY = os.getenv("AZURE_IMAGE_KEY")
DEPLOYMENT = os.getenv("AZURE_IMAGE_DEPLOYMENT", "gpt-image-1.5")

@router.post("/edit")
async def edit_image(
    file: UploadFile = File(...),
    prompt: str = Form(...)
):
    try:
        image_bytes = await file.read()
        img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        output = io.BytesIO()
        img.save(output, format="PNG")
        png_bytes = output.getvalue()

        url = f"{ENDPOINT}/openai/deployments/{DEPLOYMENT}/images/edits?api-version=2025-04-01-preview"
        headers = {"api-key": API_KEY}
        files = {"image": ("image.png", png_bytes, "image/png")}
        data = {"prompt": prompt, "n": "1", "size": "1024x1024", "output_format": "png"}

        response = requests.post(url, headers=headers, files=files, data=data, timeout=120)

        if response.status_code == 200:
            image_base64 = response.json()["data"][0]["b64_json"]
            os.makedirs("assets/outputs", exist_ok=True)
            with open("assets/outputs/edited.png", "wb") as f:
                f.write(base64.b64decode(image_base64))
            return {"success": True, "image_base64": image_base64}
        else:
            return {"success": False, "error": f"{response.status_code}: {response.text}"}
    except Exception as e:
        return {"success": False, "error": str(e)}