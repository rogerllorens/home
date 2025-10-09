'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/auth';

export function AgeGate() {
  const t = useTranslations('forms');
  const ageConfirmed = useAuthStore((state) => state.ageConfirmed);
  const markAgeConfirmed = useAuthStore((state) => state.markAgeConfirmed);
  const [open, setOpen] = useState(!ageConfirmed);

  useEffect(() => {
    setOpen(!ageConfirmed);
  }, [ageConfirmed]);

  const handleConfirm = () => {
    markAgeConfirmed();
    setOpen(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleConfirm();
      }}
      title="Bienvenido"
      description="Esta plataforma está dirigida a mayores de 18 años."
    >
      <p className="text-sm text-text-muted">{t('ageConfirm')}</p>
      <Button onClick={handleConfirm}>{t('ageConfirm')}</Button>
    </Modal>
  );
}
