"use client";
import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown, Folder as FolderIcon, FolderOpen } from "lucide-react";
import type { Folder } from "@/lib/api";

function TreeNode({ folder, all, selectedId, onSelect, depth }: {
  folder: Folder; all: Folder[]; selectedId: string | null; onSelect: (id: string) => void; depth: number;
}) {
  const [open, setOpen] = useState(true);
  const children = useMemo(() => all.filter((f) => f.parent_id === folder.id), [all, folder.id]);
  const selected = selectedId === folder.id;
  return (
    <div>
      <button onClick={() => onSelect(folder.id)}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className={`flex w-full items-center gap-1.5 rounded-lg py-1.5 pr-2 text-sm transition ${selected ? "bg-sky-600/20 text-sky-300" : "text-slate-300 hover:bg-slate-800"}`}>
        <span onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="text-slate-500">
          {children.length ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="inline-block w-[14px]" />}
        </span>
        {selected ? <FolderOpen size={16} className="text-sky-400" /> : <FolderIcon size={16} className="text-amber-400" />}
        <span className="truncate">{folder.name}</span>
      </button>
      {open && children.map((c) => (
        <TreeNode key={c.id} folder={c} all={all} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function FolderTree({ folders, selectedId, onSelect }: {
  folders: Folder[]; selectedId: string | null; onSelect: (id: string | null) => void;
}) {
  const roots = folders.filter((f) => !f.parent_id);
  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto p-2">
      <button onClick={() => onSelect(null)}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm ${selectedId === null ? "bg-sky-600/20 text-sky-300" : "text-slate-300 hover:bg-slate-800"}`}>
        <FolderIcon size={16} className="text-sky-400" /> All files
      </button>
      {roots.map((f) => (
        <TreeNode key={f.id} folder={f} all={folders} selectedId={selectedId} onSelect={onSelect} depth={0} />
      ))}
      {roots.length === 0 && <p className="px-2 py-4 text-xs text-slate-500">No folders yet.</p>}
    </div>
  );
}
