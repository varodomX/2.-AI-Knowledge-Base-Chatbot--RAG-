import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import type { Workspace } from "./types";
const root = path.join(process.cwd(), ".data");
const locks = new Map<string, Promise<unknown>>();
export async function sessionId() {
  const jar = await cookies();
  let id = jar.get("folio-session")?.value;
  if (!id || !/^[a-f0-9-]{36}$/.test(id)) {
    id = randomUUID();
    jar.set("folio-session", id, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return id;
}
export async function readWorkspace(id: string): Promise<Workspace> {
  try {
    return JSON.parse(await readFile(path.join(root, `${id}.json`), "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    return { documents: [], chunks: [], conversations: [] };
  }
}
export async function mutate<T>(
  id: string,
  fn: (w: Workspace) => Promise<T> | T,
): Promise<T> {
  const previous = locks.get(id) || Promise.resolve();
  const work = previous
    .catch(() => {})
    .then(async () => {
      const w = await readWorkspace(id);
      const result = await fn(w);
      await mkdir(root, { recursive: true });
      const file = path.join(root, `${id}.json`),
        temp = `${file}.${randomUUID()}.tmp`;
      await writeFile(temp, JSON.stringify(w));
      await rename(temp, file);
      return result;
    });
  locks.set(id, work);
  try {
    return await work;
  } finally {
    if (locks.get(id) === work) locks.delete(id);
  }
}
