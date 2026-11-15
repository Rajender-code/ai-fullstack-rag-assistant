# AI Document & Chat Assistant (Full-Stack RAG Application)

A full-stack Retrieval-Augmented Generation (RAG) web application built with **Python (FastAPI)** and **Next.js (TypeScript)**. Users can upload PDF documents, index them into overlapping text chunks, and query their contents with source-grounded AI answers.

## Tech Stack
- **Backend:** Python, FastAPI, Pydantic, PyPDF, OpenAI/Groq SDK
- **Frontend:** Next.js (App Router), TypeScript, React, Tailwind CSS
- **DevOps:** Docker, Docker Compose, Git & GitHub

## Features
- **PDF Ingestion & Chunking:** Extracts multi-page PDF text and splits it into overlapping semantic chunks.
- **Context-Grounded RAG Chat:** Retrieves top-matching document chunks to generate accurate answers with source citations.
- **Resilient LLM Routing:** Dynamically selects active LLM endpoints with automatic fallback handling.
- **Containerized Architecture:** Multi-service setup using Docker and Docker Compose.

## Local Setup
1. Clone the repository and add your API key in `backend/.env` (`GROQ_API_KEY=your_key_here`).
2. Run with Docker:
   ```bash
   docker compose up --build
   ```
3. Or run locally:
   - **Backend:** `cd backend && uvicorn app.main:app`
   - **Frontend:** `cd frontend && npm run dev`
