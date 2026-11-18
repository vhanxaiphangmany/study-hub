"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Timer, Trophy, XCircle } from "lucide-react";
import type { QuizDetail } from "@/lib/api";

const COLORS = ["bg-red-500", "bg-blue-500", "bg-amber-400", "bg-green-500", "bg-purple-500", "bg-pink-500"];
const SHAPES = ["▲", "◆", "●", "■", "★", "⬟"];

function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const play = useCallback((freqs: number[], dur = 0.15) => {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = ctxRef.current;
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f;
        o.connect(g); g.connect(ctx.destination);
        const t = ctx.currentTime + i * (dur + 0.05);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.start(t); o.stop(t + dur + 0.05);
      });
    } catch {}
  }, []);
  return {
    correct: () => play([523, 659, 784], 0.18),
    wrong: () => play([220, 160], 0.25),
    tick: () => play([880], 0.05),
    finish: () => play([523, 587, 659, 784, 1047], 0.2),
  };
}

export default function QuizPlayer({ quiz, onExit }: { quiz: QuizDetail; onExit: () => void }) {
  const sound = useSound();
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(quiz.time_per_question);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);
  const q = quiz.questions[index];

  useEffect(() => { setTimeLeft(quiz.time_per_question); setPicked(null); }, [index, quiz.time_per_question]);

  useEffect(() => {
    if (done || picked !== null) return;
    if (timeLeft <= 0) { handlePick(null); return; }
    const t = setTimeout(() => {
      setTimeLeft((s) => s - 1);
      if (timeLeft <= 5) sound.tick();
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, picked, done]);

  const handlePick = (choice: number | null) => {
    if (picked !== null) return;
    setPicked(choice);
    const ok = choice !== null && choice === q.correct_index;
    if (ok) {
      const bonus = Math.round((timeLeft / quiz.time_per_question) * q.points);
      setScore((s) => s + q.points / 2 + bonus / 2);
      sound.correct();
    } else {
      sound.wrong();
    }
    setAnswers((a) => [...a, ok]);
    setTimeout(() => {
      if (index + 1 < quiz.questions.length) setIndex(index + 1);
      else { setDone(true); sound.finish(); }
    }, 1600);
  };

  if (done) {
    const correctCount = answers.filter(Boolean).length;
    const pct = quiz.questions.length ? Math.round((correctCount / quiz.questions.length) * 100) : 0;
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-slate-950 text-center p-6">
        <Trophy size={72} className="text-amber-400 mb-4" />
        <h1 className="text-3xl font-bold text-white">Quiz complete!</h1>
        <p className="mt-1 text-slate-400">{quiz.title}</p>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-slate-800 px-6 py-4">
            <p className="text-3xl font-extrabold text-sky-400">{score}</p><p className="text-xs text-slate-400 mt-1">points</p>
          </div>
          <div className="rounded-2xl bg-slate-800 px-6 py-4">
            <p className="text-3xl font-extrabold text-green-400">{correctCount}/{quiz.questions.length}</p><p className="text-xs text-slate-400 mt-1">correct</p>
          </div>
          <div className="rounded-2xl bg-slate-800 px-6 py-4">
            <p className="text-3xl font-extrabold text-amber-400">{pct}%</p><p className="text-xs text-slate-400 mt-1">accuracy</p>
          </div>
        </div>
        <button onClick={onExit} className="mt-8 rounded-xl bg-sky-600 px-8 py-3 font-semibold text-white hover:bg-sky-500">Back</button>
      </div>
    );
  }

  if (!q) return <div className="p-8 text-slate-300">This quiz has no questions yet.</div>;
  const revealed = picked !== null || timeLeft <= 0;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-slate-300">
        <span className="text-sm font-medium">Q {index + 1}/{quiz.questions.length}</span>
        <span className="text-sm font-medium text-sky-400">Score: {score}</span>
        <button onClick={onExit} className="text-xs rounded-lg border border-slate-700 px-3 py-1 hover:bg-slate-800">Exit</button>
      </div>
      {/* Timer bar */}
      <div className="px-4">
        <div className="flex items-center gap-3">
          <Timer size={20} className={timeLeft <= 5 ? "text-red-400" : "text-slate-400"} />
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 5 ? "bg-red-500" : "bg-sky-500"}`}
              style={{ width: `${(timeLeft / quiz.time_per_question) * 100}%` }} />
          </div>
          <span className="w-8 text-right font-mono text-lg text-white">{timeLeft}</span>
        </div>
      </div>
      {/* Question */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <h2 className="max-w-3xl text-center text-2xl font-bold text-white md:text-4xl">{q.text}</h2>
      </div>
      {/* Answers */}
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        {q.choices.map((c, i) => {
          const isCorrect = i === q.correct_index;
          const isPicked = i === picked;
          let cls = COLORS[i % COLORS.length];
          if (revealed) cls = isCorrect ? "bg-green-600 ring-4 ring-green-300" : isPicked ? "bg-red-700 opacity-80" : "bg-slate-700 opacity-50";
          return (
            <button key={i} disabled={picked !== null} onClick={() => handlePick(i)}
              className={`flex items-center gap-4 rounded-2xl px-5 py-4 text-left text-lg font-semibold text-white shadow-lg transition transform hover:scale-[1.02] disabled:hover:scale-100 ${cls}`}>
              <span className="text-2xl">{SHAPES[i % SHAPES.length]}</span>
              <span className="flex-1">{c}</span>
              {revealed && isCorrect && <CheckCircle2 />}
              {revealed && isPicked && !isCorrect && <XCircle />}
            </button>
          );
        })}
      </div>
      {/* Feedback banner */}
      {revealed && (
        <div className={`py-3 text-center text-lg font-bold text-white ${picked !== null && picked === q.correct_index ? "bg-green-600" : "bg-red-700"}`}>
          {picked === null ? "⏱ Time's up!" : picked === q.correct_index ? "✓ Correct!" : "✗ Wrong!"}
        </div>
      )}
    </div>
  );
}
