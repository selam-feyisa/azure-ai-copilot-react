from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Any
import os, json
from datetime import datetime
from azure.storage.blob import BlobServiceClient
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
CONTAINER_NAME = os.getenv("AZURE_STORAGE_CONTAINER", "history")


def get_container():
    client = BlobServiceClient.from_connection_string(CONNECTION_STRING)
    return client.get_container_client(CONTAINER_NAME)


class SaveRequest(BaseModel):
    messages: List[Any]
    metadata: dict = {}


@router.post("/save")
async def save_history(request: SaveRequest):
    try:
        container = get_container()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        blob_name = f"session_{timestamp}.json"
        data = json.dumps({
            "timestamp": datetime.now().isoformat(),
            "date": datetime.now().strftime("%B %d, %Y %H:%M"),
            "messages": request.messages,
            "message_count": len(request.messages),
            "metadata": request.metadata
        }, ensure_ascii=False)
        container.upload_blob(name=blob_name, data=data.encode("utf-8"), overwrite=True)
        return {"success": True, "blob_name": blob_name}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/load")
async def load_history():
    try:
        container = get_container()
        sessions = []
        for blob in container.list_blobs():
            if blob.name.endswith(".json"):
                data = container.get_blob_client(blob.name).download_blob().readall()
                session = json.loads(data.decode("utf-8"))
                session["blob_name"] = blob.name
                sessions.append(session)
        sessions.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return {"success": True, "sessions": sessions[:20]}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.delete("/delete/{blob_name}")
async def delete_session(blob_name: str):
    try:
        container = get_container()
        container.delete_blob(blob_name)
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}