// Primitives
export { Alert } from "./primitives/alert";
export type { AlertProps, AlertVariant } from "./primitives/alert";

export { Badge } from "./primitives/badge";
export type { BadgeProps, BadgeVariant } from "./primitives/badge";

export { Button } from "./primitives/button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./primitives/button";

export { Card } from "./primitives/card";
export type { CardProps, CardVariant } from "./primitives/card";

export { Input } from "./primitives/input";
export type { InputProps } from "./primitives/input";

export { Skeleton } from "./primitives/skeleton";

export {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "./primitives/dialog";
export type { DialogProps } from "./primitives/dialog";

export { Toast, ToastProvider, ToastContainer, useToast } from "./primitives/toast";
export type { ToastProps, ToastVariant, ToastItem } from "./primitives/toast";

export { ProductCard } from "./primitives/product-card";
export type { ProductCardProps } from "./primitives/product-card";

export { QuantityPicker } from "./primitives/quantity-picker";
export type { QuantityPickerProps } from "./primitives/quantity-picker";

export { OrgSwitcher } from "./primitives/org-switcher";
export type { OrgSwitcherProps, BranchOption } from "./primitives/org-switcher";

// Shells
export { AppShell } from "./shells/app-shell";
export type { AppShellProps } from "./shells/app-shell";

export { AuthShell } from "./shells/auth-shell";
export type { AuthShellProps } from "./shells/auth-shell";

export { PublicShell } from "./shells/public-shell";
export type { PublicShellProps } from "./shells/public-shell";

export { StorefrontShell } from "./shells/storefront-shell";
export type { StorefrontShellProps } from "./shells/storefront-shell";

// Auth Views
export { LoginView } from "./auth/login-view";
export type { LoginViewProps } from "./auth/login-view";

export { RegisterView } from "./auth/register-view";
export type { RegisterViewProps } from "./auth/register-view";

export { ActivateView } from "./auth/activate-view";
export type { ActivateViewProps } from "./auth/activate-view";

export { ForgotPasswordView } from "./auth/forgot-password-view";
export type { ForgotPasswordViewProps } from "./auth/forgot-password-view";

export { ResetPasswordView } from "./auth/reset-password-view";
export type { ResetPasswordViewProps } from "./auth/reset-password-view";

export { EmailChangeView } from "./auth/email-change-view";
export type { EmailChangeViewProps } from "./auth/email-change-view";

export { EmailConfirmView } from "./auth/email-confirm-view";
export type { EmailConfirmViewProps } from "./auth/email-confirm-view";

// Theme
export { ThemeProvider, useTheme } from "./hooks/use-theme";
export type { Theme, ThemeContextValue } from "./hooks/use-theme";
