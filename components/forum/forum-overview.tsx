'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ForumThreadSummary } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Flame, Images, MessageSquare, Sparkles, Stars, Upload } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
  threads: number;
  posts?: number;
  prompt?: string;
}

interface Props {
  categories: Category[];
  threads: ForumThreadSummary[];
}

const ICONS: Record<string, ReactNode> = {
  general: <Sparkles className="h-4 w-4" aria-hidden />,
  creadores: <Stars className="h-4 w-4" aria-hidden />,
  support: <MessageSquare className="h-4 w-4" aria-hidden />,
  busquedas: <Flame className="h-4 w-4" aria-hidden />,
  fotos: <Images className="h-4 w-4" aria-hidden />
};

export function ForumOverview({ categories, threads }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [draft, setDraft] = useState('');
  const [attachmentsCount] = useState(0);

  const filteredCategories = useMemo(() => {
    if (activeCategory === 'all') return categories;
    return categories.filter((category) => category.id === activeCategory);
  }, [activeCategory, categories]);

  const filteredThreads = useMemo(() => {
    if (activeCategory === 'all') return threads;
    return threads.filter((thread) => thread.categoryId === activeCategory);
  }, [activeCategory, threads]);

  const latest = filteredThreads.slice(0, 5);
  const topWeekly = filteredThreads
    .slice()
    .sort((a, b) => b.replies - a.replies)
    .slice(0, 5);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <section className="space-y-6">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por categoría">
          <Chip selected={activeCategory === 'all'} onClick={() => setActiveCategory('all')} role="tab" aria-selected={activeCategory === 'all'}>
            Todas
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category.id}
              selected={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
              role="tab"
              aria-selected={activeCategory === category.id}
            >
              {category.name}
            </Chip>
          ))}
        </div>
        {filteredCategories.map((category) => (
          <Card key={category.id} className="space-y-4 p-6" role="region" aria-labelledby={`forum-cat-${category.id}`}>
            <div className="flex items-start justify-between gap-6">
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted/30">
                    {ICONS[category.id] ?? <MessageSquare className="h-4 w-4" aria-hidden />}
                  </span>
                  {category.threads} hilos · {category.posts ?? 0} posts
                </span>
                <h3 id={`forum-cat-${category.id}`} className="text-lg font-semibold text-text">
                  {category.name}
                </h3>
                <p className="text-sm text-text-muted">{category.description ?? 'Nueva categoría, pronto más detalles.'}</p>
                {category.prompt ? (
                  <Badge variant="outline" className="w-fit rounded-full border-accent/30 bg-accent/10 text-xs text-accent">
                    {category.prompt}
                  </Badge>
                ) : null}
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href={`/forum/${category.id}`}>Ver hilos</Link>
              </Button>
            </div>
            <div className="space-y-2 text-sm text-text-muted">
              {filteredThreads
                .filter((thread) => thread.categoryId === category.id)
                .slice(0, 3)
                .map((thread) => (
                  <Link
                    key={thread.id}
                    href={`/forum/${thread.id}`}
                    className="flex items-center justify-between rounded-2xl border border-muted/40 bg-muted/20 px-4 py-2 text-text hover:border-accent"
                  >
                    <span className="truncate pr-4">{thread.title}</span>
                    <span className="text-xs text-text-muted">{thread.replies} respuestas</span>
                  </Link>
                ))}
            </div>
          </Card>
        ))}
        <div className="sticky bottom-4 z-10 rounded-3xl border border-muted/60 bg-surface/95 p-6 shadow-lg backdrop-blur" aria-label="Nuevo hilo rápido">
          <h4 className="text-sm font-semibold text-text">Publicar al vuelo</h4>
          <p className="text-xs text-text-muted">
            Adjunta hasta 5 archivos (1 vídeo máx). Imágenes ≤25&nbsp;MB · Vídeos ≤200&nbsp;MB.
          </p>
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, 500))}
            placeholder="Comparte una historia caliente o preséntate a la comunidad…"
            className="mt-3 min-h-[110px] rounded-2xl border border-muted/40 bg-muted/30"
            maxLength={500}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
            <span>
              {draft.length}/500 caracteres · Adjuntos {attachmentsCount}/5
            </span>
            <Button size="sm" className="inline-flex items-center gap-2" disabled>
              <Upload className="h-4 w-4" aria-hidden /> Próximamente
            </Button>
          </div>
        </div>
      </section>
      <aside className="space-y-4 rounded-3xl border border-muted/60 bg-muted/30 p-6" role="complementary">
        <div>
          <h4 className="text-lg font-semibold text-text">Top hilos de la semana</h4>
          <p className="text-xs text-text-muted">Basado en respuestas, likes y gifts recibidos en los últimos 7 días.</p>
          <ul className="mt-4 space-y-3 text-sm text-text-muted">
            {topWeekly.map((thread, index) => (
              <li key={thread.id} className="flex flex-col rounded-2xl border border-muted/40 bg-muted/20 p-3">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span className="inline-flex items-center gap-2 font-semibold text-text">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-accent">
                      #{index + 1}
                    </span>
                    <Link href={`/forum/${thread.id}`} className="text-text hover:text-accent">
                      {thread.title}
                    </Link>
                  </span>
                  <span>{thread.replies} respuestas</span>
                </div>
                <span className="text-[0.7rem] text-text-muted/70">por {thread.author}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-text">Últimos hilos</h4>
          <ul className="space-y-3 text-sm text-text-muted">
            {latest.map((thread) => (
              <li key={thread.id} className="flex flex-col">
                <Link href={`/forum/${thread.id}`} className="text-text hover:text-accent">
                  {thread.title}
                </Link>
                <span className="text-xs text-text-muted/70">por {thread.author} · {thread.replies} respuestas</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
