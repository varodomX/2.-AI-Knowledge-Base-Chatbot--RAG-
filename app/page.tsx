"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderOpen,
  Layers,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { Conversation, Document, Source } from "@/lib/types";
const prompts = [
  {
    icon: BookOpen,
    title: "Give me the big picture",
    text: "Summarize the key points in my documents.",
  },
  {
    icon: Search,
    title: "Find something specific",
    text: "What are the main findings and recommendations?",
  },
  {
    icon: Layers,
    title: "Connect the dots",
    text: "What common themes appear across these documents?",
  },
];
async function api(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}
export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]),
    [chats, setChats] = useState<Conversation[]>([]),
    [active, setActive] = useState<string | null>(null),
    [question, setQuestion] = useState(""),
    [mode, setMode] = useState("demo"),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState(""),
    [tab, setTab] = useState<"chat" | "documents">("chat"),
    [filter, setFilter] = useState(""),
    [selected, setSelected] = useState(""),
    [source, setSource] = useState<Source | null>(null),
    [sidebar, setSidebar] = useState(false),
    [ready, setReady] = useState(false),
    [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null),
    bottom = useRef<HTMLDivElement>(null);
  const chat = chats.find((c) => c.id === active);
  async function refresh() {
    const data = await api("/api/workspace");
    setDocuments(data.documents);
    setChats(data.conversations);
    setMode(data.mode);
  }
  useEffect(() => {
    refresh()
      .catch((e) => setError(e.message))
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages.length, busy]);
  async function upload(file?: File) {
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      await api("/api/upload", { method: "POST", body: form });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }
  async function send(text = question) {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError("");
    setQuestion("");
    try {
      const result = await api("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          conversationId: active,
          documentId: selected || undefined,
        }),
      });
      setChats((prev) => [result, ...prev.filter((c) => c.id !== result.id)]);
      setActive(result.id);
    } catch (e) {
      setError((e as Error).message);
      setQuestion(text);
    } finally {
      setBusy(false);
    }
  }
  async function remove(kind: string, id: string) {
    setError("");
    try {
      await api("/api/workspace", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id }),
      });
      if (kind === "conversation" && active === id) setActive(null);
      if (selected === id) setSelected("");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function newChat() {
    setActive(null);
    setQuestion("");
    setTab("chat");
    setSidebar(false);
  }
  return (
    <div className="workspace">
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      {sidebar && (
        <button
          aria-label="Close navigation"
          className="mobile-scrim"
          onClick={() => setSidebar(false)}
        />
      )}
      <aside className={`sidebar ${sidebar ? "open" : ""}`}>
        <a href="/" className="brand">
          <span className="brand-icon">
            <Layers size={22} />
          </span>
          folio<span className="brand-dot">.</span>
        </a>
        <div className="workspace-label">
          <span className="workspace-avatar">P</span>
          <div>
            Personal workspace<small>Your knowledge, connected</small>
          </div>
          <ChevronDown size={14} />
        </div>
        <button className="new-chat" onClick={newChat} disabled={busy}>
          <Plus size={17} /> New conversation <span>↗</span>
        </button>
        <nav>
          <button
            className={tab === "chat" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("chat")}
          >
            <MessageSquare size={17} /> Conversations{" "}
            <span>{chats.length}</span>
          </button>
          <button
            className={tab === "documents" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("documents")}
          >
            <FolderOpen size={17} /> Knowledge library{" "}
            <span>{documents.length}</span>
          </button>
        </nav>
        <div className="history">
          <div className="section-label">
            RECENT CONVERSATIONS
            <MoreHorizontal size={17} />
          </div>
          {chats.length > 0 ? (
            <>
              <label className="history-search">
                <Search size={14} />
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search conversations"
                  aria-label="Search conversations"
                />
              </label>
              {chats
                .filter((c) =>
                  c.title.toLowerCase().includes(filter.toLowerCase()),
                )
                .map((c) => (
                  <div
                    key={c.id}
                    className={`history-row ${active === c.id ? "chosen" : ""}`}
                  >
                    <button
                      disabled={busy}
                      onClick={() => {
                        setActive(c.id);
                        setTab("chat");
                        setSidebar(false);
                      }}
                    >
                      <MessageSquare size={14} />
                      <span>{c.title}</span>
                    </button>
                    <button
                      disabled={busy}
                      className="delete-chat"
                      aria-label={`Delete ${c.title}`}
                      onClick={() => remove("conversation", c.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
            </>
          ) : (
            <p className="empty-history">
              A good question is the start
              <br />
              of something worth saving.
            </p>
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="demo-card">
            <span className="mini-spark">
              <Sparkles size={16} />
            </span>
            <strong>
              {mode === "live" ? "AI is connected" : "Made for curious minds"}
            </strong>
            <p>
              {mode === "live"
                ? "Semantic search and grounded answers are ready."
                : "Explore your documents. Discover something new."}
            </p>
            <span className="demo-tag">
              <span />
              {mode === "live" ? "LIVE AI" : "LOCAL DEMO"}
            </span>
          </div>
          <div className="profile">
            <span className="profile-avatar">JD</span>
            <div>
              My workspace<small>Personal account</small>
            </div>
            <ShieldCheck size={17} />
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              onClick={() => setSidebar(true)}
              aria-label="Open navigation"
            >
              <PanelLeftClose size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>
              {tab === "chat" ? "Conversations" : "Knowledge library"}
            </strong>
          </div>
          <div className="top-actions">
            <span className="status">
              <i />
              {mode === "live" ? "AI connected" : "Demo workspace"}
            </span>
            <button
              className="small-upload"
              onClick={() => input.current?.click()}
              disabled={uploading}
            >
              <Upload size={15} />
              <span>{uploading ? "Processing…" : "Upload PDF"}</span>
            </button>
          </div>
        </header>
        {error && (
          <div role="alert" className="error-banner">
            {error}
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={15} />
            </button>
          </div>
        )}
        {tab === "documents" ? (
          <div className="library">
            <div className="page-eyebrow">YOUR KNOWLEDGE, IN ONE PLACE</div>
            <h1>
              Knowledge library<span>.</span>
            </h1>
            <p className="subtitle">The source of your next great answer.</p>
            <button
              className="upload-zone"
              disabled={uploading}
              onClick={() => input.current?.click()}
            >
              <Upload size={24} />
              <strong>
                {uploading
                  ? "Reading and indexing your PDF…"
                  : "Add a document to your workspace"}
              </strong>
              <span>PDF files · up to 10 MB · text-based documents</span>
            </button>
            <div className="library-heading">
              <strong>{documents.length} documents</strong>
              <span>Stored privately in this browser session</span>
            </div>
            {documents.map((d) => (
              <div className="document-row" key={d.id}>
                <div className="pdf-icon">
                  <FileText size={23} />
                </div>
                <div>
                  <strong>{d.name}</strong>
                  <small>
                    {d.pages} pages · {d.chunks} indexed chunks ·{" "}
                    {(d.size / 1024).toFixed(0)} KB
                  </small>
                </div>
                <span className="indexed">
                  <Check size={13} /> Indexed
                </span>
                <button
                  aria-label={`Delete ${d.name}`}
                  disabled={busy || uploading}
                  onClick={() => remove("document", d.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {!documents.length && (
              <p className="library-empty">
                Your library is a blank canvas. Add your first PDF above.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className={`chat-body ${chat ? "has-chat" : ""}`}>
              {chat ? (
                <div className="messages">
                  <div className="conversation-title">
                    <span className="page-eyebrow">CONVERSATION</span>
                    <h2>{chat.title}</h2>
                  </div>
                  {chat.messages.map((m) => (
                    <div className={`message ${m.role}`} key={m.id}>
                      <div className={`message-avatar ${m.role}`}>
                        {m.role === "assistant" ? <Layers size={18} /> : "JD"}
                      </div>
                      <div className="message-content">
                        <div className="message-author">
                          {m.role === "assistant" ? "Folio" : "You"}
                          {m.role === "assistant" && (
                            <span>
                              {mode === "demo"
                                ? "Document retrieval"
                                : "Grounded answer"}
                            </span>
                          )}
                        </div>
                        <p>{m.content}</p>
                        {!!m.sources?.length && (
                          <div className="message-sources">
                            {m.sources.map((s, i) => (
                              <button key={i} onClick={() => setSource(s)}>
                                <span>{i + 1}</span>
                                <FileText size={13} />
                                {s.name}
                                <small>p. {s.page}</small>
                                <ArrowUpRight size={13} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {busy && (
                    <div className="thinking">
                      <Loader2 size={16} className="animate-spin" />
                      Searching your documents…
                    </div>
                  )}
                  <div ref={bottom} />
                </div>
              ) : (
                <div className="welcome">
                  <div className="welcome-symbol">
                    <Layers size={31} />
                    <span className="spark-orbit">
                      <Sparkles size={13} />
                    </span>
                  </div>
                  <div className="page-eyebrow">
                    LESS SEARCHING. MORE UNDERSTANDING.
                  </div>
                  <h1>
                    Your knowledge.
                    <br />
                    <span>A conversation away.</span>
                  </h1>
                  <p className="welcome-description">
                    Turn your documents into a thinking partner.
                    <br />
                    Ask a question, find a connection, go a little deeper.
                  </p>
                  <div className="suggestions">
                    {prompts.map((p) => (
                      <button
                        key={p.title}
                        onClick={() => {
                          setQuestion(p.text);
                        }}
                      >
                        <p.icon size={20} />
                        <strong>{p.title}</strong>
                        <span>{p.text}</span>
                        <ArrowUpRight size={15} className="suggestion-arrow" />
                      </button>
                    ))}
                  </div>
                  <div
                    className={`upload-zone ${dragging ? "dragging" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      upload(e.dataTransfer.files[0]);
                    }}
                  >
                    <div className="upload-circle">
                      {uploading ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Upload size={20} />
                      )}
                    </div>
                    <div>
                      <strong>
                        {uploading
                          ? "Reading and indexing your document…"
                          : documents.length
                            ? `${documents.length} document${documents.length > 1 ? "s" : ""} ready for your questions`
                            : "Start with a little knowledge"}
                      </strong>
                      <p>
                        {uploading
                          ? "Preparing text chunks and search vectors."
                          : "Drop a PDF here, or "}{" "}
                        {!uploading && (
                          <button onClick={() => input.current?.click()}>
                            browse files <ArrowUpRight size={12} />
                          </button>
                        )}
                      </p>
                    </div>
                    <span className="file-limit">PDF · 10 MB max</span>
                  </div>
                  <div className="welcome-footer">
                    <ShieldCheck size={13} />
                    <span>Session-isolated storage</span>
                    <i />
                    <span>Answers with sources</span>
                    <i />
                    <a href="/sample-research.pdf" download>Download a sample PDF ↗</a>
                  </div>
                </div>
              )}
            </div>
            <div className="composer-area">
              <form
                className="composer"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <textarea
                  aria-label="Ask a question about your documents"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask anything about your documents…"
                  rows={2}
                  maxLength={4000}
                  disabled={!ready || busy}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />
                <div className="composer-bottom">
                  <div className="composer-tools">
                    <button
                      type="button"
                      title="Upload PDF"
                      aria-label="Upload PDF"
                      onClick={() => input.current?.click()}
                      disabled={uploading}
                    >
                      <Plus size={18} />
                    </button>
                    <span className="tool-divider" />
                    <label>
                      <Layers size={13} />
                      <select
                        aria-label="Document scope"
                        value={selected}
                        onChange={(e) => setSelected(e.target.value)}
                      >
                        <option value="">All documents</option>
                        {documents.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={12} />
                    </label>
                  </div>
                  <div className="send-tools">
                    <span>{busy ? "Thinking…" : "↵ to send"}</span>
                    <button
                      type="submit"
                      className="send-button"
                      aria-label="Send question"
                      disabled={!ready || !question.trim() || busy || uploading}
                    >
                      {busy ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <ArrowUp size={19} />
                      )}
                    </button>
                  </div>
                </div>
              </form>
              <p className="composer-disclaimer">
                {mode === "demo"
                  ? "Demo mode returns source excerpts. Connect an API key for AI-generated answers."
                  : "AI can make mistakes. Always check the original sources."}
              </p>
            </div>
          </>
        )}
        <footer className="app-footer">
          <span>
            folio <i> / </i> A little more clarity.
          </span>
          <span>
            POWERED BY RETRIEVAL-AUGMENTED GENERATION{" "}
            <span className="footer-dot" />
          </span>
        </footer>
      </main>
      {source && (
        <div className="modal-backdrop" onClick={() => setSource(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="source-title"
            className="source-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close source"
              onClick={() => setSource(null)}
            >
              <X size={20} />
            </button>
            <div className="page-eyebrow">ORIGINAL SOURCE EXCERPT</div>
            <h2 id="source-title">{source.name}</h2>
            <span className="source-page">
              Page {source.page} · Retrieval similarity{" "}
              {Math.round(source.score * 100)}%
            </span>
            <blockquote>{source.text}</blockquote>
            <p>
              Extracted text from your PDF. Similarity measures retrieval
              relevance, not factual confidence.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
