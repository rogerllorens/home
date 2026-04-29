"use client";

import { useMemo, useState } from "react";
import { CVStoryCard } from "./CVStoryCard";
import { StoryTemplateSelector } from "./StoryTemplateSelector";

type StoryPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  cv: {
    name: string;
    city?: string;
    emotionalState?: string;
    lookingFor: string;
    greenFlags: string[];
    redFlags: string[];
    loveLanguages: string[];
    viewsCount: number;
  };
};

export function StoryPreviewModal({ open, onClose, cv }: StoryPreviewModalProps) {
  const [templateId, setTemplateId] = useState(1);
  const [showRedFlags, setShowRedFlags] = useState(true);
  const [customText, setCustomText] = useState("");

  const payload = useMemo(
    () => ({
      template_id: templateId,
      customizations: {
        theme: "romantico",
        show_red_flags: showRedFlags,
        show_references: true,
        custom_text: customText || undefined
      },
      cv: {
        slug: "demo",
        name: cv.name,
        city: cv.city,
        emotional_state: cv.emotionalState,
        looking_for: cv.lookingFor,
        green_flags: cv.greenFlags,
        red_flags: cv.redFlags,
        love_languages: cv.loveLanguages,
        references: [],
        views_count: cv.viewsCount
      }
    }),
    [templateId, showRedFlags, customText, cv]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 rounded-3xl bg-white p-6 md:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Generar Imagen para Stories</h2>
          <StoryTemplateSelector value={templateId} onChange={setTemplateId} />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showRedFlags} onChange={(e) => setShowRedFlags(e.target.checked)} />
            Mostrar red flags
          </label>

          <input
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="Texto extra para la imagen"
          />

          <div className="flex gap-2">
            <button
              className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white"
              onClick={async () => {
                const res = await fetch("/api/generate-story-image", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload)
                });
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `story-template-${templateId}.png`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Generar y descargar
            </button>
            <button className="rounded-xl border px-4 py-2 text-sm" onClick={onClose}>Cerrar</button>
          </div>
        </div>

        <CVStoryCard
          name={cv.name}
          city={cv.city}
          emotionalState={cv.emotionalState}
          lookingFor={cv.lookingFor}
          greenFlags={cv.greenFlags}
          redFlags={cv.redFlags}
          loveLanguages={cv.loveLanguages}
          viewsCount={cv.viewsCount}
          showRedFlags={showRedFlags}
        />
      </div>
    </div>
  );
}
