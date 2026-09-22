"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword, ApiResponseError } from "@dcentervn/api-client";

export function useResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") ?? "";

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    token?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = useCallback((): boolean => {
    const newErrors: typeof errors = {};

    if (!token.trim()) {
      newErrors.token = "Mã token là bắt buộc";
    }

    if (!newPassword) {
      newErrors.newPassword = "Mật khẩu mới là bắt buộc";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Mật khẩu phải có ít nhất 8 ký tự";
    }

    if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [token, newPassword, confirmPassword]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent): Promise<boolean> => {
      if (e) e.preventDefault();

      if (!validate()) {
        return false;
      }

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        await resetPassword({
          token: token.trim(),
          new_password: newPassword,
        });

        setIsSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
        return true;
      } catch (err: unknown) {
        if (err instanceof ApiResponseError) {
          setErrorMessage(err.message || "Mã token không hợp lệ hoặc đã hết hạn.");
        } else {
          setErrorMessage("Không thể kết nối tới máy chủ. Vui lòng thử lại sau.");
        }
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [validate, token, newPassword, router],
  );

  return {
    token,
    setToken: (val: string) => {
      setToken(val);
      setErrors((prev) => ({ ...prev, token: undefined }));
    },
    newPassword,
    setNewPassword: (val: string) => {
      setNewPassword(val);
      setErrors((prev) => ({ ...prev, newPassword: undefined }));
    },
    confirmPassword,
    setConfirmPassword: (val: string) => {
      setConfirmPassword(val);
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    },
    errors,
    isSubmitting,
    errorMessage,
    isSuccess,
    handleSubmit,
  };
}
