/**
 * Framework-neutral auth input validation rules
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\+?[0-9]{9,15}$/;

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return "Email là bắt buộc";
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return "Định dạng email không hợp lệ";
  }
  return null;
}

export function validatePassword(password: string, minLength = 8): string | null {
  if (!password) {
    return "Mật khẩu là bắt buộc";
  }
  if (password.length < minLength) {
    return `Mật khẩu phải có ít nhất ${minLength} ký tự`;
  }
  return null;
}

export function validateDisplayName(name: string, maxLength = 50): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Tên hiển thị là bắt buộc";
  }
  if (trimmed.length > maxLength) {
    return `Tên hiển thị tối đa ${maxLength} ký tự`;
  }
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s-]/g, "");
  if (!PHONE_REGEX.test(cleaned)) {
    return "Số điện thoại không hợp lệ";
  }
  return null;
}

export function validateToken(token: string): string | null {
  if (!token.trim()) {
    return "Mã xác thực là bắt buộc";
  }
  return null;
}
