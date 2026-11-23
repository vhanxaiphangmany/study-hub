"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowDownToLine, ArrowLeft, BookOpen, Check, ChevronRight, Clipboard, CloudUpload,
  FileImage, FileText, Folder, FolderPlus, GraduationCap, HardDrive, LockKeyhole,
  LogIn, LogOut, MonitorDown, NotebookPen, Play, Plus, QrCode, Search, Share2,
  Sparkles, Trash2, Upload, X,
} from "lucide-react";
import { api, getToken, type FileItem, type Folder as FolderType, type Note, type QuizSummary } from "@/lib/api";
import FolderTree from "@/components/FolderTree";
import ShareButton from "@/components/ShareButton";
import AdminLoginModal from "@/components/AdminLoginModal";
import Link from "next/link";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const card = "rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,.045)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,.09)]";
const primaryButton = "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200";
const iconButton = "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700";

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [noteDraft, setNoteDraft] = useState({ title: "", content: "" });
  const [editingNote, setEditingNote] = useState(false);
  const [quizModal, setQuizModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [siteShareOpen, setSiteShareOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setIsAdmin(!!getToken());
    const onPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [f, fl, n, q] = await Promise.all([
        api.folders.tree(), api.files.list(currentFolder), api.notes.list(currentFolder), api.quizzes.list(),
      ]);
      setFolders(f); setFiles(fl); setNotes(n); setQuizzes(q);
    } catch (error) { console.error("Could not load StudyHub content", error); }
  }, [currentFolder]);
  useEffect(() => { refresh(); }, [refresh]);

  const currentFolderData = folders.find((folder) => folder.id === currentFolder);
  const childFolders = useMemo(() => folders.filter((folder) => folder.parent_id === currentFolder), [folders, currentFolder]);
  const visibleFiles = files.filter((file) => file.name.toLowerCase().includes(query.toLowerCase()));
  const visibleNotes = notes.filter((note) => note.title.toLowerCase().includes(query.toLowerCase()));
  const visibleQuizzes = quizzes.filter((quiz) => quiz.title.toLowerCase().includes(query.toLowerCase()));
  const totalItems = childFolders.length + visibleFiles.length + visibleNotes.length + visibleQuizzes.length;

  const createFolder = async () => {
    const name = prompt("ชื่อโฟลเดอร์ / Folder name:");
    if (!name?.trim()) return;
    await api.folders.create(name.trim(), currentFolder);
    await refresh();
  };
  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files;
    if (!selected?.length) return;
    setBusy(true);
    try { for (const file of Array.from(selected)) await api.files.upload(currentFolder, file); await refresh(); }
    finally { setBusy(false); event.target.value = ""; }
  };
  const deleteFile = async (id: string) => { if (confirm("Delete this file?")) { await api.files.remove(id); await refresh(); } };
  const deleteFolder = async () => {
    if (!currentFolder || !confirm(`Delete folder “${currentFolderData?.name ?? ""}” and its contents?`)) return;
    await api.folders.remove(currentFolder); setCurrentFolder(null); await refresh();
  };
  const saveNote = async () => {
    if (!noteDraft.title.trim()) return;
    if (activeNote) setActiveNote(await api.notes.update(activeNote.id, noteDraft));
    else setActiveNote(await api.notes.create(noteDraft.title, noteDraft.content, currentFolder));
    setEditingNote(false); await refresh();
  };
  const deleteNote = async (id: string) => {
    if (!confirm("Delete this note?")) return;
    await api.notes.remove(id); if (activeNote?.id === id) setActiveNote(null); await refresh();
  };
  const deleteQuiz = async (id: string) => { if (confirm("Delete this quiz?")) { await api.quizzes.remove(id); await refresh(); } };
  const launchInstall = async () => {
    if (!installPrompt) { setInstallOpen(true); return; }
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };
  const startNewNote = () => { setActiveNote(null); setNoteDraft({ title: "", content: "" }); setEditingNote(true); };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <button onClick={() => setCurrentFolder(null)} className="flex items-center gap-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-200"><BookOpen size={21} /></span>
            <span><span className="block text-lg font-extrabold tracking-tight text-slate-900">StudyHub</span><span className="hidden text-[11px] font-medium text-slate-500 sm:block">Your space to learn & play</span></span>
          </button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button onClick={launchInstall} title="Install StudyHub on your device" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-2.5 text-sm font-bold text-amber-950 shadow-sm shadow-orange-100 transition hover:-translate-y-0.5 hover:shadow-md sm:px-4"><MonitorDown size={17} /><span>Install App <span className="hidden sm:inline">(โหลดติดเครื่อง)</span></span></button>
            <button onClick={() => setSiteShareOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 sm:px-4"><Share2 size={17} /><span>Share Site / QR <span className="hidden sm:inline">(แชร์เว็บ & QR Code)</span></span></button>
            {isAdmin ? <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2"><span className="hidden text-sm font-bold text-emerald-800 sm:inline">Admin Mode (Active)</span><span className="text-xs font-bold text-emerald-800 sm:hidden">Admin Active</span><button aria-label="Log out" title="Log out" onClick={() => { api.logout(); setIsAdmin(false); }} className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"><LogOut size={16} /></button></div> : <button onClick={() => setLoginOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 sm:px-4"><LogIn size={16} /><span>Admin Login</span></button>}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-65px)] border-r border-slate-200 bg-white px-4 py-6 lg:block">
          <div className="mb-5 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-4 text-white shadow-lg shadow-indigo-100">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/20"><Sparkles size={18} /></div>
            <p className="text-sm font-bold">A little progress every day.</p><p className="mt-1 text-xs text-indigo-100">Keep your ideas and learning together.</p>
          </div>
          <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[.16em] text-slate-400">Library</p>
          <FolderTree folders={folders} selectedId={currentFolder} onSelect={setCurrentFolder} />
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <section className="relative mb-6 overflow-hidden rounded-[28px] bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-100 sm:p-8">
            <div className="relative z-10 max-w-2xl">
              <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-indigo-50"><Sparkles size={13} /> YOUR PERSONAL LEARNING SPACE</p>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Learn something. <span className="text-amber-300">Play to remember.</span></h1>
              <p className="mt-2 max-w-lg text-sm leading-6 text-indigo-100">Organize your notes, files and quizzes in one joyful place.</p>
              <div className="mt-5 flex flex-wrap items-center gap-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input aria-label="Search this folder" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this folder..." className="w-64 rounded-xl border border-white/20 bg-white px-10 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-white/20" /></div><span className="text-xs font-medium text-indigo-100">{totalItems} items in this view</span></div>
            </div>
            <div className="pointer-events-none absolute -right-8 -top-16 h-64 w-64 rounded-full border-[36px] border-white/10" /><div className="pointer-events-none absolute bottom-[-100px] right-40 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
          </section>

          {isAdmin && <section aria-label="Admin actions" className="mb-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-extrabold text-slate-900">Quick actions</p><p className="text-xs text-slate-500">Add something new to your study space</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">ADMIN</span></div><div className="grid grid-cols-2 gap-2 lg:grid-cols-4"><button onClick={createFolder} className="flex min-h-[76px] items-center gap-3 rounded-xl bg-amber-50 px-3 text-left text-amber-800 transition hover:bg-amber-100"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white"><FolderPlus size={20} /></span><span><span className="block text-sm font-bold">+ New Folder</span><span className="hidden text-[11px] text-amber-700 sm:block">สร้างโฟลเดอร์</span></span></button><label className="flex min-h-[76px] cursor-pointer items-center gap-3 rounded-xl bg-sky-50 px-3 text-left text-sky-800 transition hover:bg-sky-100"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white"><CloudUpload size={20} /></span><span><span className="block text-sm font-bold">+ Upload File</span><span className="hidden text-[11px] text-sky-700 sm:block">อัปโหลด PDF/รูป/วิดีโอ</span></span><input type="file" multiple className="hidden" onChange={uploadFile} /></label><button onClick={startNewNote} className="flex min-h-[76px] items-center gap-3 rounded-xl bg-emerald-50 px-3 text-left text-emerald-800 transition hover:bg-emerald-100"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white"><NotebookPen size={20} /></span><span><span className="block text-sm font-bold">+ Write Note</span><span className="hidden text-[11px] text-emerald-700 sm:block">เขียนโน้ตสรุป</span></span></button><button onClick={() => setQuizModal(true)} className="flex min-h-[76px] items-center gap-3 rounded-xl bg-fuchsia-50 px-3 text-left text-fuchsia-800 transition hover:bg-fuchsia-100"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white"><GraduationCap size={20} /></span><span><span className="block text-sm font-bold">+ Create Quiz</span><span className="hidden text-[11px] text-fuchsia-700 sm:block">สร้างควิซ Kahoot</span></span></button></div>{busy && <p className="mt-3 text-xs font-semibold text-sky-700">Uploading files…</p>}</section>}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm text-slate-500"><button onClick={() => setCurrentFolder(null)} className="font-medium hover:text-indigo-700">My Library</button>{currentFolderData && <><ChevronRight size={15} /><span className="font-bold text-slate-900">{currentFolderData.name}</span></>}</div>{currentFolder && <div className="flex gap-2"><ShareButton path={`/share/folder/${currentFolder}`} title={currentFolderData?.name} />{isAdmin && <button onClick={deleteFolder} className={iconButton} aria-label="Delete folder"><Trash2 size={16} /></button>}</div>}</div>
          <div className="mb-5 flex items-center gap-2 lg:hidden"><Folder size={16} className="text-indigo-500" /><select aria-label="Choose folder" value={currentFolder ?? ""} onChange={(event) => setCurrentFolder(event.target.value || null)} className="max-w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">All folders</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></div>

          {childFolders.length > 0 && <section className="mb-8"><SectionTitle icon={<Folder size={17} />} title="Folders" count={childFolders.length} /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{childFolders.map((folder, index) => <article key={folder.id} className={`${card} flex items-center gap-3 p-4`}><button onClick={() => setCurrentFolder(folder.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left"><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${index % 3 === 0 ? "bg-amber-100 text-amber-600" : index % 3 === 1 ? "bg-sky-100 text-sky-600" : "bg-violet-100 text-violet-600"}`}><Folder size={24} fill="currentColor" strokeWidth={1.5} /></span><span className="min-w-0"><span className="block truncate font-bold text-slate-800">{folder.name}</span><span className="text-xs text-slate-500">Open folder</span></span></button><ShareButton path={`/share/folder/${folder.id}`} title={folder.name} /></article>)}</div></section>}

          {visibleFiles.length > 0 && <section className="mb-8"><SectionTitle icon={<HardDrive size={17} />} title="Files" count={visibleFiles.length} /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visibleFiles.map((file) => <FileCard key={file.id} file={file} isAdmin={isAdmin} onDelete={() => deleteFile(file.id)} />)}</div></section>}

          {visibleNotes.length > 0 && <section className="mb-8"><SectionTitle icon={<NotebookPen size={17} />} title="Notes" count={visibleNotes.length} /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visibleNotes.map((note) => <article key={note.id} className={`${card} flex min-h-[160px] flex-col p-4`}><div className="mb-3 flex items-start justify-between"><span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-emerald-700"><NotebookPen size={13} /> NOTE</span>{isAdmin && <button onClick={() => deleteNote(note.id)} className={iconButton} aria-label="Delete note"><Trash2 size={15} /></button>}</div><button onClick={() => { setActiveNote(note); setNoteDraft({ title: note.title, content: note.content }); setEditingNote(false); }} className="flex-1 text-left"><h3 className="font-bold text-slate-900">{note.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-500">{note.content || "Open note to read the summary."}</p></button><button onClick={() => { setActiveNote(note); setNoteDraft({ title: note.title, content: note.content }); setEditingNote(false); }} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-900"><BookOpen size={15} /> View note</button></article>)}</div></section>}

          {visibleQuizzes.length > 0 && <section className="mb-8"><SectionTitle icon={<GraduationCap size={18} />} title="Quizzes" count={visibleQuizzes.length} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleQuizzes.map((quiz, index) => <QuizCard key={quiz.id} quiz={quiz} index={index} onDelete={() => deleteQuiz(quiz.id)} isAdmin={isAdmin} />)}</div></section>}

          {totalItems === 0 && <section className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm"><div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-to-br from-indigo-100 via-sky-100 to-fuchsia-100 text-indigo-600"><BookOpen size={36} /></div><h2 className="text-xl font-extrabold text-slate-900">This folder is empty</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Log in as Admin to add study materials or quizzes! Your files, notes and fun challenges will show up here.</p>{!isAdmin && <button onClick={() => setLoginOpen(true)} className={`${primaryButton} mt-5`}><LockKeyhole size={16} /> Admin Login</button>}{isAdmin && <button onClick={createFolder} className={`${primaryButton} mt-5`}><Plus size={17} /> Create your first folder</button>}</section>}
        </main>
      </div>

      <AdminLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={() => setIsAdmin(true)} />
      {quizModal && <QuizCreateModal onClose={() => setQuizModal(false)} onCreated={() => { setQuizModal(false); refresh(); }} />}
      {(activeNote || editingNote) && <NoteModal note={activeNote} draft={noteDraft} editing={editingNote} onDraft={setNoteDraft} onEdit={() => { setNoteDraft({ title: activeNote?.title ?? "", content: activeNote?.content ?? "" }); setEditingNote(true); }} onClose={() => { setActiveNote(null); setEditingNote(false); }} onSave={saveNote} />}
      {siteShareOpen && <ShareModal url={typeof window === "undefined" ? "" : window.location.href} onClose={() => setSiteShareOpen(false)} />}
      {installOpen && <InstallHelpModal onClose={() => setInstallOpen(false)} />}
    </div>
  );
}

function SectionTitle({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-800">{icon}<span>{title}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{count}</span></h2></div>;
}

function FileCard({ file, isAdmin, onDelete }: { file: FileItem; isAdmin: boolean; onDelete: () => void }) {
  const ext = file.name.split(".").pop()?.toUpperCase() ?? "FILE";
  const image = file.content_type?.startsWith("image/");
  const badge = image ? "IMG" : ext === "PDF" ? "PDF" : ext.length > 5 ? "FILE" : ext;
  const fileUrl = file.file_url || `/storage/${encodeURIComponent(file.object_name)}`;
  const downloadUrl = `/api/files/${file.id}/download`;
  return <article className={`${card} flex min-h-[176px] flex-col p-4`}><div className="mb-3 flex items-start justify-between"><span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-extrabold tracking-wider ${image ? "bg-violet-50 text-violet-700" : badge === "PDF" ? "bg-rose-50 text-rose-700" : "bg-sky-50 text-sky-700"}`}>{image ? <FileImage size={13} /> : <FileText size={13} />}{badge}</span>{isAdmin && <button onClick={onDelete} className={iconButton} aria-label="Delete file"><Trash2 size={15} /></button>}</div><div className="flex flex-1 items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><FileText size={22} /></span><div className="min-w-0"><h3 className="truncate font-bold text-slate-800" title={file.name}>{file.name}</h3><p className="mt-1 text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p></div></div><div className="mt-4 flex items-center gap-2"><a href={fileUrl} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} className="relative z-10 inline-flex min-h-11 flex-1 touch-manipulation cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"><BookOpen size={14} /> View</a><a href={downloadUrl} onClick={(event) => event.stopPropagation()} className="relative z-10 inline-flex min-h-11 flex-1 touch-manipulation cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"><ArrowDownToLine size={14} /> Download</a></div></article>;
}

function QuizCard({ quiz, index, isAdmin, onDelete }: { quiz: QuizSummary; index: number; isAdmin: boolean; onDelete: () => void }) {
  const themes = ["from-violet-600 via-purple-600 to-indigo-700", "from-sky-500 via-blue-600 to-indigo-700", "from-fuchsia-600 via-purple-600 to-violet-700", "from-indigo-600 via-blue-600 to-cyan-600"];
  return <article className={`relative flex min-h-[220px] flex-col overflow-hidden rounded-[22px] bg-gradient-to-br ${themes[index % themes.length]} p-5 text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-1 hover:shadow-xl`}><div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border-[22px] border-white/10" /><div className="relative flex items-start justify-between"><span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-extrabold tracking-[.16em] text-white/90">QUICK PLAY</span>{isAdmin && <button onClick={onDelete} className="rounded-lg bg-white/15 p-2 text-white hover:bg-white/25" aria-label="Delete quiz"><Trash2 size={15} /></button>}</div><div className="relative mt-5 flex-1"><div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-300 text-violet-950 shadow-md"><GraduationCap size={22} /></div><h3 className="line-clamp-2 text-lg font-extrabold leading-snug">{quiz.title}</h3><p className="mt-1 text-xs font-medium text-white/75">{quiz.question_count} questions · {quiz.time_per_question}s each</p></div><div className="relative mt-4 flex items-center gap-2"><Link href={`/share/quiz/${quiz.id}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-extrabold text-violet-700 transition hover:bg-amber-200 hover:text-violet-950"><Play size={16} fill="currentColor" /> Play Quiz</Link><ShareButton path={`/share/quiz/${quiz.id}`} title={quiz.title} /></div></article>;
}

function ShareModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  const download = () => {
    const svg = document.getElementById("site-share-qr"); if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "studyhub-site-qr.svg"; link.click(); URL.revokeObjectURL(link.href);
  };
  return <ModalShell onClose={onClose}><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">SPREAD THE WORD</p><h2 className="mt-1 text-xl font-extrabold text-slate-900">Share StudyHub</h2></div><button onClick={onClose} className={iconButton} aria-label="Close"><X size={18} /></button></div><p className="mb-4 text-sm text-slate-500">Send your learning space to a friend or scan the code to open it on another device.</p><div className="mx-auto mb-4 flex w-fit rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"><QRCodeSVG id="site-share-qr" value={url} size={216} level="H" includeMargin /></div><div className="mb-4 break-all rounded-xl bg-slate-50 px-3 py-2.5 text-center text-xs font-medium text-slate-600">{url}</div><div className="grid grid-cols-2 gap-2"><button onClick={copy} className={primaryButton}>{copied ? <Check size={16} /> : <Clipboard size={16} />}{copied ? "Copied!" : "Copy Link"}</button><button onClick={download} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><QrCode size={16} /> Download QR</button></div></ModalShell>;
}

function InstallHelpModal({ onClose }: { onClose: () => void }) {
  const isIOS = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  return <ModalShell onClose={onClose}><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">STUDYHUB ON THE GO</p><h2 className="mt-1 text-xl font-extrabold text-slate-900">Install the app</h2></div><button onClick={onClose} className={iconButton} aria-label="Close"><X size={18} /></button></div><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><MonitorDown size={27} /></div><p className="text-sm leading-6 text-slate-600">{isIOS ? "On iPhone or iPad, open this page in Safari, tap the Share button, then choose “Add to Home Screen”." : "Your browser did not offer one-tap installation. Open the browser menu and choose “Install app” or “Add to Home Screen”."}</p><div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">{isIOS ? "Safari → Share ↗ → Add to Home Screen" : "Browser menu ⋮ → Install app"}</div><button onClick={onClose} className={`${primaryButton} mt-5 w-full`}>Got it</button></ModalShell>;
}

function NoteModal({ note, draft, editing, onDraft, onEdit, onClose, onSave }: { note: Note | null; draft: { title: string; content: string }; editing: boolean; onDraft: (draft: { title: string; content: string }) => void; onEdit: () => void; onClose: () => void; onSave: () => void }) {
  return <ModalShell onClose={onClose}><div className="mb-4 flex items-center justify-between"><span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-emerald-700">NOTE</span><button onClick={onClose} className={iconButton} aria-label="Close"><X size={18} /></button></div>{editing ? <><input autoFocus value={draft.title} onChange={(event) => onDraft({ ...draft, title: event.target.value })} placeholder="Note title" className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-lg font-bold outline-none focus:border-indigo-400" /><textarea value={draft.content} onChange={(event) => onDraft({ ...draft, content: event.target.value })} placeholder="Write your study summary in Markdown..." rows={12} className="w-full resize-y rounded-xl border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-indigo-400" /><button onClick={onSave} disabled={!draft.title.trim()} className={`${primaryButton} mt-3 w-full disabled:opacity-50`}>Save note</button></> : <><h2 className="text-2xl font-extrabold text-slate-900">{note?.title}</h2><article className="prose prose-slate mt-4 max-h-[60vh] max-w-none overflow-y-auto text-sm"><ReactMarkdown>{note?.content ?? ""}</ReactMarkdown></article><button onClick={onEdit} className="mt-5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Edit note</button></>}</ModalShell>;
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[26px] border border-white/70 bg-white p-5 shadow-2xl sm:p-6">{children}</div></div>;
}

function QuizCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timePerQuestion, setTimePerQuestion] = useState(20);
  const [questions, setQuestions] = useState([{ text: "", choices: ["", "", "", ""], correct_index: 0 }]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const updateQ = (index: number, patch: Partial<(typeof questions)[0]>) => setQuestions(questions.map((question, i) => i === index ? { ...question, ...patch } : question));
  const submit = async () => {
    setError(""); setBusy(true);
    try { await api.quizzes.create({ title, description: description || null, time_per_question: timePerQuestion, is_published: true, questions: questions.map((question) => ({ ...question, choices: question.choices.filter((choice) => choice.trim()) })) }); onCreated(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create quiz"); }
    finally { setBusy(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm" onClick={onClose}><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[26px] border border-white/70 bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-fuchsia-600">KAHOOT-STYLE CHALLENGE</p><h2 className="mt-1 flex items-center gap-2 text-xl font-extrabold text-slate-900"><GraduationCap className="text-violet-600" /> Create a Quiz</h2></div><button onClick={onClose} className={iconButton}><X size={18} /></button></div><input placeholder="Quiz title" value={title} onChange={(event) => setTitle(event.target.value)} className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-semibold outline-none focus:border-indigo-400" /><div className="mb-4 flex gap-2"><input placeholder="Description (optional)" value={description} onChange={(event) => setDescription(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" /><label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-500">sec/Q<input type="number" min={5} value={timePerQuestion} onChange={(event) => setTimePerQuestion(Number(event.target.value))} className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-slate-800" /></label></div>{questions.map((question, index) => <div key={index} className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="mb-2 flex gap-2"><span className="pt-2 text-xs font-extrabold text-slate-400">Q{index + 1}</span><input placeholder="Question text" value={question.text} onChange={(event) => updateQ(index, { text: event.target.value })} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400" />{questions.length > 1 && <button onClick={() => setQuestions(questions.filter((_, i) => i !== index))} className="text-rose-500"><Trash2 size={16} /></button>}</div>{question.choices.map((choice, choiceIndex) => <label key={choiceIndex} className="mb-1 flex items-center gap-2"><input type="radio" name={`correct-${index}`} checked={question.correct_index === choiceIndex} onChange={() => updateQ(index, { correct_index: choiceIndex })} /><input placeholder={`Answer ${choiceIndex + 1}`} value={choice} onChange={(event) => { const choices = [...question.choices]; choices[choiceIndex] = event.target.value; updateQ(index, { choices }); }} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-violet-400" /></label>)}</div>)}<button onClick={() => setQuestions([...questions, { text: "", choices: ["", "", "", ""], correct_index: 0 }])} className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-indigo-700"><Plus size={16} /> Add question</button>{error && <p className="mb-3 rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{error}</p>}<button onClick={submit} disabled={busy || !title.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 py-3 font-bold text-white shadow-lg shadow-violet-100 disabled:opacity-50">{busy ? "Creating..." : <><GraduationCap size={18} /> Create Quiz</>}</button></div></div>;
}
