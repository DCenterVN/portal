export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  status: string;
  avatarUrl?: string;
}

export interface AuthSession {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface FormStatusState {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
}

export interface LoginValues {
  email: string;
  password: string;
}

export interface LoginErrors {
  email?: string;
  password?: string;
}

export interface RegisterValues {
  email: string;
  password: string;
  displayName: string;
  phone: string;
}

export interface RegisterErrors {
  email?: string;
  password?: string;
  displayName?: string;
  phone?: string;
}

export interface ActivateValues {
  token: string;
}

export interface ActivateErrors {
  token?: string;
}

export interface ForgotPasswordValues {
  email: string;
}

export interface ForgotPasswordErrors {
  email?: string;
}

export interface ResetPasswordValues {
  token: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface ResetPasswordErrors {
  token?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface EmailChangeValues {
  newEmail: string;
  currentPassword: string;
}

export interface EmailChangeErrors {
  newEmail?: string;
  currentPassword?: string;
}

export interface EmailConfirmValues {
  token: string;
}

export interface EmailConfirmErrors {
  token?: string;
}
