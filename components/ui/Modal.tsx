import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function Modal({ title, children }: { title: string; children: ReactNode }) {
  return <Card className="mx-auto max-w-lg"><h2 className="text-xl font-bold text-slate-950">{title}</h2><div className="mt-4">{children}</div></Card>;
}
