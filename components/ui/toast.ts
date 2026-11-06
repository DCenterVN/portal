// Screens call toast.success/error(title, { description }). eslint FR-2 keeps any "sonner" import path out of app/ and
// features/, so they reach sonner (toast) and the shadcn Toaster through this file.
export { toast } from "sonner";
export { Toaster } from "./sonner";
