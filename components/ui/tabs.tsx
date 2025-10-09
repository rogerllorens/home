'use client';

import { Tab } from '@headlessui/react';
import { cn } from '@/lib/utils';
import { Fragment } from 'react';

type TabsProps<T extends string> = {
  tabs: { id: T; label: string; content: React.ReactNode }[];
  selected: T;
  onChange: (id: T) => void;
  className?: string;
};

export function Tabs<T extends string>({ tabs, selected, onChange, className }: TabsProps<T>) {
  return (
    <Tab.Group
      as="div"
      selectedIndex={tabs.findIndex((tab) => tab.id === selected)}
      onChange={(index) => {
        const tab = tabs[index];
        if (tab) onChange(tab.id);
      }}
      className={className}
    >
      <Tab.List className="flex gap-2 rounded-full bg-muted/40 p-1">
        {tabs.map((tab) => (
          <Tab key={tab.id} as={Fragment}>
            {({ selected: isSelected }) => (
              <button
                className={cn(
                  'flex-1 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  isSelected ? 'bg-surface shadow text-text' : 'text-text-muted hover:text-text'
                )}
              >
                {tab.label}
              </button>
            )}
          </Tab>
        ))}
      </Tab.List>
      <div className="mt-4">
        {tabs.map((tab) => (
          <Tab.Panel key={tab.id} className="focus-visible:outline-none">
            {tab.content}
          </Tab.Panel>
        ))}
      </div>
    </Tab.Group>
  );
}
