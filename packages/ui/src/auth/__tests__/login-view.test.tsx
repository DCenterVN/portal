import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LoginView } from "../login-view";

const mockHandleSubmit = vi.fn((e) => {
  if (e) e.preventDefault();
  return Promise.resolve(false);
});
const mockHandleChange = vi.fn();

let mockHookState = {
  values: { email: "", password: "" },
  errors: {} as { email?: string; password?: string },
  isSubmitting: false,
  errorMessage: null as string | null,
  handleChange: mockHandleChange,
  handleSubmit: mockHandleSubmit,
};

describe("LoginView Presentational Component", () => {
  it("renders login form elements cleanly", () => {
    render(<LoginView {...mockHookState} />);

    expect(screen.getByRole("heading", { level: 1, name: /đăng nhập/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email công việc/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /đăng nhập hệ thống/i })).toBeInTheDocument();
  });

  it("calls handleChange when user types in inputs", () => {
    render(<LoginView {...mockHookState} />);

    const emailInput = screen.getByLabelText(/email công việc/i);
    fireEvent.change(emailInput, { target: { value: "user@vietsach.vn" } });

    expect(mockHandleChange).toHaveBeenCalledWith("email", "user@vietsach.vn");
  });

  it("renders error message when provided by the hook", () => {
    const errorState = {
      ...mockHookState,
      errorMessage: "Thông tin đăng nhập không chính xác",
    };

    render(<LoginView {...errorState} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Thông tin đăng nhập không chính xác");
  });

  it("disables button and shows loading state during submission", () => {
    const submittingState = {
      ...mockHookState,
      isSubmitting: true,
      errorMessage: null,
    };

    render(<LoginView {...submittingState} />);

    const button = screen.getByRole("button", { name: /đang xác thực.../i });
    expect(button).toBeDisabled();
  });
});
