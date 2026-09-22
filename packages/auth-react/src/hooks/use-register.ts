"use client";

import { useState, useCallback } from "react";
import { register, ApiResponseError } from "@dcentervn/api-client";
import type { RegisterValues, RegisterErrors } from "@dcentervn/auth-core";

export type { RegisterValues, RegisterErrors };

export function useRegister() {
  const [values, setValues] = useState<RegisterValues>({
    email: "",
    password: "",
    displayName: "",
    phone: "",
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = useCallback((): boolean => {
    const newErrors: RegisterErrors = {};

    if (!values.displayName.trim()) {
      newErrors.displayName = "Tên hiển thị là bắt buộc";
    } else if (values.displayName.length > 50) {
      newErrors.displayName = "Tên hiển thị tối đa 50 ký tự";
    }

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

    if (values.phone && !/^\+?[0-9]{9,15}$/.test(values.phone.replace(/[\s-]/g, ""))) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values]);

  const handleChange = useCallback(
    (field: keyof RegisterValues, value: string) => {
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
        await register({
          email: values.email.trim(),
          password: values.password,
          display_name: values.displayName.trim(),
          phone: values.phone.trim() || undefined,
        });

        setIsSuccess(true);
        return true;
      } catch (err: unknown) {
        if (err instanceof ApiResponseError) {
          if (err.status === 409) {
            setErrorMessage("Email hoặc số điện thoại này đã được đăng ký.");
          } else {
            setErrorMessage(err.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
          }
        } else {
          setErrorMessage("Không thể kết nối tới máy chủ. Vui lòng thử lại sau.");
        }
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [validate, values],
  );

  return {
    values,
    errors,
    isSubmitting,
    errorMessage,
    isSuccess,
    handleChange,
    handleSubmit,
  };
}
