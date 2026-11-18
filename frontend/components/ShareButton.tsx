"use client";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Share2, X, Copy, Download, Check } from "lucide-react";

export default function ShareButton({ path, title }: { path: string; title?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const svg = document.getElementById("share-qr-svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qr-${(title ?? "share").replace(/\W+/g, "-").toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} title="Share"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700 transition">
        <Share2 size={16} /> Share
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-100">Share {title ? `“${title}”` : ""}</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="inline-block rounded-xl bg-white p-4">
              <QRCodeSVG id="share-qr-svg" value={url} size={192} level="M" includeMargin />
            </div>
            <p className="mt-4 break-all rounded-lg bg-slate-800 px-3 py-2 text-xs text-sky-300">{url}</p>
            <div className="mt-4 flex justify-center gap-2">
              <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500">
                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied!" : "Copy link"}
              </button>
              <button onClick={download} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800">
                <Download size={16} /> QR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
