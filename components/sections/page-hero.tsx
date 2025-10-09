import { Badge } from "@/components/ui/badge";

export function PageHero({ title, description, eyebrow }: { title: string; description?: string; eyebrow?: string }) {
  return (
    <div className="container py-16">
      <div className="max-w-3xl space-y-4">
        {eyebrow ? <Badge variant="glass">{eyebrow}</Badge> : null}
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
        {description ? <p className="text-lg text-muted">{description}</p> : null}
      </div>
    </div>
  );
}
