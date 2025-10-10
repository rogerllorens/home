'use client';

import { create } from 'zustand';

interface UiState {
  isGiftDrawerOpen: boolean;
  isChatDrawerOpen: boolean;
  isNotificationPanelOpen: boolean;
  isMobileNavOpen: boolean;
  giftBurst: number;
  giftBurstTokens: number;
  giftBurstName: string | null;
  toggleGiftDrawer: (open?: boolean) => void;
  toggleChatDrawer: (open?: boolean) => void;
  toggleNotificationPanel: (open?: boolean) => void;
  toggleMobileNav: (open?: boolean) => void;
  registerGiftEvent: (payload: { name: string; tokens: number }) => void;
  resetGiftBurst: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isGiftDrawerOpen: false,
  isChatDrawerOpen: false,
  isNotificationPanelOpen: false,
  isMobileNavOpen: false,
  giftBurst: 0,
  giftBurstTokens: 0,
  giftBurstName: null,
  toggleGiftDrawer: (open) => set((state) => ({ isGiftDrawerOpen: open ?? !state.isGiftDrawerOpen })),
  toggleChatDrawer: (open) => set((state) => ({ isChatDrawerOpen: open ?? !state.isChatDrawerOpen })),
  toggleNotificationPanel: (open) =>
    set((state) => ({ isNotificationPanelOpen: open ?? !state.isNotificationPanelOpen })),
  toggleMobileNav: (open) => set((state) => ({ isMobileNavOpen: open ?? !state.isMobileNavOpen })),
  registerGiftEvent: ({ name, tokens }) =>
    set((state) => ({
      giftBurst: state.giftBurst + 1,
      giftBurstTokens: state.giftBurstTokens + tokens,
      giftBurstName: name
    })),
  resetGiftBurst: () => set({ giftBurst: 0, giftBurstTokens: 0, giftBurstName: null })
}));
