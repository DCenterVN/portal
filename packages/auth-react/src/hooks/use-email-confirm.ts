"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { confirmEmailChange, ApiResponseError } from "@dcentervn/api-client";
import { useAuthSession } from "../context/auth-context";

export function useEmailConfirm() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") ?? "";
  const { accessToken, logout } = useAuthSession();

  const [token, setToken] = useState(initialToken);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (tokenToUse?: string): Promise<boolean> => {
      const activeToken = (tokenToUse ?? token).trim();
      if (!activeToken) {
        setErrorMessage("Mã xác thực là bắt buộc");
        return false;
      }

      if (!accessToken) {
        setErrorMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        return false;
      }

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        await confirmEmailChange({ token: activeToken }, accessToken);
        setIsSuccess(true);
        // After email change, backend revokes all sessions, so we log out locally
        await logout();
        return true;
      } catch (err: unknown) {
        if (err instanceof ApiResponseError) {
          setErrorMessage(err.message || "Mã xác thực không hợp lệ hoặc đã hết hạn.");
        } else {
          setErrorMessage("Không thể kết nối tới máy chủ. Vui lòng thử lại sau.");
        }
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [token, accessToken, logout],
  );

  useEffect(() => {
    if (initialToken && accessToken) {
      void handleSubmit(initialToken);
    }
  }, [initialToken, accessToken, handleSubmit]);

  return {
    token,
    setToken,
    isSubmitting,
    errorMessage,
    isSuccess,
    handleSubmit,
  };
}
