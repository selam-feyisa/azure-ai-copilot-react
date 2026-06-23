from fastapi import APIRouter, UploadFile, File
from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.ai.vision.imageanalysis.models import VisualFeatures
from azure.core.credentials import AzureKeyCredential
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

client = ImageAnalysisClient(
    endpoint=os.getenv("AZURE_VISION_ENDPOINT"),
    credential=AzureKeyCredential(os.getenv("AZURE_VISION_KEY"))
)


@router.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        result = client.analyze(
            image_data=image_bytes,
            visual_features=[
                VisualFeatures.CAPTION,
                VisualFeatures.READ,
                VisualFeatures.OBJECTS,
                VisualFeatures.TAGS
            ]
        )

        response = []
        if result.caption:
            response.append({"type": "caption", "text": result.caption.text})
        if result.tags and result.tags.list:
            tags = [t.name for t in result.tags.list[:6]]
            response.append({"type": "tags", "items": tags})
        if result.objects and result.objects.list:
            objects = [o.tags[0].name for o in result.objects.list]
            response.append({"type": "objects", "items": objects})
        if result.read and result.read.blocks:
            text_lines = []
            for block in result.read.blocks:
                for line in block.lines:
                    text_lines.append(line.text)
            response.append({"type": "text", "lines": text_lines})

        return {"success": True, "results": response}
    except Exception as e:
        return {"success": False, "error": str(e)}