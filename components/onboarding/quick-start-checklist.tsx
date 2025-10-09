'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Gift, Send, Video } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from '@/components/session-provider';
import { cn } from '@/lib/utils';

interface ChecklistStep {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface StoredState {
  completed: string[];
}

const STORAGE_KEY = 'tkn:onboarding-checklist';

const STEPS: ChecklistStep[] = [
  {
    id: 'first-post',
    label: 'Publica tu primer post',
    description: 'Comparte una foto o vídeo libre para presentarte y desbloquea +50 Créditos (TKN).',
    icon: Send
  },
  {
    id: 'join-random',
    label: 'Entra en un chat random',
    description: 'Prueba el match 1:1 con consentimientos y blur inicial en segundos.',
    icon: Video
  },
  {
    id: 'send-gift',
    label: 'Regala un gift',
    description: 'Envía un Heart de bienvenida y rompe el hielo con animaciones en pantalla.',
    icon: Gift
  }
];

function loadState(): StoredState {
  if (typeof window === 'undefined') return { completed: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completed: [] };
    const parsed = JSON.parse(raw) as StoredState;
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : []
    };
  } catch (error) {
    return { completed: [] };
  }
}

export function QuickStartChecklist() {
  const session = useSession();
  const [completed, setCompleted] = useState<string[]>(() => loadState().completed);
  const rewardClaimedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed }));
  }, [completed]);

  const totalSteps = STEPS.length;
  const progress = Math.round((completed.length / totalSteps) * 100);
  const allDone = completed.length === totalSteps;

  useEffect(() => {
    if (!allDone || rewardClaimedRef.current) return;
    const granted = session.claimBonus(
      'onboarding-checklist',
      50,
      '✨ Bonus de onboarding: +50 Créditos (TKN) por completar el tutorial.'
    );
    if (granted) {
      rewardClaimedRef.current = true;
    }
  }, [allDone, session]);

  const toggleStep = (id: string) => {
    setCompleted((prev) => (prev.includes(id) ? prev.filter((stepId) => stepId !== id) : [...prev, id]));
  };

  const statusCopy = useMemo(() => {
    if (allDone) return '¡Checklist completado! Los 50 Créditos (TKN) se acreditaron en tu saldo.';
    if (completed.length === 0) return 'Completa estos 3 pasos para dominar la plataforma en minutos.';
    return 'Ya dominas parte del flujo. Completa el resto y obtén +50 Créditos (TKN).';
  }, [allDone, completed.length]);

  return (
    <Card className="overflow-hidden border-accent/30 bg-gradient-to-br from-surface/80 via-muted/40 to-surface/80">
      <CardHeader className="gap-2">
        <CardTitle className="flex items-center gap-2 text-xl">
          <CheckCircle2 className="h-5 w-5 text-accent" aria-hidden />
          Tutorial express (+50 Créditos TKN)
        </CardTitle>
        <CardDescription className="text-text-muted">{statusCopy}</CardDescription>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
            aria-hidden
          />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{progress}% completo</span>
      </CardHeader>
      <CardContent className="space-y-4">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isCompleted = completed.includes(step.id);
          return (
            <div
              key={step.id}
              className={cn(
                'flex items-start gap-4 rounded-3xl border border-transparent bg-muted/20 p-4 transition hover:border-accent/40',
                isCompleted && 'border-accent/60 bg-accent/10 text-accent'
              )}
            >
              <span className="mt-1 inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-surface/80 text-accent">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="flex-1 space-y-1 text-sm">
                <p className="font-semibold text-text">{step.label}</p>
                <p className="text-text-muted">{step.description}</p>
              </div>
              <Button
                variant={isCompleted ? 'outline' : 'secondary'}
                size="sm"
                className="rounded-full"
                onClick={() => toggleStep(step.id)}
              >
                {isCompleted ? 'Listo' : 'Lo hice'}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
