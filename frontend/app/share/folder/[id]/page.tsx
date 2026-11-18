"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { File as FileIcon, FileText, Download, Folder, ArrowLeft, Home } from "lucide-react";
import { api, type Folder as FolderType, type FileItem, type Note } from "@/lib/api";
import ShareButton from "@/components/ShareButton";
import { Suspense } from "react";

export default function ShareFolderPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-slate-500">Loading…</div>}>
      <FolderView params={params} />
    </Suspense>
  );
}

function FolderView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [folder, setFolder] = useState<FolderType | null>(null);
  const [subfolders, setSubfolders] = useState<FolderType[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [f, subs, fl, n] = await Promise.all([
        api.folders.get(id), api.folders.children(id), api.files.list(id), api.notes.list(id),
      ]);
      setFolder(f); setSubfolders(subs); setFiles(fl); setNotes(n);
    } catch { setError("Folder not found or backend unavailable."); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (error) return <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-300"><p>{error}</p><Link href="/" className="text-sky-400">← Back home</Link></div>;
  if (!folder) return <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-500">Loading…</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="text-slate-500 hover:text-white"><Home size={18} /></Link>
          <Folder size={22} className="text-amber-400 shrink-0" />
          <h1 className="truncate text-lg font-semibold">{folder.name}</h1>
        </div>
        <ShareButton path={`/share/folder/${folder.id}`} title={folder.name} />
      </header>
      <main className="mx-auto max-w-4xl p-4 md:p-6">
        {folder.description && <p className="mb-4 text-slate-400">{folder.description}</p>}

        {subfolders.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Folders</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {subfolders.map((s) => (
                <li key={s.id}>
                  <Link href={`/share/folder/${s.id}`} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3 hover:border-sky-700">
                    <Folder size={18} className="text-amber-400" /><span className="truncate">{s.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Files</h2>
          {files.length === 0 ? <p className="text-sm text-slate-600">No files.</p> : (
            <ul className="space-y-2">
              {files.map((f) => (
                <li key={f.id} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3">
                  <FileIcon size={18} className="shrink-0 text-sky-400" />
                  <button onClick={async () => window.open((await api.files.preview(f.id)).url, "_blank")}
                    className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:text-sky-300">{f.name}</button>
                  <a href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/files/${f.id}/download`}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-white"><Download size={16} /></a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Notes</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            <ul className="space-y-2">
              {notes.map((n) => (
                <li key={n.id}>
                  <button onClick={() => setActiveNote(n)}
                    className="flex w-full items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3 text-left hover:border-emerald-700">
                    <FileText size={18} className="text-emerald-400" /><span className="truncate text-sm">{n.title}</span>
                  </button>
                </li>
              ))}
              {notes.length === 0 && <p className="text-sm text-slate-600">No notes.</p>}
            </ul>
            {activeNote && (
              <article className="prose prose-invert prose-sm max-w-none rounded-xl border border-slate-800 bg-slate-900 p-4 text-slate-300">
                <h3 className="text-slate-100">{activeNote.title}</h3>
                <ReactMarkdown>{activeNote.content}</ReactMarkdown>
              </article>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
