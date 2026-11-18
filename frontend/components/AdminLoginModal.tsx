"use client";
import { useState } from "react";
import { X, Lock } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminLoginModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api.login(username, password);
      onSuccess();
      onClose();
    } catch {
      setError("Invalid username or password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-slate-100"><Lock size={18} className="text-sky-400" /> Admin Login</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <label className="mb-3 block text-sm text-slate-300">Username
          <input autoFocus value={username} onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-sky-500" />
        </label>
        <label className="mb-4 block text-sm text-slate-300">Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-sky-500" />
        </label>
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={busy}
          className="w-full rounded-lg bg-sky-600 py-2 font-semibold text-white hover:bg-sky-500 disabled:opacity-50">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
