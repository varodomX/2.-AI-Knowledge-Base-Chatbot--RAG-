import { test } from "node:test";
import assert from "node:assert/strict";
import { cosine, localVector, splitText } from "../lib/retrieval";
test("chunks cover text and preserve overlap", () => {
  const text = "a".repeat(2500);
  const parts = splitText(text);
  assert.deepEqual(
    parts.map((p) => p.length),
    [1000, 1000, 860],
  );
  assert.equal(parts.join("").length - 360, text.length);
  assert.deepEqual(splitText("  "), []);
});
test("cosine ranks related text above unrelated text", () => {
  const q = localVector("revenue growth");
  assert.ok(
    cosine(q, localVector("revenue growth increased")) >
      cosine(q, localVector("employee vacation policy")),
  );
  assert.ok(Math.abs(cosine(q, q) - 1) < 1e-10);
  assert.equal(cosine(q, Array(512).fill(0)), 0);
  assert.equal(cosine([1], [1, 2]), 0);
});
