'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: 'left' | 'right' | 'bottom';
  title?: string;
  children: React.ReactNode;
}

export function Drawer({ open, onOpenChange, side = 'right', title, children }: DrawerProps) {
  const translateClass =
    side === 'bottom'
      ? 'translate-y-full'
      : side === 'left'
      ? '-translate-x-full'
      : 'translate-x-full';

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onOpenChange} className="relative z-40">
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        </Transition.Child>
        <div className="fixed inset-0 flex" aria-hidden={!open}>
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-out duration-200"
            enterFrom={translateClass}
            enterTo="translate-x-0"
            leave="transform transition ease-in duration-150"
            leaveFrom="translate-x-0"
            leaveTo={translateClass}
          >
            <Dialog.Panel
              className={`flex h-full w-full max-w-md ${side === 'bottom' ? 'mx-auto max-h-[85vh]' : ''}`}
            >
              <div className="glass-surface relative flex h-full w-full flex-col rounded-none border-l border-muted/40 bg-surface/95 p-6 shadow-xl">
                {title ? <Dialog.Title className="text-lg font-heading font-semibold">{title}</Dialog.Title> : null}
                <div className="mt-4 flex-1 overflow-y-auto space-y-4">{children}</div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
