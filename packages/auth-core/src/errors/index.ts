/**
 * Auth domain error types and human-readable message mapping
 */

export interface AuthErrorDetails {
  status?: number;
  code?: string;
  message: string;
}

export function mapAuthErrorCode(code: string, fallbackMessage?: string): string {
  switch (code) {
    case "user_not_active":
      return "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email.";
    case "invalid_credentials":
      return "Thông tin đăng nhập hoặc mật khẩu không đúng.";
    case "token_expired":
      return "Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.";
    case "token_invalid":
      return "Mã xác thực không hợp lệ.";
    case "email_already_exists":
      return "Email này đã được đăng ký trên hệ thống.";
    default:
      return fallbackMessage || "Đã xảy ra lỗi. Vui lòng thử lại.";
  }
}
