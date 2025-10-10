'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/dialog';
import { createGroupSchema } from '@/lib/validators';
import { z } from 'zod';

const schema = createGroupSchema;

type FormValues = z.infer<typeof schema>;

interface Props {
  onCreate: (values: FormValues) => void;
}

export function GroupCreateDialog({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const onSubmit = (values: FormValues) => {
    onCreate(values);
    reset();
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Crear sala</Button>
      <Modal open={open} onOpenChange={setOpen} title="Crear sala grupal" description="Define título y precio VIP (opcional).">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="group-title">
              Título
            </label>
            <Input id="group-title" placeholder="After hours" {...register('title')} />
            {errors.title ? <p className="text-xs text-warn">{errors.title.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="group-vip-price">
              Precio VIP (Créditos TKN)
            </label>
            <Input
              id="group-vip-price"
              type="number"
              min={100}
              max={1000}
              step={50}
              {...register('vipPrice', {
                setValueAs: (value) => {
                  if (value === '' || value === null || typeof value === 'undefined') {
                    return undefined;
                  }
                  const parsed = Number(value);
                  return Number.isNaN(parsed) ? undefined : parsed;
                }
              })}
            />
            {errors.vipPrice ? (
              <p className="text-xs text-warn">{errors.vipPrice.message}</p>
            ) : (
              <p className="text-xs text-text-muted">Por defecto 300 Créditos (TKN).</p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Guardar
          </Button>
        </form>
      </Modal>
    </>
  );
}
