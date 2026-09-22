"use client";

import { useState, useCallback } from "react";
import { requestEmailChange, ApiResponseError } from "@dcentervn/api-client";
import { useAuthSession } from "../context/auth-context";

export function useEmailChange() {
  const { accessToken } = useAuthSession();

  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [errors, setErrors] = useState<{
    newEmail?: string;
    currentPassword?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = useCallback((): boolean => {
    const newErrors: typeof errors = {};

    if (!newEmail.trim()) {
      newErrors.newEmail = "Email mới là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      newErrors.newEmail = "Định dạng email mới không hợp lệ";
    }

    if (!currentPassword) {
      newErrors.currentPassword = "Mật khẩu hiện tại là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [newEmail, currentPassword]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent): Promise<boolean> => {
      if (e) e.preventDefault();

      if (!validate()) {
        return false;
      }

      if (!accessToken) {
        setErrorMessage("Vui lòng đăng nhập để thực hiện thay đổi email.");
        return false;
      }

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        await requestEmailChange(
          {
            new_email: newEmail.trim(),
            current_password: currentPassword,
          },
          accessToken,
        );

        setIsSuccess(true);
        return true;
      } catch (err: unknown) {
        if (err instanceof ApiResponseError) {
          if (err.status === 401) {
            setErrorMessage("Mật khẩu hiện tại không chính xác.");
          } else if (err.status === 409) {
            setErrorMessage("Email này đã được sử dụng bởi tài khoản khác.");
          } else {
            setErrorMessage(err.message || "Yêu cầu đổi email thất bại. Vui lòng thử lại.");
          }
        } else {
          setErrorMessage("Không thể kết nối tới máy chủ. Vui lòng thử lại sau.");
        }
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [validate, accessToken, newEmail, currentPassword],
  );

  return {
    newEmail,
    setNewEmail: (val: string) => {
      setNewEmail(val);
      setErrors((prev) => ({ ...prev, newEmail: undefined }));
    },
    currentPassword,
    setCurrentPassword: (val: string) => {
      setCurrentPassword(val);
      setErrors((prev) => ({ ...prev, currentPassword: undefined }));
    },
    errors,
    isSubmitting,
    errorMessage,
    isSuccess,
    handleSubmit,
  };
}
