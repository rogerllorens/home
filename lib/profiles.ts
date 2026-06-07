export type UserRole = "customer" | "admin";

export type RankeliaUser = {
  id: string;
  email: string;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  company_name: string | null;
  default_platform: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type CreditWallet = {
  user_id: string;
  balance: number;
  lifetime_used: number;
  created_at: string;
  updated_at: string;
};

export type AuthUserContext = {
  user: RankeliaUser | null;
  profile: Profile | null;
  wallet: CreditWallet | null;
};

export const DEFAULT_PROFILE_PLATFORM = "generic";
