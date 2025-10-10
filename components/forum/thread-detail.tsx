'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/components/session-provider';
import { ForumThreadDetail } from '@/lib/api';
import { toast } from 'sonner';
import { ShareMenu } from '@/components/shared/share-menu';

interface Props {
  thread: ForumThreadDetail;
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export function ThreadDetail({ thread }: Props) {
  const session = useSession();
  const isFollowing = session.isThreadFollowed(thread.id);

  const toggleFollow = () => {
    session.toggleThreadFollow(thread.id);
    toast.success(isFollowing ? 'Dejaste de seguir el hilo' : 'Hilo seguido', {
      description: thread.title
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text">{thread.title}</h1>
          <p className="text-sm text-text-muted">Creado por {thread.author}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={isFollowing ? 'default' : 'outline'} onClick={toggleFollow}>
            {isFollowing ? 'Siguiendo hilo' : 'Seguir hilo'}
          </Button>
          <ShareMenu
            title={`Foro: ${thread.title}`}
            description={`Únete a la conversación de ${thread.author} en TKN.`}
            url={`${session.referralLink}&thread=${thread.id}`}
            buttonLabel="Compartir hilo"
          />
        </div>
      </header>
      <Card className="space-y-4 p-6">
        <p className="text-sm text-text">{thread.body}</p>
      </Card>
      <section className="space-y-4">
        {thread.posts.map((post) => (
          <Card key={post.id} className="space-y-3 p-5">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>@{post.author}</span>
              <span>{DATE_TIME_FORMATTER.format(new Date(post.createdAt))}</span>
            </div>
            <p className="text-sm text-text">{post.body}</p>
            {post.mediaThumb ? (
              <div className="overflow-hidden rounded-2xl">
                <Image src={post.mediaThumb} alt="Adjunto" width={480} height={270} className="h-auto w-full object-cover" />
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => toast('Reporte enviado')}>
                Reportar
              </Button>
              <ShareMenu
                title={`Comentario en ${thread.title}`}
                description={`@${post.author} participa en el foro de TKN.`}
                url={`${session.referralLink}&post=${post.id}`}
                buttonLabel="Compartir"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => session.toggleBookmark(post.id)}
                aria-label="Guardar hilo"
              >
                {session.isPostBookmarked(post.id) ? 'Guardado' : 'Guardar'}
              </Button>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
