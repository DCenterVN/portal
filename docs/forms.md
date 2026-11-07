# Forms (react-hook-form + zod)

Every form in the portal copies this shape. No wrapper or hook around `useForm`.

1. Schema in `lib/api/<domain>-validation.ts`. The BFF route validates with the same schema.
   Example: `nameSchema`, `emailSchema`, `passwordSchema` in `lib/api/account-validation.ts`
   (password adds the confirm box with `.extend` + `.refine`).
2. Form component: `useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), mode: "onTouched", defaultValues })`.
3. Each box: `Controller` + `Field`, `FieldLabel`, `FieldError` from `components/ui/field.tsx`.
   Example: `features/account/text-field.tsx`.
4. Save button: `disabled={!formState.isDirty || formState.isSubmitting}`.
5. The hook only calls the API and then `mutate` (SWR). It throws on failure.
   Example: `features/account/use-account-forms.ts`.
6. A server error goes to the right box, never a global toast:
   `form.setError("current_password", { type: "server", message })`; unknown cause: `form.setError("root", ...)`.
7. Dialog: mount the form only while open (`{open && <Form />}`) and call `form.reset()` on cancel.

Full example: `features/account/password-setting.tsx` (dialog form, server error on the current-password box).
