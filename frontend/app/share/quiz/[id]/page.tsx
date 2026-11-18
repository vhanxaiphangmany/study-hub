"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Home, Play, Timer, ListChecks } from "lucide-react";
import { api, type QuizDetail } from "@/lib/api";
import ShareButton from "@/components/ShareButton";
import QuizPlayer from "@/components/QuizPlayer";
import { Suspense } from "react";

export default function ShareQuizPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-slate-500">Loading…</div>}>
      <QuizView params={params} />
    </Suspense>
  );
}

function QuizView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    api.quizzes.get(id).then(setQuiz).catch(() => setError("Quiz not found or backend unavailable."));
  }, [id]);

  if (playing && quiz) return <QuizPlayer quiz={quiz} onExit={() => setPlaying(false)} />;

  if (error) return <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-300"><p>{error}</p><Link href="/" className="text-sky-400">← Back home</Link></div>;
  if (!quiz) return <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-500">Loading…</div>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-slate-100">
      <Link href="/" className="absolute left-4 top-4 text-slate-500 hover:text-white"><Home size={20} /></Link>
      <div className="absolute right-4 top-4"><ShareButton path={`/share/quiz/${quiz.id}`} title={quiz.title} /></div>

      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-fuchsia-950/30 p-8 shadow-2xl">
        <GraduationCap size={64} className="mx-auto text-fuchsia-400" />
        <h1 className="mt-4 text-3xl font-extrabold">{quiz.title}</h1>
        {quiz.description && <p className="mt-2 text-slate-400">{quiz.description}</p>}
        <div className="mt-6 flex justify-center gap-6 text-sm text-slate-400">
          <span className="flex items-center gap-1.5"><ListChecks size={16} /> {quiz.questions.length} questions</span>
          <span className="flex items-center gap-1.5"><Timer size={16} /> {quiz.time_per_question}s each</span>
        </div>
        <button onClick={() => setPlaying(true)}
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-fuchsia-600 px-10 py-4 text-xl font-bold text-white shadow-lg shadow-fuchsia-900/40 transition hover:scale-105 hover:bg-fuchsia-500">
          <Play size={24} fill="currentColor" /> PLAY
        </button>
      </div>
    </div>
  );
}
