"use client";

import { cn } from "@/lib/utils";

const templates = [
  { id: 1, name: "Romántica Minimal", preview: "from-pink-200 to-rose-50" },
  { id: 2, name: "Honesta y Humana", preview: "from-amber-100 to-orange-50" },
  { id: 3, name: "Vibrante y Divertida", preview: "from-pink-400 to-yellow-300" },
  { id: 4, name: "Elegante Oscura", preview: "from-violet-950 to-fuchsia-900" }
] as const;

type Props = {
  value: number;
  onChange: (id: number) => void;
};

export function StoryTemplateSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {templates.map((template) => (
        <button
          key={template.id}
          type="button"
          onClick={() => onChange(template.id)}
          className={cn(
            "rounded-2xl border p-3 text-left transition-all",
            value === template.id ? "border-rose-500 ring-2 ring-rose-200" : "border-border"
          )}
        >
          <div className={cn("mb-2 h-24 rounded-xl bg-gradient-to-br", template.preview)} />
          <p className="text-sm font-semibold">Plantilla {template.id}</p>
          <p className="text-xs text-muted-foreground">{template.name}</p>
        </button>
      ))}
    </div>
  );
}
