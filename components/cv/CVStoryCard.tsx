import React from "react";

type CVStoryCardProps = {
  name: string;
  city?: string;
  emotionalState?: string;
  lookingFor: string;
  greenFlags: string[];
  redFlags: string[];
  loveLanguages: string[];
  viewsCount: number;
  theme?: "romantico" | "calido" | "minimal" | "vibrante";
  showRedFlags?: boolean;
  watermark?: boolean;
};

export function CVStoryCard({
  name,
  city,
  emotionalState,
  lookingFor,
  greenFlags,
  redFlags,
  loveLanguages,
  viewsCount,
  showRedFlags = true,
  watermark = true
}: CVStoryCardProps) {
  return (
    <div className="aspect-[9/16] w-full rounded-3xl bg-gradient-to-b from-rose-100 to-white p-5 text-zinc-800 shadow-xl">
      <p className="text-xs uppercase tracking-[0.2em] text-rose-500">Currículum del Amor</p>
      <h3 className="mt-3 text-3xl font-bold">{name}</h3>
      <p className="text-sm text-zinc-600">{city ?? "Ciudad"} · {emotionalState ?? "Explorando"}</p>
      <p className="mt-4 text-lg font-medium text-rose-700">“{lookingFor}”</p>

      <section className="mt-5 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Green Flags</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {greenFlags.slice(0, 4).map((item) => <span key={item} className="rounded-full bg-emerald-100 px-2 py-1 text-xs">{item}</span>)}
          </div>
        </div>

        {showRedFlags ? (
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500">Red Flags</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {redFlags.slice(0, 4).map((item) => <span key={item} className="rounded-full bg-rose-100 px-2 py-1 text-xs">{item}</span>)}
            </div>
          </div>
        ) : null}

        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Idiomas del amor</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {loveLanguages.slice(0, 4).map((item) => <span key={item} className="rounded-full bg-violet-100 px-2 py-1 text-xs">{item}</span>)}
          </div>
        </div>
      </section>

      <div className="mt-auto pt-5 text-xs text-zinc-500">
        <p>Visto por {viewsCount} personas</p>
        {watermark ? <p className="mt-1">curriculumdelamor.app</p> : null}
      </div>
    </div>
  );
}
