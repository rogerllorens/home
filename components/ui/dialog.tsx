'use client';

import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import * as React from 'react';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';

interface DialogRootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogRootProps) {
  return (
    <Transition show={open} as={Fragment} appear>
      <HeadlessDialog onClose={onOpenChange} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-12">
            {children}
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogContent({ children, className }: DialogContentProps) {
  return (
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-200"
      enterFrom="opacity-0 scale-95"
      enterTo="opacity-100 scale-100"
      leave="ease-in duration-150"
      leaveFrom="opacity-100 scale-100"
      leaveTo="opacity-0 scale-95"
    >
      <HeadlessDialog.Panel
        className={cn(
          'w-full max-w-lg rounded-3xl border border-muted/60 bg-surface/95 p-6 text-text shadow-2xl',
          className
        )}
      >
        {children}
      </HeadlessDialog.Panel>
    </Transition.Child>
  );
}

export const DialogHeader: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children
}) => <div className={cn('space-y-1 text-left', className)}>{children}</div>;

export const DialogFooter: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children
}) => <div className={cn('mt-4 flex flex-wrap justify-end gap-2', className)}>{children}</div>;

export const DialogTitle: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <HeadlessDialog.Title className={cn('text-lg font-heading font-semibold text-text', className)}>
    {children}
  </HeadlessDialog.Title>
);

export const DialogDescription: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children
}) => (
  <HeadlessDialog.Description className={cn('text-sm text-text-muted', className)}>
    {children}
  </HeadlessDialog.Description>
);

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({ open, onOpenChange, title, description, children }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          {title ? <DialogTitle className="text-xl">{title}</DialogTitle> : null}
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="mt-6 space-y-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
