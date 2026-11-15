import io
import re
from pypdf import PdfReader

DOCUMENT_STORE: list[str] = []
CURRENT_FILENAME: str = ""


def chunk_text(text: str, chunk_size: int = 900, overlap: int = 150) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def process_pdf(file_bytes: bytes, filename: str) -> dict:
    global DOCUMENT_STORE, CURRENT_FILENAME

    reader = PdfReader(io.BytesIO(file_bytes))
    full_text = ""
    for page_num, page in enumerate(reader.pages, start=1):
        extracted = page.extract_text() or ""
        full_text += f"\n[Page {page_num}]\n{extracted}"

    if not full_text.strip():
        raise ValueError("No readable text found in this PDF.")

    DOCUMENT_STORE = chunk_text(full_text)
    CURRENT_FILENAME = filename

    return {
        "filename": filename,
        "pages": len(reader.pages),
        "chunks_indexed": len(DOCUMENT_STORE),
    }


def retrieve_relevant_context(query: str, top_k: int = 3) -> tuple[str, str]:
    if not DOCUMENT_STORE:
        return "", ""

    query_tokens = set(re.findall(r"\w+", query.lower()))
    scored = []

    for chunk in DOCUMENT_STORE:
        chunk_tokens = set(re.findall(r"\w+", chunk.lower()))
        overlap_score = len(query_tokens & chunk_tokens)
        scored.append((overlap_score, chunk))

    scored.sort(key=lambda x: x, reverse=True)
    top_chunks = [text for _, text in scored[:top_k]]

    return "\n\n---\n\n".join(top_chunks), CURRENT_FILENAME
