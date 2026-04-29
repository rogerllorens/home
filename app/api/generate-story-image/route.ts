import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { z } from "zod";

export const runtime = "edge";

const generateStoryImageSchema = z.object({
  cv_id: z.string().uuid().optional(),
  template_id: z.number().int().min(1).max(4),
  customizations: z
    .object({
      theme: z.enum(["romantico", "calido", "minimal", "vibrante"]).default("romantico"),
      show_red_flags: z.boolean().default(true),
      show_references: z.boolean().default(true),
      custom_text: z.string().max(80).optional(),
      remove_watermark: z.boolean().default(false)
    })
    .default({
      theme: "romantico",
      show_red_flags: true,
      show_references: true,
      remove_watermark: false
    }),
  cv: z
    .object({
      slug: z.string().min(3),
      name: z.string().min(2).max(80),
      alias: z.string().max(80).optional(),
      city: z.string().max(80).optional(),
      emotional_state: z.string().max(60).optional(),
      looking_for: z.string().min(3).max(180),
      green_flags: z.array(z.string().max(40)).default([]),
      red_flags: z.array(z.string().max(40)).default([]),
      love_languages: z.array(z.string().max(40)).default([]),
      references: z.array(z.object({ name: z.string().max(40), text: z.string().max(120) })).max(3).default([]),
      views_count: z.number().int().min(0).default(0),
      main_photo_url: z.string().url().optional()
    })
    .optional()
});

type Payload = z.infer<typeof generateStoryImageSchema>;

const TEMPLATE_STYLES: Record<number, { bg: string; accent: string; card: string }> = {
  1: { bg: "linear-gradient(180deg, #f9d7e2 0%, #fff7fb 100%)", accent: "#a13d63", card: "#ffffffcc" },
  2: { bg: "linear-gradient(180deg, #f4e4cf 0%, #fffaf2 100%)", accent: "#7f4e34", card: "#fffdf8dd" },
  3: { bg: "linear-gradient(180deg, #ff8ab0 0%, #ffd166 100%)", accent: "#59235f", card: "#ffffffcc" },
  4: { bg: "linear-gradient(180deg, #1d1028 0%, #2e1a47 100%)", accent: "#f3b6d6", card: "#00000066" }
};

function chip(label: string, color: string) {
  return (
    <span
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        border: `1px solid ${color}`,
        color,
        fontSize: 28,
        marginRight: 8,
        marginBottom: 8,
        display: "inline-flex"
      }}
    >
      {label}
    </span>
  );
}

function StoryTemplate({ payload }: { payload: Payload }) {
  const style = TEMPLATE_STYLES[payload.template_id];
  const cv = payload.cv!;
  const alias = cv.alias ?? cv.name;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: style.bg,
        color: payload.template_id === 4 ? "#f8eef5" : "#2c1d28",
        padding: 52,
        fontFamily: "Inter, ui-sans-serif, system-ui"
      }}
    >
      <div style={{ fontSize: 44, opacity: 0.85 }}>{payload.customizations.custom_text ?? "No des swipe. Preséntate."}</div>
      <div style={{ display: "flex", marginTop: 24, gap: 24, alignItems: "center" }}>
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: payload.template_id === 1 ? 24 : 999,
            background: "#ffffff66",
            border: `3px solid ${style.accent}`
          }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1 }}>{alias}</div>
          <div style={{ fontSize: 30, opacity: 0.8 }}>{cv.city ?? "Ciudad"} · {cv.emotional_state ?? "Explorando"}</div>
        </div>
      </div>

      <div style={{ marginTop: 28, fontSize: 42, fontWeight: 600, color: style.accent }}>“{cv.looking_for}”</div>

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 16, background: style.card, borderRadius: 28, padding: 28 }}>
        <div style={{ fontSize: 30, fontWeight: 600 }}>Green Flags</div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>{cv.green_flags.slice(0, 5).map((flag) => chip(flag, "#238b45"))}</div>

        {payload.customizations.show_red_flags ? (
          <>
            <div style={{ fontSize: 30, fontWeight: 600 }}>Red Flags</div>
            <div style={{ display: "flex", flexWrap: "wrap" }}>{cv.red_flags.slice(0, 5).map((flag) => chip(flag, "#c92a2a"))}</div>
          </>
        ) : null}

        <div style={{ fontSize: 30, fontWeight: 600 }}>Idiomas del amor</div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>{cv.love_languages.slice(0, 5).map((lang) => chip(lang, style.accent))}</div>
      </div>

      {payload.customizations.show_references && cv.references.length > 0 ? (
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 28, fontWeight: 600 }}>Referencias</div>
          {cv.references.slice(0, 2).map((ref, idx) => (
            <div key={`${ref.name}-${idx}`} style={{ fontSize: 24, opacity: 0.9 }}>
              “{ref.text}” — {ref.name}
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", fontSize: 24, opacity: 0.8 }}>
        <span>Visto por {cv.views_count} personas</span>
        <span>{payload.customizations.remove_watermark ? "" : "curriculumdelamor.app"}</span>
      </div>
    </div>
  );
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = generateStoryImageSchema.safeParse(json);

  if (!parsed.success || !parsed.data.cv) {
    return Response.json(
      { error: "Payload inválido. Incluye template_id y datos cv para render rápido." },
      { status: 400 }
    );
  }

  // Nota de seguridad: en producción debe validarse que auth.uid() sea dueño de cv_id
  // y aplicar cache por cv_content_hash + template_id + customizations.
  const image = new ImageResponse(<StoryTemplate payload={parsed.data} />, {
    width: 1080,
    height: 1920
  });

  return image;
}
