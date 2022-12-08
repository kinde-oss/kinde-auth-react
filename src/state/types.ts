export type KindeUser = {
  given_name: string | null;
  id: string | null;
  family_name: string | null;
  email: string | null;
  updated_at: number;
};

export type State = {
  user?: KindeUser;
  isLoading: boolean;
  isAuthenticated: boolean;
  error?: string | undefined;
};
