import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/patterns/password-input";
import { ActionButton } from "@/components/patterns/action-button";

type Props = {
  id: string;
  busy: boolean;
  /** Submit stays locked while a rate-limit countdown runs. */
  locked: boolean;
  error: string;
  /** Link shown inside the error alert (resend activation, customer sign-in). */
  errorAction?: ReactNode;
  forgotHref: Route;
  /** Every string comes from the caller's own message namespace. */
  text: { identifier: string; phIdentifier: string; password: string; phPassword: string; passwordRange: string; forgot: string; login: string; loginPending: string };
};

// The fields of one sign-in form, shared by the customer and staff journeys; state and submit live in hooks/use-login-form; each journey keeps its own <form>, API call and copy.
export function LoginFields({ id, busy, locked, error, errorAction, forgotHref, text }: Props) {
  const invalid = error ? true : undefined;
  const describedBy = error ? `${id}-error` : undefined;
  return (
    <>
      {error && (
        <InlineAlert id={`${id}-error`}>
          {error}
          {errorAction}
        </InlineAlert>
      )}
      <div className="grid gap-2">
        <Label htmlFor={`${id}-identifier`}>{text.identifier}</Label>
        <Input id={`${id}-identifier`} name="identifier" placeholder={text.phIdentifier} autoComplete="username" required disabled={busy} aria-invalid={invalid} aria-describedby={describedBy} />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center">
          <Label htmlFor={`${id}-password`}>{text.password}</Label>
          <Link href={forgotHref} className="ml-auto text-sm underline-offset-4 hover:underline">
            {text.forgot}
          </Link>
        </div>
        <PasswordInput id={`${id}-password`} name="password" placeholder={text.phPassword} autoComplete="current-password" required disabled={busy} aria-invalid={invalid} aria-describedby={describedBy} />
        <p className="text-xs text-muted-foreground">{text.passwordRange}</p>
      </div>
      <ActionButton type="submit" pending={busy} pendingLabel={text.loginPending} disabled={locked} className="w-full">
        {text.login}
      </ActionButton>
    </>
  );
}
