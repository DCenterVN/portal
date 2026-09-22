"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { activate, ApiResponseError } from "@dcentervn/api-client";

export function useActivate() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") ?? "";

  const [token, setToken] = useState(initialToken);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (tokenToUse?: string): Promise<boolean> => {
      const activeToken = (tokenToUse ?? token).trim();
      if (!activeToken) {
        setErrorMessage("Mã kích hoạt là bắt buộc");
        return false;
      }

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        await activate({ token: activeToken });
        setIsSuccess(true);
        return true;
      } catch (err: unknown) {
        if (err instanceof ApiResponseError) {
          setErrorMessage(err.message || "Mã kích hoạt không hợp lệ hoặc đã hết hạn.");
        } else {
          setErrorMessage("Không thể kết nối tới máy chủ. Vui lòng thử lại sau.");
        }
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (initialToken) {
      void handleSubmit(initialToken);
    }
  }, [initialToken, handleSubmit]);

  return {
    token,
    setToken,
    isSubmitting,
    errorMessage,
    isSuccess,
    handleSubmit,
  };
}
