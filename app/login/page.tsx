import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Đăng nhập — ColdChain HQ",
  description: "Xác thực đăng nhập tài khoản cán bộ vận hành chi nhánh",
};

export default function LoginPage() {
  return <LoginForm />;
}
