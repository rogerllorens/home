import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/page-hero";

const eyebrowLabel: Record<string, string> = {
  es: "Comparativa",
  en: "Comparison"
};

export default async function ComparePage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "compare" });
  const table = t.raw("table") as { headers: string[]; rows: string[][] };

  return (
    <div className="space-y-12">
      <PageHero title={t("title")} description={t("intro")} eyebrow={eyebrowLabel[params.locale] ?? "Comparison"} />
      <section className="container overflow-hidden rounded-3xl border border-white/10">
        <table className="w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/10 text-left">
            <tr>
              {table.headers.map((header) => (
                <th key={header} className="px-6 py-4 font-semibold uppercase tracking-wide">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, index) => (
              <tr key={index} className="odd:bg-white/[0.03]">
                {row.map((cell, cellIndex) => (
                  <td key={`${cell}-${cellIndex}`} className="px-6 py-4">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
