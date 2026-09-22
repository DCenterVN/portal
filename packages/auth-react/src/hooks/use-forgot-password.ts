"use client";

import { useState, useCallback } from "react";
import { forgotPassword, ApiResponseError } from "@dcentervn/api-client";

export function useForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = useCallback((): boolean => {
    if (!email.trim()) {
      setError("Email là bắt buộc");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Định dạng email không hợp lệ");
      return false;
    }
    setError(undefined);
    return true;
  }, [email]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent): Promise<boolean> => {
      if (e) e.preventDefault();

      if (!validate()) {
        return false;
      }

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        await forgotPassword({ email: email.trim() });
        setIsSuccess(true);
        return true;
      } catch (err: unknown) {
        if (err instanceof ApiResponseError) {
          if (err.status === 429) {
            setErrorMessage("Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi trong giây lát.");
          } else {
            setErrorMessage(err.message || "Gửi yêu cầu thất bại. Vui lòng thử lại sau.");
          }
        } else {
          setErrorMessage("Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại mạng.");
        }
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, validate],
  );

  return {
    email,
    setEmail: (val: string) => {
      setEmail(val);
      setError(undefined);
      setErrorMessage(null);
    },
    error,
    isSubmitting,
    errorMessage,
    isSuccess,
    handleSubmit,
  };
}
