"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { nativeLogin, ApiResponseError } from "@dcentervn/api-client";
import type { LoginValues, LoginErrors } from "@dcentervn/auth-core";
import { useAuthSession } from "../context/auth-context";

export type { LoginValues, LoginErrors };

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthSession();

  const [values, setValues] = useState<LoginValues>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validate = useCallback((): boolean => {
    const newErrors: LoginErrors = {};

    if (!values.email.trim()) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      newErrors.email = "Định dạng email không hợp lệ";
    }

    if (!values.password) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (values.password.length < 8) {
      newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values]);

  const handleChange = useCallback(
    (field: keyof LoginValues, value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      setErrorMessage(null);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent): Promise<boolean> => {
      if (e) e.preventDefault();

      if (!validate()) {
        return false;
      }

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        const response = await nativeLogin({
          email: values.email.trim(),
          password: values.password,
        });

        await login(response.access_token, response.refresh_token);

        const returnTo = searchParams.get("returnTo") ?? "/ops/dashboard";
        router.push(returnTo);
        return true;
      } catch (err: unknown) {
        if (err instanceof ApiResponseError) {
          if (err.status === 401) {
            setErrorMessage("Thông tin đăng nhập hoặc mật khẩu không đúng.");
          } else if (err.code === "user_not_active") {
            setErrorMessage("Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email.");
          } else {
            setErrorMessage(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
          }
        } else {
          setErrorMessage("Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng.");
        }
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [validate, values, login, searchParams, router],
  );

  return {
    values,
    errors,
    isSubmitting,
    errorMessage,
    handleChange,
    handleSubmit,
  };
}
