"use client";

import { useState, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sourceDoc?: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE}/api/v1/chat/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setUploadedDoc(data.filename);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `📄 ${data.message} You can now ask questions about this document!`,
        },
      ]);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to upload PDF.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Upload Error: ${errorMsg}` },
      ]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "" }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/v1/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          use_doc: Boolean(uploadedDoc),
        }),
      });

      const data = await response.json();

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: data.reply || "No reply received from backend.",
          sourceDoc: data.source_doc,
        };
        return updated;
      });
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content =
          "Connection Error: Make sure uvicorn is running on port 8000.";
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-950 text-slate-100 p-4">
      <div className="w-full max-w-3xl flex flex-col h-[90vh] border border-slate-800 rounded-2xl bg-slate-900 shadow-xl overflow-hidden">
        <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-white">AI Document & Chat Assistant</h1>
            <p className="text-xs text-slate-400">Next.js + TypeScript + Python FastAPI + Llama 3.3 RAG</p>
          </div>

          <div className="flex items-center gap-2">
            {uploadedDoc && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 max-w-[160px] truncate">
                📄 {uploadedDoc}
              </span>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              {isUploading ? "Indexing PDF..." : "+ Upload PDF"}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-sm space-y-2">
              <p>
                Ask any general question below, or click <strong>+ Upload PDF</strong> at the top right to chat with your own document!
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-200 border border-slate-700"
                }`}
              >
                {msg.content || (isLoading && msg.role === "assistant" ? "Thinking..." : "")}
                {msg.sourceDoc && (
                  <div className="mt-2 pt-2 border-t border-slate-700/70 text-[11px] text-blue-400">
                    Source: {msg.sourceDoc}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-900 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={uploadedDoc ? `Ask about ${uploadedDoc}...` : "Type your message..."}
            className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </main>
  );
}
