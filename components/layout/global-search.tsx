'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, UserCircle2, Hash, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { searchDirectory } from '@/lib/api';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { data, isFetching } = useQuery({
    queryKey: ['global-search', query],
    queryFn: () => searchDirectory(query),
    enabled: open && query.length > 1,
    staleTime: 1000 * 10
  });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Buscar"
        onClick={() => setOpen(true)}
        className="relative"
      >
        <Search className="h-5 w-5" />
        <span className="sr-only">Abrir buscador global (⌘K)</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border border-muted/60 bg-surface">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5 text-accent" /> Buscar en la comunidad
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-text-muted">
              Consejo: usa <kbd className="rounded border border-muted/40 bg-muted/20 px-1 py-0.5 text-[0.65rem]">⌘K</kbd> o
              <kbd className="ml-1 rounded border border-muted/40 bg-muted/20 px-1 py-0.5 text-[0.65rem]">Ctrl+K</kbd> para abrir
              este buscador desde cualquier lugar.
            </p>
            <Input
              autoFocus
              placeholder="Usuarios, tags o hilos"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="rounded-2xl bg-muted/40"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <ResultColumn
                title="Perfiles"
                icon={<UserCircle2 className="h-4 w-4 text-accent" />}
                empty="Sin coincidencias"
              >
                {data?.users.map((user) => (
                  <a
                    key={user.username}
                    href={`/u/${user.username}`}
                    className="rounded-2xl border border-muted/40 bg-muted/30 p-3 text-sm text-text hover:border-accent"
                  >
                    <span className="font-semibold">@{user.username}</span>
                    <p className="text-xs text-text-muted">{user.bio}</p>
                  </a>
                ))}
              </ResultColumn>
              <ResultColumn
                title="Tags"
                icon={<Hash className="h-4 w-4 text-accent" />}
                empty="Etiqueta nueva"
              >
                {data?.tags.map((tag) => (
                  <span
                    key={tag.tag}
                    className="inline-flex items-center justify-between rounded-2xl border border-muted/40 bg-muted/20 px-3 py-2 text-xs text-text"
                  >
                    #{tag.tag}
                    <span className="text-text-muted">{tag.matches}</span>
                  </span>
                ))}
              </ResultColumn>
              <ResultColumn
                title="Hilos"
                icon={<MessageSquare className="h-4 w-4 text-accent" />}
                empty="Sin hilos"
              >
                {data?.threads.map((thread) => (
                  <a
                    key={thread.id}
                    href={`/forum/${thread.id}`}
                    className="rounded-2xl border border-muted/40 bg-muted/30 p-3 text-sm text-text hover:border-accent"
                  >
                    <span className="font-semibold">{thread.title}</span>
                    <span className="mt-1 block text-xs text-text-muted">{thread.replies} respuestas</span>
                  </a>
                ))}
              </ResultColumn>
            </div>
            {isFetching ? <p className="text-xs text-text-muted">Buscando…</p> : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ResultColumn({
  title,
  icon,
  empty,
  children
}: {
  title: string;
  icon: ReactNode;
  empty: string;
  children?: ReactNode;
}) {
  const hasChildren = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
        {icon}
        {title}
      </div>
      <div className="flex flex-col gap-2 text-sm text-text-muted">
        {hasChildren ? children : <span className="rounded-2xl border border-dashed border-muted/40 p-3">{empty}</span>}
      </div>
    </div>
  );
}
