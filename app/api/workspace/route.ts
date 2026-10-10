import { NextResponse } from "next/server";
import { sessionId, readWorkspace, mutate } from "@/lib/store";
import { mode } from "@/lib/ai";
export const runtime = "nodejs";
export async function GET() {
  const w = await readWorkspace(await sessionId());
  return NextResponse.json({
    documents: w.documents,
    conversations: w.conversations,
    mode: mode(),
  });
}
export async function DELETE(req: Request) {
  const { kind, id } = await req.json();
  if (!["document", "conversation"].includes(kind) || typeof id !== "string")
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await mutate(await sessionId(), (w) => {
    if (kind === "document") {
      w.documents = w.documents.filter((d) => d.id !== id);
      w.chunks = w.chunks.filter((c) => c.documentId !== id);
      if (!w.documents.length) delete w.embeddingMode;
    } else w.conversations = w.conversations.filter((c) => c.id !== id);
  });
  return NextResponse.json({ ok: true });
}
