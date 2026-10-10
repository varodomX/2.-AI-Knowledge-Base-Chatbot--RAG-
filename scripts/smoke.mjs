import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const base = process.argv[2] || "http://localhost:3000";
let cookie = "";
async function request(url, init = {}) {
  const response = await fetch(base + url, {
    ...init,
    headers: { ...init.headers, ...(cookie ? { cookie } : {}) },
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const body = await response.json();
  return { response, body };
}
const { body: workspace } = await request("/api/workspace");
assert.equal(
  workspace.mode,
  "demo",
  "Smoke test must run without an AI API key to avoid paid calls.",
);
const form = new FormData();
form.append(
  "file",
  new Blob([await readFile("public/sample-research.pdf")], {
    type: "application/pdf",
  }),
  "sample-research.pdf",
);
const { response: uploadResponse, body: doc } = await request("/api/upload", {
  method: "POST",
  body: form,
});
assert.equal(uploadResponse.status, 200, JSON.stringify(doc));
assert.equal(doc.pages, 2);
assert.ok(doc.chunks >= 2);
const { body: chat, response: chatResponse } = await request("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    question: "What was the revenue growth?",
    documentId: doc.id,
  }),
});
assert.equal(chatResponse.status, 200, JSON.stringify(chat));
assert.equal(chat.messages.length, 2);
assert.ok(
  chat.messages[1].sources.some(
    (s) => s.page === 1 && s.text.includes("24 percent"),
  ),
);
const other = await fetch(base + "/api/workspace").then((r) => r.json());
assert.equal(
  other.documents.length,
  0,
  "A new session must not see the first session documents.",
);
assert.equal(other.conversations.length, 0);
const { body: reloaded } = await request("/api/workspace");
assert.ok(reloaded.conversations.some((c) => c.id === chat.id));
await request("/api/workspace", {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ kind: "conversation", id: chat.id }),
});
await request("/api/workspace", {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ kind: "document", id: doc.id }),
});
const { body: deleted } = await request("/api/workspace");
assert.ok(!deleted.documents.some((d) => d.id === doc.id));
assert.ok(!deleted.conversations.some((c) => c.id === chat.id));
console.log(
  "PASS: PDF upload, page citations, retrieval, persistent history, session isolation, and deletion.",
);
