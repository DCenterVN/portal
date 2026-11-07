import { uploadDocument } from "./agreement-documents";
import type { PresignAvatarResponse } from "./account-types";

export async function validateAvatar(file: File): Promise<void> {
  const supported = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
  if (!supported || file.size < 1 || file.size > 2097152) throw Error("invalidAvatar");
  const image = await createImageBitmap(file);
  try {
    if (image.width < 1 || image.height < 1 || image.width > 2048 || image.height > 2048) throw Error("invalidAvatar");
  } finally { image.close(); }
}
function uploadUrl(grant: PresignAvatarResponse, storageOrigin?: string) {
  const url = new URL(grant.upload_url);
  const origin = storageOrigin ? new URL(storageOrigin) : url;
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const secure = url.protocol === "https:" || (url.protocol === "http:" && local);
  if (url.origin !== origin.origin || url.username || url.password || !secure || grant.upload_method !== "POST" || grant.expires_in <= 0) throw Error("invalidAvatarGrant");
  return url;
}
export async function uploadAvatar(file: File, grant: PresignAvatarResponse, storageOrigin = process.env.NEXT_PUBLIC_STORAGE_ORIGIN): Promise<void> {
  const url = uploadUrl(grant, storageOrigin);
  await uploadDocument({ upload_url: url.href, form_fields: grant.form_fields }, file);
}
