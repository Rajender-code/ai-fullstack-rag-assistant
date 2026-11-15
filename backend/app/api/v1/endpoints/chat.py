from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from app.core.config import settings
from app.ai.rag_service import process_pdf, retrieve_relevant_context

router = APIRouter()

GROQ_URL = "https://api" + ".groq" + ".com/openai/v1"

client = OpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url=GROQ_URL,
)


class ChatRequest(BaseModel):
    message: str
    use_doc: bool = True


def get_active_groq_model() -> str:
    try:
        available = [
            m.id for m in client.models.list().data
            if "whisper" not in m.id.lower() and "guard" not in m.id.lower() and "tts" not in m.id.lower()
        ]
        for preferred in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "openai/gpt-oss-120b", "qwen/qwen3-32b"]:
            if preferred in available:
                return preferred
        if available:
            return available[0]
    except Exception:
        pass
    return "llama-3.1-8b-instant"


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a valid PDF file.")

    try:
        file_bytes = await file.read()
        stats = process_pdf(file_bytes, file.filename)
        return {
            "status": "success",
            "message": f"Indexed '{stats['filename']}' ({stats['pages']} pages, {stats['chunks_indexed']} chunks).",
            **stats,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")


@router.post("/stream")
def chat_stream(request: ChatRequest):
    context, filename = ("", "")
    if request.use_doc:
        context, filename = retrieve_relevant_context(request.message)

    if context:
        system_prompt = (
            f"You are an AI Document Assistant. Answer the user's question using ONLY the context "
            f"from the uploaded document '{filename}' below. If the answer is not in the context, say so clearly.\n\n"
            f"DOCUMENT CONTEXT:\n{context}"
        )
    else:
        system_prompt = "You are a helpful AI full-stack assistant."

    try:
        active_model = get_active_groq_model()
        completion = client.chat.completions.create(
            model=active_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message},
            ],
        )
        reply_text = completion.choices[0].message.content
        return {
            "reply": reply_text or "No reply returned.",
            "source_doc": filename if context else None,
        }
    except Exception as e:
        return {"reply": f"AI Error: {str(e)}", "source_doc": None}
