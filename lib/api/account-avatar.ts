import type {PresignAvatarResponse} from "./auth/types";
export async function validateAvatar(file: File): Promise<void> {
 if(!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size<1 || file.size>2097152) throw Error("invalidAvatar");
 const image=await createImageBitmap(file);
 try {
  if(image.width<1 || image.height<1 || image.width>2048 || image.height>2048 || image.width*image.height>4194304) throw Error("invalidAvatar");
 } finally {image.close();}
}
export async function uploadAvatar(file: File,grant: PresignAvatarResponse,storageOrigin=process.env.NEXT_PUBLIC_STORAGE_ORIGIN): Promise<void> {
 if(!storageOrigin) throw Error("storageUnavailable");
 const url=new URL(grant.upload_url),origin=new URL(storageOrigin);
 const local=["localhost","127.0.0.1","[::1]"].includes(url.hostname);
 if(url.origin!==origin.origin || url.username || url.password || (url.protocol!=="https:" && !(url.protocol==="http:" && local)) || !["POST","PUT"].includes(grant.upload_method) || grant.expires_in<=0) throw Error("invalidAvatarGrant");
 const form=new FormData();
 for(const [key,value] of Object.entries(grant.form_fields)) form.append(key,value);
 form.append("file",file);
 const response=await fetch(url,{method:grant.upload_method,body:grant.upload_method==="POST" ? form : file,credentials:"omit",redirect:"error",signal:AbortSignal.timeout(30000),...(grant.upload_method==="PUT" ? {headers:{"Content-Type":file.type}} : {})});
 if(!response.ok) throw Error("uploadFailed");
}
