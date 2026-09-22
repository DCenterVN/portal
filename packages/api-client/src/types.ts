export interface ApiError {
  status: number;
  code: string;
  message: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface ActivateRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface EmailChangeRequest {
  new_email: string;
  current_password: string;
}

export interface EmailChangeConfirmRequest {
  token: string;
}
