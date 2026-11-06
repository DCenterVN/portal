type Json = Record<string, unknown>;
const object = (value: unknown): value is Json => !!value && typeof value === "object" && !Array.isArray(value);

export const publicError = (data: Json): Json | null => {
  const code = object(data.errors) && typeof data.errors.error_code === "string" ? data.errors.error_code : data.error;
  if (typeof code !== "string" || !code) return null;
  const fields = object(data.errors) && Array.isArray(data.errors.fields) ? data.errors.fields
    .filter((field: unknown): field is Json => object(field) && typeof field.field === "string" && typeof field.message === "string")
    .map(field => ({field: field.field, message: field.message})) : [];
  return {error: code,
    ...(typeof data.message === "string" ? {message: data.message} : {}),
    ...(typeof data.retryable === "boolean" ? {retryable: data.retryable} : {}),
    ...(typeof data.retry_after_ms === "number" && Number.isFinite(data.retry_after_ms) ? {retry_after_ms: data.retry_after_ms} : {}),
    ...(fields.length ? {errors: {fields}} : {})};
};
