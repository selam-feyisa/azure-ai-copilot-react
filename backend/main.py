from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes import chat, vision, speech, image_gen, image_edit, transcribe, pdf_rag, history

app = FastAPI(title="Azure AI Copilot API")

# CORS — allow React to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MOUNT STATIC FILES
app.mount("/outputs", StaticFiles(directory="assets/outputs"), name="outputs")

# ROUTES
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(vision.router, prefix="/api/vision", tags=["Vision"])
app.include_router(speech.router, prefix="/api/speech", tags=["Speech"])
app.include_router(image_gen.router, prefix="/api/image", tags=["Image"])
app.include_router(image_edit.router, prefix="/api/edit", tags=["Edit"])
app.include_router(transcribe.router, prefix="/api/transcribe", tags=["Transcribe"])
app.include_router(pdf_rag.router, prefix="/api/pdf", tags=["PDF"])
app.include_router(history.router, prefix="/api/history", tags=["History"])

@app.get("/")
def root():
    return {"status": "Azure AI Copilot API Running"}
