export function splitText(text: string, size = 1000, overlap = 180): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  const result: string[] = [];
  for (let i = 0; i < clean.length; i += size - overlap) {
    result.push(clean.slice(i, i + size));
    if (i + size >= clean.length) break;
  }
  return result;
}
export function localVector(text: string): number[] {
  const vector = Array<number>(512).fill(0);
  for (const token of text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []) {
    let h = 2166136261;
    for (const c of token) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    vector[(h >>> 0) % 512] += 1;
  }
  return vector;
}
export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0,
    aa = 0,
    bb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  return aa && bb ? dot / Math.sqrt(aa * bb) : 0;
}
