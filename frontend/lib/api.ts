// Same-origin API requests are proxied by Next.js, including through the public frontend tunnel.
export const API_URL = "";

export type Folder = { id: string; name: string; parent_id: string | null; description: string | null };
export type FileItem = { id: string; folder_id: string | null; name: string; object_name: string; content_type: string | null; size: number };
export type Note = { id: string; folder_id: string | null; title: string; content: string };
export type QuizSummary = { id: string; title: string; description: string | null; time_per_question: number; is_published: boolean; question_count: number };
export type Question = { id: string; position: number; text: string; choices: string[]; correct_index: number; points: number };
export type QuizDetail = { id: string; title: string; description: string | null; time_per_question: number; is_published: boolean; questions: Question[] };

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("studyhub_token");
}
export function setToken(t: string | null) {
  if (t) localStorage.setItem("studyhub_token", t);
  else localStorage.removeItem("studyhub_token");
}

async function req<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (!(init.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (auth) {
    const t = getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  login: async (username: string, password: string) => {
    const body = new URLSearchParams({ username, password });
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) throw new Error("Invalid credentials");
    const data = await res.json();
    setToken(data.access_token);
    return data.access_token as string;
  },
  logout: () => setToken(null),
  folders: {
    tree: () => req<Folder[]>("/api/folders/tree"),
    children: (parentId: string | null) => req<Folder[]>(`/api/folders?${parentId ? `parent_id=${parentId}` : ""}`),
    get: (id: string) => req<Folder>(`/api/folders/${id}`),
    create: (name: string, parent_id: string | null, description?: string) =>
      req<Folder>("/api/folders", { method: "POST", body: JSON.stringify({ name, parent_id, description }) }, true),
    remove: (id: string) => req<{ ok: boolean }>(`/api/folders/${id}`, { method: "DELETE" }, true),
  },
  files: {
    list: (folderId: string | null) => req<FileItem[]>(`/api/files?${folderId ? `folder_id=${folderId}` : ""}`),
    upload: (folderId: string | null, file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return req<FileItem>(`/api/files/upload${folderId ? `?folder_id=${folderId}` : ""}`, { method: "POST", body: fd }, true);
    },
    preview: (id: string) => req<{ url: string; content_type: string | null; name: string }>(`/api/files/${id}/preview`),
    remove: (id: string) => req<{ ok: boolean }>(`/api/files/${id}`, { method: "DELETE" }, true),
  },
  notes: {
    list: (folderId: string | null) => req<Note[]>(`/api/notes?${folderId ? `folder_id=${folderId}` : ""}`),
    create: (title: string, content: string, folder_id: string | null) =>
      req<Note>("/api/notes", { method: "POST", body: JSON.stringify({ title, content, folder_id }) }, true),
    update: (id: string, patch: Partial<Note>) =>
      req<Note>(`/api/notes/${id}`, { method: "PATCH", body: JSON.stringify(patch) }, true),
    remove: (id: string) => req<{ ok: boolean }>(`/api/notes/${id}`, { method: "DELETE" }, true),
  },
  quizzes: {
    list: () => req<QuizSummary[]>("/api/quizzes"),
    get: (id: string) => req<QuizDetail>(`/api/quizzes/${id}`),
    create: (data: unknown) => req<QuizDetail>("/api/quizzes", { method: "POST", body: JSON.stringify(data) }, true),
    update: (id: string, data: unknown) => req<QuizDetail>(`/api/quizzes/${id}`, { method: "PATCH", body: JSON.stringify(data) }, true),
    remove: (id: string) => req<{ ok: boolean }>(`/api/quizzes/${id}`, { method: "DELETE" }, true),
  },
};
